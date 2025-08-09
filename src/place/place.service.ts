import { Injectable, Logger } from '@nestjs/common';
import { CreatePlaceDto } from './dto/create-place.dto';
import { Place } from './entities/place.entity';
import { PlaceRepository } from './place.repository';

@Injectable()
export class PlaceService {
  private readonly logger = new Logger(PlaceService.name);

  constructor(private readonly placeRepository: PlaceRepository) {}

  /**
   * Find or create a place based on name and optional code
   * This is the main method used during ticket processing
   */
  async findOrCreatePlace(placeData: CreatePlaceDto): Promise<Place> {
    // Validate and normalize the input data
    this.validatePlaceData(placeData);

    this.logger.debug(
      `Finding or creating place: ${placeData.name} (${placeData.code || 'no code'})`,
    );

    try {
      // Use the repository's findOrCreate which handles uniqueness by name
      const place = await this.placeRepository.findOrCreate(
        placeData.name,
        placeData.code,
      );

      if (place.createdAt && this.isRecentlyCreated(place.createdAt)) {
        this.logger.log(
          `Created new place: ${place.name} (${place.code || 'no code'})`,
        );
      } else if (
        place.updatedAt &&
        this.isRecentlyCreated(place.updatedAt) &&
        place.updatedAt > place.createdAt!
      ) {
        this.logger.log(
          `Updated place '${place.name}' with code '${place.code}'`,
        );
      } else {
        this.logger.debug(
          `Using existing place: ${place.name} (${place.code || 'no code'})`,
        );
      }

      return place;
    } catch (error) {
      this.logger.error(
        `Failed to find or create place: ${placeData.name}`,
        error,
      );
      throw new Error(`Unable to process place: ${placeData.name}`);
    }
  }

  /**
   * Batch process multiple places for efficiency
   * Used when processing multiple tickets at once
   */
  async findOrCreateMultiplePlaces(
    placesData: CreatePlaceDto[],
  ): Promise<Place[]> {
    this.logger.debug(`Processing ${placesData.length} places`);

    const results: Place[] = [];

    // Process places sequentially to avoid race conditions
    // on place creation with same name
    for (const placeData of placesData) {
      const place = await this.findOrCreatePlace(placeData);
      results.push(place);
    }

    this.logger.debug(`Successfully processed ${results.length} places`);
    return results;
  }

  /**
   * Get unique places from a list (removes duplicates by name+code)
   */
  getUniquePlaces(placesData: CreatePlaceDto[]): CreatePlaceDto[] {
    const seen = new Set<string>();
    return placesData.filter((place) => {
      const key = `${place.name}|${place.code || ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Find a place by ID
   */
  async findById(id: string): Promise<Place | null> {
    this.logger.debug(`Finding place by ID: ${id}`);

    try {
      return await this.placeRepository.findById(id);
    } catch (error) {
      this.logger.error(`Failed to find place by ID: ${id}`, error);
      throw new Error(`Unable to find place with ID: ${id}`);
    }
  }

  /**
   * Search places by name (partial match)
   */
  async searchByName(name: string): Promise<Place[]> {
    this.logger.debug(`Searching places by name: ${name}`);

    // This would require a more complex repository method
    // For now, we'll implement basic functionality
    const allNames = [name]; // In a real implementation, this might be a LIKE query

    try {
      return await this.placeRepository.findByNames(allNames);
    } catch (error) {
      this.logger.error(`Failed to search places by name: ${name}`, error);
      throw new Error(`Unable to search places with name: ${name}`);
    }
  }

  /**
   * Get place statistics for monitoring
   */
  async getPlaceStatistics(): Promise<{
    totalPlaces: number;
    placesWithCodes: number;
    placesWithoutCodes: number;
  }> {
    // This would require additional repository methods
    // Implementation placeholder for future analytics
    return {
      totalPlaces: 0,
      placesWithCodes: 0,
      placesWithoutCodes: 0,
    };
  }

  /**
   * Validate place data before processing
   */
  validatePlaceData(placeData: CreatePlaceDto): void {
    if (!placeData.name || placeData.name.trim().length === 0) {
      throw new Error('Place name is required and cannot be empty');
    }

    if (placeData.name.length > 255) {
      throw new Error('Place name is too long (maximum 255 characters)');
    }

    // Code is optional, but if provided must be valid
    if (placeData.code !== undefined && placeData.code !== null) {
      if (
        typeof placeData.code === 'string' &&
        placeData.code.trim().length === 0
      ) {
        // Empty string code should be treated as no code
        placeData.code = undefined;
      } else if (placeData.code.length > 10) {
        throw new Error('Place code is too long (maximum 10 characters)');
      }
    }

    // Normalize data
    placeData.name = placeData.name.trim();
    if (placeData.code) {
      placeData.code = placeData.code.trim().toUpperCase();
    }
  }

  /**
   * Check if a place was recently created (within last 5 seconds)
   */
  private isRecentlyCreated(createdAt: Date): boolean {
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    return createdAt > fiveSecondsAgo;
  }
}
