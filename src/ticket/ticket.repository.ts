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
   * TODO: we should not use any, replace it with the proper DTO
   */
  async createTicket(ticketData: any, fromPlace: Place, toPlace: Place): Promise<Ticket> {
    let ticket: Ticket;

    switch (ticketData.type) {
      case TicketType.FLIGHT:
        ticket = new FlightTicket({
          ...ticketData,
          from: fromPlace,
          to: toPlace,
        });
        break;

      case TicketType.TRAIN:
        ticket = new TrainTicket({
          ...ticketData,
          from: fromPlace,
          to: toPlace,
        });
        break;

      case TicketType.BUS:
        ticket = new BusTicket({
          ...ticketData,
          from: fromPlace,
          to: toPlace,
        });
        break;

      case TicketType.TRAM:
        ticket = new TramTicket({
          ...ticketData,
          from: fromPlace,
          to: toPlace,
        });
        break;

      case TicketType.BOAT:
        ticket = new BoatTicket({
          ...ticketData,
          from: fromPlace,
          to: toPlace,
        });
        break;

      case TicketType.TAXI:
        ticket = new TaxiTicket({
          ...ticketData,
          from: fromPlace,
          to: toPlace,
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