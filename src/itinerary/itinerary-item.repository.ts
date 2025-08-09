import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';
import { ItineraryItem } from './entities/itinerary.entity';

@Injectable()
export class ItineraryItemRepository {
  constructor(
    @InjectRepository(ItineraryItem)
    private readonly itineraryItemRepository: Repository<ItineraryItem>,
  ) {}

  /**
   * Create a new itinerary item
   */
  async create(
    ticket: Ticket,
    index: number,
    itineraryId: string,
  ): Promise<ItineraryItem> {
    const itineraryItem = new ItineraryItem({
      ticket,
      index,
      itineraryId,
    });

    return this.itineraryItemRepository.save(itineraryItem);
  }

  /**
   * Create multiple itinerary items for an itinerary
   */
  async createMultiple(
    tickets: Ticket[],
    itineraryId: string,
  ): Promise<ItineraryItem[]> {
    const items = tickets.map(
      (ticket, index) =>
        new ItineraryItem({
          ticket,
          index,
          itineraryId,
        }),
    );

    return this.itineraryItemRepository.save(items);
  }

  /**
   * Find all items for a specific itinerary, ordered by index
   */
  async findByItineraryId(itineraryId: string): Promise<ItineraryItem[]> {
    return this.itineraryItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.ticket', 'ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('item.itineraryId = :itineraryId', { itineraryId })
      .orderBy('item.index', 'ASC')
      .getMany();
  }

  /**
   * Find an itinerary item by ID
   */
  async findById(id: string): Promise<ItineraryItem | null> {
    return this.itineraryItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.ticket', 'ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('item.id = :id', { id })
      .getOne();
  }

  /**
   * Find items by ticket ID
   */
  async findByTicketId(ticketId: string): Promise<ItineraryItem[]> {
    return this.itineraryItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.ticket', 'ticket')
      .leftJoinAndSelect('ticket.from', 'fromPlace')
      .leftJoinAndSelect('ticket.to', 'toPlace')
      .where('item.ticket_id = :ticketId', { ticketId })
      .getMany();
  }

  /**
   * Update the index of an itinerary item
   */
  async updateIndex(id: string, newIndex: number): Promise<void> {
    await this.itineraryItemRepository.update(id, { index: newIndex });
  }

  /**
   * Delete all items for a specific itinerary
   */
  async deleteByItineraryId(itineraryId: string): Promise<void> {
    await this.itineraryItemRepository
      .createQueryBuilder()
      .delete()
      .where('itineraryId = :itineraryId', { itineraryId })
      .execute();
  }

  /**
   * Delete an itinerary item by ID
   */
  async deleteById(id: string): Promise<void> {
    await this.itineraryItemRepository.delete(id);
  }

  /**
   * Save an itinerary item
   */
  async save(item: ItineraryItem): Promise<ItineraryItem> {
    return this.itineraryItemRepository.save(item);
  }

  /**
   * Save multiple itinerary items
   */
  async saveMultiple(items: ItineraryItem[]): Promise<ItineraryItem[]> {
    return this.itineraryItemRepository.save(items);
  }

  /**
   * Count items in an itinerary
   */
  async countByItineraryId(itineraryId: string): Promise<number> {
    return this.itineraryItemRepository
      .createQueryBuilder('item')
      .where('item.itineraryId = :itineraryId', { itineraryId })
      .getCount();
  }

  /**
   * Get the maximum index for an itinerary (for adding new items)
   */
  async getMaxIndexForItinerary(itineraryId: string): Promise<number> {
    const result = await this.itineraryItemRepository
      .createQueryBuilder('item')
      .select('MAX(item.index)', 'maxIndex')
      .where('item.itineraryId = :itineraryId', { itineraryId })
      .getRawOne();

    return result?.maxIndex ?? -1;
  }
}
