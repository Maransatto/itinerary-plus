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

@Injectable()
export class TicketRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * Create a ticket of the appropriate type based on the ticket data
   * // TODO: we should not use any, replace it with the proper DTO
   */
  async createTicket(ticketData: any, fromPlace: Place, toPlace: Place): Promise<Ticket> {
    let ticket: Ticket;

    switch (ticketData.type) {
      case TicketType.FLIGHT:
        ticket = new FlightTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          meta: ticketData.meta,
          from: fromPlace,
          to: toPlace,
          airline: ticketData.airline,
          flightNumber: ticketData.flightNumber,
          gate: ticketData.gate,
          baggage: ticketData.baggage,
        });
        break;

      case TicketType.TRAIN:
        ticket = new TrainTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          meta: ticketData.meta,
          from: fromPlace,
          to: toPlace,
          number: ticketData.number,
          platform: ticketData.platform,
          line: ticketData.line,
        });
        break;

      case TicketType.BUS:
        ticket = new BusTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          meta: ticketData.meta,
          from: fromPlace,
          to: toPlace,
          route: ticketData.route,
          operator: ticketData.operator,
        });
        break;

      case TicketType.TRAM:
        ticket = new TramTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          meta: ticketData.meta,
          from: fromPlace,
          to: toPlace,
          line: ticketData.line,
        });
        break;

      case TicketType.BOAT:
        ticket = new BoatTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          meta: ticketData.meta,
          from: fromPlace,
          to: toPlace,
          vessel: ticketData.vessel,
          dock: ticketData.dock,
        });
        break;

      case TicketType.TAXI:
        ticket = new TaxiTicket({
          type: ticketData.type,
          seat: ticketData.seat,
          notes: ticketData.notes,
          meta: ticketData.meta,
          from: fromPlace,
          to: toPlace,
          company: ticketData.company,
          driver: ticketData.driver,
          vehicleId: ticketData.vehicleId,
        });
        break;

      default:
        throw new Error(`Unsupported ticket type: ${ticketData.type}`);
    }

    return this.ticketRepository.save(ticket);
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
   */
  async findExistingTicket(ticketData: any, fromPlaceId: string, toPlaceId: string): Promise<Ticket | null> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('ticket.type = :type', { type: ticketData.type })
      .andWhere('ticket.from_place_id = :fromPlaceId', { fromPlaceId })
      .andWhere('ticket.to_place_id = :toPlaceId', { toPlaceId });

    // Add type-specific matching criteria
    switch (ticketData.type) {
      case TicketType.FLIGHT:
        if (ticketData.flightNumber) {
          query.andWhere('ticket.flightNumber = :flightNumber', { flightNumber: ticketData.flightNumber });
        }
        if (ticketData.seat) {
          query.andWhere('ticket.seat = :seat', { seat: ticketData.seat });
        }
        break;

      case TicketType.TRAIN:
        if (ticketData.number) {
          query.andWhere('ticket.number = :number', { number: ticketData.number });
        }
        if (ticketData.platform) {
          query.andWhere('ticket.platform = :platform', { platform: ticketData.platform });
        }
        if (ticketData.seat) {
          query.andWhere('ticket.seat = :seat', { seat: ticketData.seat });
        }
        break;

      case TicketType.BUS:
        if (ticketData.route) {
          query.andWhere('ticket.route = :route', { route: ticketData.route });
        }
        if (ticketData.operator) {
          query.andWhere('ticket.operator = :operator', { operator: ticketData.operator });
        }
        break;

      case TicketType.TRAM:
        if (ticketData.line) {
          query.andWhere('ticket.line = :line', { line: ticketData.line });
        }
        break;

      case TicketType.TAXI:
        if (ticketData.company) {
          query.andWhere('ticket.company = :company', { company: ticketData.company });
        }
        if (ticketData.vehicleId) {
          query.andWhere('ticket.vehicleId = :vehicleId', { vehicleId: ticketData.vehicleId });
        }
        break;

      case TicketType.BOAT:
        if (ticketData.vessel) {
          query.andWhere('ticket.vessel = :vessel', { vessel: ticketData.vessel });
        }
        if (ticketData.dock) {
          query.andWhere('ticket.dock = :dock', { dock: ticketData.dock });
        }
        break;
    }

    return query.getOne();
  }

  /**
   * Find or create a ticket, avoiding duplicates
   */
  async findOrCreateTicket(ticketData: any, fromPlace: Place, toPlace: Place): Promise<Ticket> {
    // First try to find existing ticket
    const existingTicket = await this.findExistingTicket(ticketData, fromPlace.id!, toPlace.id!);
    
    if (existingTicket) {
      return existingTicket;
    }

    // Create new ticket if no duplicate found
    return this.createTicket(ticketData, fromPlace, toPlace);
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

    counts.forEach(item => {
      result[item.type as TicketType] = parseInt(item.count);
    });

    return result;
  }
} 