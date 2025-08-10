import { Injectable, Logger } from '@nestjs/common';
import { Place } from '../place/entities/place.entity';
import { PlaceService } from '../place/place.service';
import {
  CreateBoatTicketDto,
  CreateBusTicketDto,
  CreateFlightTicketDto,
  CreateTaxiTicketDto,
  CreateTrainTicketDto,
  CreateTramTicketDto,
} from './dto';
import { Ticket, TicketType } from './entities/ticket.entity';
import { TicketRepository } from './ticket.repository';

export type CreateTicket =
  | CreateTrainTicketDto
  | CreateFlightTicketDto
  | CreateTramTicketDto
  | CreateBusTicketDto
  | CreateBoatTicketDto
  | CreateTaxiTicketDto;

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly placeService: PlaceService,
  ) {}

  /**
   * Create a single ticket with proper place handling
   */
  async createTicket(ticketData: CreateTicket): Promise<Ticket> {
    this.logger.debug(
      `Creating ${ticketData.type} ticket from ${ticketData.from.name} to ${ticketData.to.name}`,
    );

    try {
      // Validate ticket data
      this.validateTicketData(ticketData);

      // Find or create places
      const fromPlace = await this.placeService.findOrCreatePlace(
        ticketData.from,
      );
      const toPlace = await this.placeService.findOrCreatePlace(ticketData.to);

      // Find or create the ticket (avoiding duplicates)
      const ticket = await this.ticketRepository.findOrCreateTicket(
        ticketData,
        fromPlace,
        toPlace,
      );

      this.logger.log(`Created ${ticket.type} ticket with ID: ${ticket.id}`);
      return ticket;
    } catch (error) {
      this.logger.error(`Failed to create ticket: ${ticketData.type}`, error);
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Unable to create ${ticketData.type} ticket: ${error.message}`,
      );
    }
  }

  /**
   * Create multiple tickets efficiently
   */
  async createMultipleTickets(ticketsData: CreateTicket[]): Promise<Ticket[]> {
    this.logger.debug(`Creating ${ticketsData.length} tickets`);

    try {
      // Validate all tickets first
      ticketsData.forEach((ticketData) => this.validateTicketData(ticketData));

      // Extract and deduplicate places
      const allPlaces = this.extractAllPlaces(ticketsData);
      const uniquePlaces = this.placeService.getUniquePlaces(allPlaces);

      // Create all places first
      const places =
        await this.placeService.findOrCreateMultiplePlaces(uniquePlaces);
      const placeMap = this.createPlaceMap(places);

      // Create tickets with proper place references
      const tickets: Ticket[] = [];
      for (const ticketData of ticketsData) {
        const fromPlace = this.findPlaceInMap(placeMap, ticketData.from);
        const toPlace = this.findPlaceInMap(placeMap, ticketData.to);

        if (!fromPlace || !toPlace) {
          throw new Error(
            `Unable to find places for ticket: ${ticketData.from.name} -> ${ticketData.to.name}`,
          );
        }

        const ticket = await this.ticketRepository.findOrCreateTicket(
          ticketData,
          fromPlace,
          toPlace,
        );
        tickets.push(ticket);
      }

      this.logger.log(`Successfully created ${tickets.length} tickets`);
      return tickets;
    } catch (error) {
      this.logger.error(`Failed to create multiple tickets`, error);
      throw new Error(`Unable to create tickets: ${error.message}`);
    }
  }

  /**
   * Find tickets by their IDs
   */
  async findTicketsByIds(ids: string[]): Promise<Ticket[]> {
    this.logger.debug(`Finding ${ids.length} tickets by IDs`);

    try {
      return await this.ticketRepository.findByIds(ids);
    } catch (error) {
      this.logger.error(`Failed to find tickets by IDs`, error);
      throw new Error(`Unable to find tickets: ${error.message}`);
    }
  }

  /**
   * Find tickets by type
   */
  async findTicketsByType(type: TicketType): Promise<Ticket[]> {
    this.logger.debug(`Finding tickets of type: ${type}`);

    try {
      return await this.ticketRepository.findByType(type);
    } catch (error) {
      this.logger.error(`Failed to find tickets by type: ${type}`, error);
      throw new Error(`Unable to find ${type} tickets: ${error.message}`);
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStatistics(): Promise<Record<TicketType, number>> {
    this.logger.debug('Getting ticket statistics');

    try {
      return await this.ticketRepository.countByType();
    } catch (error) {
      this.logger.error('Failed to get ticket statistics', error);
      throw new Error(`Unable to get ticket statistics: ${error.message}`);
    }
  }

  /**
   * Validate ticket data based on type
   * Note: Most validation is handled by class-validator decorators in DTOs,
   * this method provides additional business logic validation
   */
  private validateTicketData(ticketData: CreateTicket): void {
    // Basic validation
    if (!ticketData.type) {
      throw new Error('Ticket type is required');
    }

    if (!Object.values(TicketType).includes(ticketData.type)) {
      throw new Error(`Invalid ticket type: ${ticketData.type}`);
    }

    if (!ticketData.from?.name) {
      throw new Error('From place name is required');
    }

    if (!ticketData.to?.name) {
      throw new Error('To place name is required');
    }

    if (
      ticketData.from.name === ticketData.to.name &&
      ticketData.from.code === ticketData.to.code
    ) {
      throw new Error('From and to places cannot be the same');
    }

    // Type-specific validation for required fields not enforced by DTOs
    switch (ticketData.type) {
      case TicketType.FLIGHT:
        if (!ticketData.flightNumber) {
          throw new Error('Flight number is required for flight tickets');
        }
        break;
      case TicketType.TRAIN:
        if (!ticketData.number) {
          throw new Error('Train number is required for train tickets');
        }
        if (!ticketData.platform) {
          throw new Error('Platform is required for train tickets');
        }
        break;
      case TicketType.TRAM:
        if (!ticketData.line) {
          throw new Error('Line is required for tram tickets');
        }
        break;
      // Other types have optional fields, so no specific validation needed
    }
  }

  /**
   * Extract all places from ticket data
   */
  private extractAllPlaces(
    ticketsData: CreateTicket[],
  ): Array<{ name: string; code?: string }> {
    const places: Array<{ name: string; code?: string }> = [];

    ticketsData.forEach((ticket) => {
      places.push({ name: ticket.from.name, code: ticket.from.code });
      places.push({ name: ticket.to.name, code: ticket.to.code });
    });

    return places;
  }

  /**
   * Create a map for efficient place lookup by name (since names are now unique)
   */
  private createPlaceMap(places: Place[]): Map<string, Place> {
    const map = new Map<string, Place>();

    places.forEach((place) => {
      // Since place names are unique, we can use just the name as the key
      map.set(place.name, place);
    });

    return map;
  }

  /**
   * Find a place in the map using name (code is ignored since names are unique)
   */
  private findPlaceInMap(
    placeMap: Map<string, Place>,
    placeData: { name: string; code?: string },
  ): Place | undefined {
    // Look up by name only since names are unique
    return placeMap.get(placeData.name);
  }
}
