import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { CreateTicket, TicketService } from '../ticket/ticket.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { IdempotencyKey } from './entities/idempotency.entity';
import { Itinerary } from './entities/itinerary.entity';
import { ItineraryItemRepository } from './itinerary-item.repository';
import {
  ItinerarySortingService,
  SortingResult,
} from './itinerary-sorting.service';
import { ItineraryRepository } from './itinerary.repository';

export interface ItineraryCreationResult {
  itinerary: Itinerary | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly itineraryRepository: ItineraryRepository,
    private readonly itineraryItemRepository: ItineraryItemRepository,
    private readonly ticketService: TicketService,
    private readonly sortingService: ItinerarySortingService,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepository: Repository<IdempotencyKey>,
  ) {}

  /**
   * Create a complete itinerary from unsorted ticket data
   */
  async createItinerary(
    createItineraryDto: CreateItineraryDto,
    idempotencyKey?: string,
  ): Promise<ItineraryCreationResult> {
    const { tickets: ticketsData, render } = createItineraryDto;

    this.logger.debug(
      `Creating itinerary from ${ticketsData.length} tickets${idempotencyKey ? ` with idempotency key: ${idempotencyKey}` : ''}`,
    );

    // Check for idempotency key
    if (idempotencyKey) {
      const existingKey = await this.idempotencyRepository.findOne({
        where: { key: idempotencyKey },
      });

      if (existingKey) {
        this.logger.debug(
          `Found existing itinerary for idempotency key: ${idempotencyKey}`,
        );
        const existingItinerary = await this.findItineraryById(
          existingKey.itineraryId,
        );

        if (existingItinerary) {
          return {
            itinerary: existingItinerary,
            isValid: true,
            errors: [],
            warnings: ['Returned existing itinerary based on idempotency key'],
          };
        }
      }
    }

    const result: ItineraryCreationResult = {
      itinerary: null,
      isValid: false,
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: Create tickets from input data
      const tickets = await this.ticketService.createMultipleTickets(
        ticketsData as CreateTicket[],
      );
      this.logger.debug(`Created ${tickets.length} tickets in database`);

      // Step 2: Sort tickets into proper order
      const sortingResult: SortingResult =
        await this.sortingService.sortTickets(tickets);

      if (!sortingResult.isValid) {
        result.errors = sortingResult.errors;
        result.warnings = sortingResult.warnings;
        this.logger.warn(
          `Failed to sort tickets: ${sortingResult.errors.join(', ')}`,
        );
        return result;
      }

      // Step 3: Generate human-readable steps if requested
      let humanSteps: string[] | undefined;
      if (render === 'human' || render === 'both') {
        humanSteps = this.generateHumanReadableSteps(
          sortingResult.sortedTickets,
        );
      }

      // Step 4: Create itinerary entity
      if (!sortingResult.startPlace || !sortingResult.endPlace) {
        result.errors.push(
          'Could not determine start or end place for itinerary',
        );
        return result;
      }

      const itinerary = await this.itineraryRepository.create(
        sortingResult.startPlace,
        sortingResult.endPlace,
        humanSteps,
      );

      // Step 5: Create itinerary items
      const items = await this.itineraryItemRepository.createMultiple(
        sortingResult.sortedTickets,
        itinerary.id!,
      );

      // Step 6: Update itinerary with items for response
      itinerary.items = items;

      result.itinerary = itinerary;
      result.isValid = true;
      result.warnings = sortingResult.warnings;

      // Save idempotency key if provided
      if (idempotencyKey) {
        const contentHash = this.generateContentHash(createItineraryDto);
        const idempotencyRecord = new IdempotencyKey({
          key: idempotencyKey,
          itineraryId: itinerary.id!,
          contentHash,
        });

        try {
          await this.idempotencyRepository.save(idempotencyRecord);
          this.logger.debug(`Saved idempotency key: ${idempotencyKey}`);
        } catch (error) {
          this.logger.warn(`Failed to save idempotency key: ${error.message}`);
          // Don't fail the request if idempotency key save fails
        }
      }

      this.logger.log(
        `Successfully created itinerary ${itinerary.id} with ${items.length} items`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to create itinerary', error);
      result.errors.push(`Failed to create itinerary: ${error.message}`);
      return result;
    }
  }

  /**
   * Find an itinerary by ID with all related data
   */
  async findItineraryById(id: string): Promise<Itinerary | null> {
    this.logger.debug(`Finding itinerary by ID: ${id}`);

    try {
      const itinerary = await this.itineraryRepository.findById(id);

      if (itinerary) {
        // Load itinerary items
        const items = await this.itineraryItemRepository.findByItineraryId(id);
        itinerary.items = items;
      }

      return itinerary;
    } catch (error) {
      this.logger.error(`Failed to find itinerary: ${id}`, error);
      throw new Error(`Unable to find itinerary: ${error.message}`);
    }
  }

  /**
   * Get human-readable format for an itinerary
   */
  async getHumanReadableItinerary(id: string): Promise<string[] | null> {
    this.logger.debug(`Getting human-readable format for itinerary: ${id}`);

    try {
      const itinerary = await this.findItineraryById(id);

      if (!itinerary) {
        return null;
      }

      // If already has human steps, return them
      if (itinerary.stepsHuman && itinerary.stepsHuman.length > 0) {
        return itinerary.stepsHuman;
      }

      // Generate human steps from tickets
      const tickets = itinerary.items.map((item) => item.ticket);
      const humanSteps = this.generateHumanReadableSteps(tickets);

      // Update itinerary with generated steps
      itinerary.stepsHuman = humanSteps;
      await this.itineraryRepository.save(itinerary);

      return humanSteps;
    } catch (error) {
      this.logger.error(`Failed to get human-readable itinerary: ${id}`, error);
      throw new Error(`Unable to get human-readable format: ${error.message}`);
    }
  }

  /**
   * Generate human-readable steps from sorted tickets
   */
  private generateHumanReadableSteps(tickets: any[]): string[] {
    const steps: string[] = [];

    // Start step
    steps.push('0. Start.');

    // Process each ticket
    tickets.forEach((ticket, index) => {
      const stepNumber = index + 1;
      let step = '';

      switch (ticket.type) {
        case 'train':
          step = `${stepNumber}. Board train ${ticket.number}`;
          if (ticket.platform) {
            step += `, Platform ${ticket.platform}`;
          }
          step += ` from ${ticket.from.name} to ${ticket.to.name}.`;
          if (ticket.seat) {
            step += ` Seat number ${ticket.seat}.`;
          }
          break;

        case 'tram':
          step = `${stepNumber}. Board the Tram ${ticket.line} from ${ticket.from.name} to ${ticket.to.name}.`;
          break;

        case 'flight':
          step = `${stepNumber}. From ${ticket.from.name}, board the flight ${ticket.flightNumber}`;
          if (ticket.airline) {
            step = step.replace('the flight', `the ${ticket.airline} flight`);
          }
          step += ` to ${ticket.to.name}`;
          if (ticket.gate) {
            step += ` from gate ${ticket.gate}`;
          }
          if (ticket.seat) {
            step += `, seat ${ticket.seat}`;
          }
          step += '.';
          if (ticket.baggage) {
            if (ticket.baggage === 'self-check-in') {
              step += ' Self-check-in luggage at counter.';
            } else if (ticket.baggage === 'auto-transfer') {
              step +=
                ' Luggage will transfer automatically from the last flight.';
            } else if (ticket.baggage === 'counter') {
              step += ' Check in luggage at counter.';
            }
          }
          break;

        case 'bus':
          step = `${stepNumber}. Board the`;
          if (ticket.operator) {
            step += ` ${ticket.operator}`;
          }
          step += ` bus from ${ticket.from.name} to ${ticket.to.name}.`;
          if (ticket.seat) {
            step += ` Seat number ${ticket.seat}.`;
          } else {
            step += ' No seat assignment.';
          }
          break;

        case 'boat':
          step = `${stepNumber}. Board`;
          if (ticket.vessel) {
            step += ` the ${ticket.vessel}`;
          } else {
            step += ' the boat';
          }
          step += ` from ${ticket.from.name} to ${ticket.to.name}`;
          if (ticket.dock) {
            step += ` at dock ${ticket.dock}`;
          }
          step += '.';
          if (ticket.seat) {
            step += ` Seat number ${ticket.seat}.`;
          }
          break;

        case 'taxi':
          step = `${stepNumber}. Take`;
          if (ticket.company) {
            step += ` a ${ticket.company}`;
          }
          step += ` taxi from ${ticket.from.name} to ${ticket.to.name}.`;
          if (ticket.driver) {
            step += ` Driver: ${ticket.driver}.`;
          }
          if (ticket.vehicleId) {
            step += ` Vehicle ID: ${ticket.vehicleId}.`;
          }
          break;

        default:
          step = `${stepNumber}. Travel by ${ticket.type} from ${ticket.from.name} to ${ticket.to.name}.`;
          if (ticket.seat) {
            step += ` Seat number ${ticket.seat}.`;
          }
      }

      steps.push(step);
    });

    // End step
    steps.push(`${tickets.length + 1}. Last destination reached.`);

    return steps;
  }

  /**
   * Get itinerary statistics
   */
  async getStatistics(): Promise<{
    totalItineraries: number;
    averageStops: number;
    mostCommonRoutes: Array<{ from: string; to: string; count: number }>;
  }> {
    // Implementation placeholder for analytics
    const totalItineraries = await this.itineraryRepository.count();

    return {
      totalItineraries,
      averageStops: 0, // Would require complex query
      mostCommonRoutes: [], // Would require grouping analysis
    };
  }

  /**
   * Generate a hash of the request content for idempotency validation
   */
  private generateContentHash(dto: CreateItineraryDto): string {
    const content = JSON.stringify(dto, Object.keys(dto).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
