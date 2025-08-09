import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../place/entities/place.entity';
import { Itinerary } from './entities/itinerary.entity';

@Injectable()
export class ItineraryRepository {
  constructor(
    @InjectRepository(Itinerary)
    private readonly itineraryRepository: Repository<Itinerary>,
  ) {}

  /**
   * Create a new itinerary
   */
  async create(
    startPlace: Place,
    endPlace: Place,
    stepsHuman?: string[],
  ): Promise<Itinerary> {
    const itinerary = new Itinerary({
      start: startPlace,
      end: endPlace,
      stepsHuman,
      items: [], // Will be populated separately
    });

    return this.itineraryRepository.save(itinerary);
  }

  /**
   * Find an itinerary by ID with all related data
   */
  async findById(id: string): Promise<Itinerary | null> {
    return this.itineraryRepository
      .createQueryBuilder('itinerary')
      .leftJoinAndSelect('itinerary.start', 'startPlace')
      .leftJoinAndSelect('itinerary.end', 'endPlace')
      .where('itinerary.id = :id', { id })
      .getOne();
  }

  /**
   * Find itineraries by start place
   */
  async findByStartPlace(placeId: string): Promise<Itinerary[]> {
    return this.itineraryRepository
      .createQueryBuilder('itinerary')
      .leftJoinAndSelect('itinerary.start', 'startPlace')
      .leftJoinAndSelect('itinerary.end', 'endPlace')
      .where('itinerary.start_place_id = :placeId', { placeId })
      .getMany();
  }

  /**
   * Find itineraries by end place
   */
  async findByEndPlace(placeId: string): Promise<Itinerary[]> {
    return this.itineraryRepository
      .createQueryBuilder('itinerary')
      .leftJoinAndSelect('itinerary.start', 'startPlace')
      .leftJoinAndSelect('itinerary.end', 'endPlace')
      .where('itinerary.end_place_id = :placeId', { placeId })
      .getMany();
  }

  /**
   * Find itineraries by route (start and end places)
   */
  async findByRoute(startPlaceId: string, endPlaceId: string): Promise<Itinerary[]> {
    return this.itineraryRepository
      .createQueryBuilder('itinerary')
      .leftJoinAndSelect('itinerary.start', 'startPlace')
      .leftJoinAndSelect('itinerary.end', 'endPlace')
      .where('itinerary.start_place_id = :startPlaceId', { startPlaceId })
      .andWhere('itinerary.end_place_id = :endPlaceId', { endPlaceId })
      .getMany();
  }

  /**
   * Update an itinerary
   */
  async update(itinerary: Itinerary): Promise<Itinerary> {
    return this.itineraryRepository.save(itinerary);
  }

  /**
   * Save an itinerary
   */
  async save(itinerary: Itinerary): Promise<Itinerary> {
    return this.itineraryRepository.save(itinerary);
  }

  /**
   * Delete an itinerary by ID
   */
  async deleteById(id: string): Promise<void> {
    await this.itineraryRepository.delete(id);
  }

  /**
   * Find recent itineraries (for analytics)
   */
  async findRecent(limit: number = 10): Promise<Itinerary[]> {
    return this.itineraryRepository
      .createQueryBuilder('itinerary')
      .leftJoinAndSelect('itinerary.start', 'startPlace')
      .leftJoinAndSelect('itinerary.end', 'endPlace')
      .orderBy('itinerary.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Count total itineraries
   */
  async count(): Promise<number> {
    return this.itineraryRepository.count();
  }
} 