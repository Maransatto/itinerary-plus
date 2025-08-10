import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../place/entities/place.entity';
import { BoatTicket } from './entities/boat-ticket.entity';
import { BusTicket } from './entities/bus-ticket.entity';
import { FlightTicket } from './entities/flight-ticket.entity';
import { TaxiTicket } from './entities/taxi-ticket.entity';
import { Ticket, TicketType } from './entities/ticket.entity';
import { TrainTicket } from './entities/train-ticket.entity';
import { TramTicket } from './entities/tram-ticket.entity';
import { CreateTicket } from './ticket.service';

@Injectable()
export class TicketRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * Create a ticket of the appropriate type based on the ticket data
   */
  async createTicket(
    ticketData: CreateTicket,
    fromPlace: Place,
    toPlace: Place,
  ): Promise<Ticket> {
    let ticket: Ticket;

    switch (ticketData.type) {
      case TicketType.FLIGHT: {
        const flightData = ticketData;
        ticket = new FlightTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          from: fromPlace,
          to: toPlace,
          airline: flightData.airline,
          flightNumber: flightData.flightNumber,
          gate: flightData.gate,
          baggage: flightData.baggage,
        });
        break;
      }

      case TicketType.TRAIN: {
        const trainData = ticketData;
        ticket = new TrainTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          from: fromPlace,
          to: toPlace,
          line: trainData.line,
          number: trainData.number,
          platform: trainData.platform,
        });
        break;
      }

      case TicketType.BUS: {
        ticket = new BusTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          from: fromPlace,
          to: toPlace,
          route: ticketData.route,
          operator: ticketData.operator,
        });
        break;
      }

      case TicketType.TRAM: {
        const tramData = ticketData;
        ticket = new TramTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          from: fromPlace,
          to: toPlace,
          line: tramData.line,
        });
        break;
      }

      case TicketType.BOAT: {
        ticket = new BoatTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          from: fromPlace,
          to: toPlace,
          vessel: ticketData.vessel,
          dock: ticketData.dock,
        });
        break;
      }

      case TicketType.TAXI: {
        ticket = new TaxiTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          from: fromPlace,
          to: toPlace,
          company: ticketData.company,
          driver: ticketData.driver,
          vehicleId: ticketData.vehicleId,
        });
        break;
      }
      default:
        throw new Error(
          `Unsupported ticket type: ${(ticketData as unknown as { type: string }).type}`,
        );
    }

    const savedTicket = await this.ticketRepository.save(ticket);
    return savedTicket;
  }

  /**
   * Find tickets by their IDs
   */
  async findByIds(ids: string[]): Promise<Ticket[]> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('ticket.id IN (:...ids)', { ids })
      .getMany();
  }

  /**
   * Find tickets by type
   */
  async findByType(type: TicketType): Promise<Ticket[]> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('ticket.type = :type', { type })
      .getMany();
  }

  /**
   * Find tickets that originate from a specific place
   */
  async findByFromPlace(placeId: string): Promise<Ticket[]> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('ticket.from_place_id = :placeId', { placeId })
      .getMany();
  }

  /**
   * Find tickets that arrive at a specific place
   */
  async findByToPlace(placeId: string): Promise<Ticket[]> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('ticket.to_place_id = :placeId', { placeId })
      .getMany();
  }

  /**
   * Find a ticket by ID
   */
  async findById(id: string): Promise<Ticket | null> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('ticket.id = :id', { id })
      .getOne();
  }

  /**
   * Save multiple tickets in a transaction
   */
  async saveMultiple(tickets: Ticket[]): Promise<Ticket[]> {
    return this.ticketRepository.save(tickets);
  }

  /**
   * Find existing ticket with matching content to avoid duplicates
   * Simple and reliable implementation
   */
  async findExistingTicket(
    ticketData: CreateTicket,
    fromPlaceId: string,
    toPlaceId: string,
  ): Promise<Ticket | null> {
    // Simple query to find existing tickets with same route and seat
    const existingTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('ticket.type = :type', { type: ticketData.type })
      .andWhere('ticket.from_place_id = :fromPlaceId', { fromPlaceId })
      .andWhere('ticket.to_place_id = :toPlaceId', { toPlaceId })
      .andWhere('ticket.seat = :seat', { seat: ticketData.seat || null })
      .getOne();

    return existingTicket;
  }

  /**
   * Find or create a ticket, avoiding duplicates
   * Returns an object with the ticket and a flag indicating if it was found or created
   */
  async findOrCreateTicket(
    ticketData: CreateTicket,
    fromPlace: Place,
    toPlace: Place,
  ): Promise<{ ticket: Ticket; wasFound: boolean }> {
    // First try to find existing ticket
    const existingTicket = await this.findExistingTicket(
      ticketData,
      fromPlace.id!,
      toPlace.id!,
    );

    if (existingTicket) {
      return { ticket: existingTicket, wasFound: true };
    }

    // Create new ticket if no duplicate found
    const newTicket = await this.createTicket(ticketData, fromPlace, toPlace);
    return { ticket: newTicket, wasFound: false };
  }

  /**
   * Count tickets by type (for statistics)
   */
  async countByType(): Promise<Record<TicketType, number>> {
    const counts = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.type')
      .getRawMany();

    const result = {} as Record<TicketType, number>;
    for (const ticketType of Object.values(TicketType)) {
      result[ticketType] = 0;
    }

    counts.forEach((item) => {
      result[item.type as TicketType] = parseInt(item.count);
    });

    return result;
  }
}
