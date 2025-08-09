import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './entities/place.entity';

@Injectable()
export class PlaceRepository {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
  ) {}

  /**
   * Find a place by name and optional code
   */
  async findByNameAndCode(name: string, code?: string): Promise<Place | null> {
    const query = this.placeRepository
      .createQueryBuilder('place')
      .where('place.name = :name', { name });

    if (code) {
      query.andWhere('place.code = :code', { code });
    } else {
      query.andWhere('place.code IS NULL');
    }

    return query.getOne();
  }

  /**
   * Find or create a place by name and optional code
   */
  async findOrCreate(name: string, code?: string): Promise<Place> {
    const existingPlace = await this.findByNameAndCode(name, code);
    
    if (existingPlace) {
      return existingPlace;
    }

    const newPlace = new Place({ name, code });
    return this.placeRepository.save(newPlace);
  }

  /**
   * Find multiple places by their names (for batch operations)
   */
  async findByNames(names: string[]): Promise<Place[]> {
    return this.placeRepository
      .createQueryBuilder('place')
      .where('place.name IN (:...names)', { names })
      .getMany();
  }

  /**
   * Save a place entity
   */
  async save(place: Place): Promise<Place> {
    return this.placeRepository.save(place);
  }

  /**
   * Find a place by ID
   */
  async findById(id: string): Promise<Place | null> {
    return this.placeRepository.findOne({ where: { id } });
  }
} 