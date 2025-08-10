/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../place/entities/place.entity';
import { Itinerary } from './entities/itinerary.entity';
import { ItineraryRepository } from './itinerary.repository';

describe('ItineraryRepository', () => {
  let repository: ItineraryRepository;
  let typeOrmRepository: jest.Mocked<Repository<Itinerary>>;

  // Mock data
  const mockStartPlace: Place = {
    id: 'place-start-123',
    name: 'St. Anton am Arlberg Bahnhof',
    code: 'STANT',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockEndPlace: Place = {
    id: 'place-end-456',
    name: "Chicago O'Hare",
    code: 'ORD',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockItinerary: Itinerary = {
    id: 'itinerary-123',
    start: mockStartPlace,
    end: mockEndPlace,
    stepsHuman: [
      '0. Start.',
      '1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.',
      '2. Last destination reached.',
    ],
    items: [],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockItineraryWithoutSteps: Itinerary = {
    id: 'itinerary-456',
    start: mockEndPlace,
    end: mockStartPlace,
    items: [],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    // Create mock TypeORM repository
    const mockTypeOrmRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryRepository,
        {
          provide: getRepositoryToken(Itinerary),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ItineraryRepository>(ItineraryRepository);
    typeOrmRepository = module.get(getRepositoryToken(Itinerary));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new itinerary with human steps', async () => {
      // Arrange
      const stepsHuman = [
        '0. Start.',
        '1. Board train RJX 765.',
        '2. Last destination reached.',
      ];
      const newItinerary = { ...mockItinerary, stepsHuman };
      typeOrmRepository.save.mockResolvedValue(newItinerary);

      // Act
      const result = await repository.create(
        mockStartPlace,
        mockEndPlace,
        stepsHuman,
      );

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          start: mockStartPlace,
          end: mockEndPlace,
          stepsHuman,
          items: [],
        }),
      );
      expect(result).toEqual(newItinerary);
    });

    it('should create a new itinerary without human steps', async () => {
      // Arrange
      const newItinerary = { ...mockItineraryWithoutSteps };
      typeOrmRepository.save.mockResolvedValue(newItinerary);

      // Act
      const result = await repository.create(mockStartPlace, mockEndPlace);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          start: mockStartPlace,
          end: mockEndPlace,
          stepsHuman: undefined,
          items: [],
        }),
      );
      expect(result).toEqual(newItinerary);
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.create(mockStartPlace, mockEndPlace),
      ).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should find itinerary by ID with all related data', async () => {
      // Arrange
      const id = 'itinerary-123';
      mockQueryBuilder.getOne.mockResolvedValue(mockItinerary);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'itinerary',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'itinerary.start',
        'startPlace',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'itinerary.end',
        'endPlace',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'itinerary.id = :id',
        { id },
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockItinerary);
    });

    it('should return null when itinerary not found', async () => {
      // Arrange
      const id = 'non-existent';
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const id = 'itinerary-123';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById(id)).rejects.toThrow(error);
    });
  });

  describe('findByStartPlace', () => {
    it('should find itineraries by start place', async () => {
      // Arrange
      const placeId = 'place-start-123';
      const mockItineraries = [mockItinerary, mockItineraryWithoutSteps];
      mockQueryBuilder.getMany.mockResolvedValue(mockItineraries);

      // Act
      const result = await repository.findByStartPlace(placeId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'itinerary',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'itinerary.start_place_id = :placeId',
        { placeId },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockItineraries);
    });

    it('should return empty array when no itineraries found', async () => {
      // Arrange
      const placeId = 'non-existent-place';
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByStartPlace(placeId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const placeId = 'place-start-123';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByStartPlace(placeId)).rejects.toThrow(error);
    });
  });

  describe('findByEndPlace', () => {
    it('should find itineraries by end place', async () => {
      // Arrange
      const placeId = 'place-end-456';
      const mockItineraries = [mockItinerary];
      mockQueryBuilder.getMany.mockResolvedValue(mockItineraries);

      // Act
      const result = await repository.findByEndPlace(placeId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'itinerary',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'itinerary.end_place_id = :placeId',
        { placeId },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockItineraries);
    });

    it('should return empty array when no itineraries found', async () => {
      // Arrange
      const placeId = 'non-existent-place';
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByEndPlace(placeId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByRoute', () => {
    it('should find itineraries by start and end places', async () => {
      // Arrange
      const startPlaceId = 'place-start-123';
      const endPlaceId = 'place-end-456';
      const mockItineraries = [mockItinerary];
      mockQueryBuilder.getMany.mockResolvedValue(mockItineraries);

      // Act
      const result = await repository.findByRoute(startPlaceId, endPlaceId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'itinerary',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'itinerary.start_place_id = :startPlaceId',
        { startPlaceId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'itinerary.end_place_id = :endPlaceId',
        { endPlaceId },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockItineraries);
    });

    it('should return empty array when no itineraries found for route', async () => {
      // Arrange
      const startPlaceId = 'place-start-123';
      const endPlaceId = 'place-end-456';
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByRoute(startPlaceId, endPlaceId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const startPlaceId = 'place-start-123';
      const endPlaceId = 'place-end-456';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getMany.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.findByRoute(startPlaceId, endPlaceId),
      ).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('should update an itinerary', async () => {
      // Arrange
      const updatedItinerary = {
        ...mockItinerary,
        stepsHuman: ['Updated step'],
      };
      typeOrmRepository.save.mockResolvedValue(updatedItinerary);

      // Act
      const result = await repository.update(mockItinerary);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockItinerary);
      expect(result).toEqual(updatedItinerary);
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const error = new Error('Update failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.update(mockItinerary)).rejects.toThrow(error);
    });
  });

  describe('save', () => {
    it('should save an itinerary', async () => {
      // Arrange
      const savedItinerary = { ...mockItinerary, id: 'saved-123' };
      typeOrmRepository.save.mockResolvedValue(savedItinerary);

      // Act
      const result = await repository.save(mockItinerary);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockItinerary);
      expect(result).toEqual(savedItinerary);
    });

    it('should handle database errors during save', async () => {
      // Arrange
      const error = new Error('Save failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.save(mockItinerary)).rejects.toThrow(error);
    });
  });

  describe('deleteById', () => {
    it('should delete an itinerary by ID', async () => {
      // Arrange
      const id = 'itinerary-123';
      typeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      // Act
      await repository.deleteById(id);

      // Assert
      expect(typeOrmRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      const id = 'itinerary-123';
      const error = new Error('Delete failed');
      typeOrmRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.deleteById(id)).rejects.toThrow(error);
    });
  });

  describe('findRecent', () => {
    it('should find recent itineraries with default limit', async () => {
      // Arrange
      const mockItineraries = [mockItinerary, mockItineraryWithoutSteps];
      mockQueryBuilder.getMany.mockResolvedValue(mockItineraries);

      // Act
      const result = await repository.findRecent();

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'itinerary',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'itinerary.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockItineraries);
    });

    it('should find recent itineraries with custom limit', async () => {
      // Arrange
      const limit = 5;
      const mockItineraries = [mockItinerary];
      mockQueryBuilder.getMany.mockResolvedValue(mockItineraries);

      // Act
      const result = await repository.findRecent(limit);

      // Assert
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(limit);
      expect(result).toEqual(mockItineraries);
    });

    it('should return empty array when no recent itineraries found', async () => {
      // Arrange
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findRecent();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockQueryBuilder.getMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findRecent()).rejects.toThrow(error);
    });
  });

  describe('count', () => {
    it('should count total itineraries', async () => {
      // Arrange
      const totalCount = 42;
      typeOrmRepository.count.mockResolvedValue(totalCount);

      // Act
      const result = await repository.count();

      // Assert
      expect(typeOrmRepository.count).toHaveBeenCalled();
      expect(result).toBe(totalCount);
    });

    it('should handle database errors during count', async () => {
      // Arrange
      const error = new Error('Count failed');
      typeOrmRepository.count.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.count()).rejects.toThrow(error);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex itinerary creation and retrieval', async () => {
      // Arrange
      const stepsHuman = [
        '0. Start.',
        '1. Board train RJX 765.',
        '2. Board flight AA904.',
        '3. Last destination reached.',
      ];
      const newItinerary = { ...mockItinerary, stepsHuman };
      typeOrmRepository.save.mockResolvedValue(newItinerary);
      mockQueryBuilder.getOne.mockResolvedValue(newItinerary);

      // Act
      const created = await repository.create(
        mockStartPlace,
        mockEndPlace,
        stepsHuman,
      );
      const retrieved = await repository.findById(created.id!);

      // Assert
      expect(created).toEqual(newItinerary);
      expect(retrieved).toEqual(newItinerary);
      expect(typeOrmRepository.save).toHaveBeenCalledTimes(1);
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('should handle batch operations with findRecent', async () => {
      // Arrange
      const mockItineraries = [
        { ...mockItinerary, id: 'itinerary-1' },
        { ...mockItinerary, id: 'itinerary-2' },
        { ...mockItinerary, id: 'itinerary-3' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockItineraries);

      // Act
      const result = await repository.findRecent(3);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('itinerary-1');
      expect(result[1].id).toBe('itinerary-2');
      expect(result[2].id).toBe('itinerary-3');
    });

    it('should handle route-based queries', async () => {
      // Arrange
      const startPlaceId = 'place-start-123';
      const endPlaceId = 'place-end-456';
      const mockItineraries = [
        { ...mockItinerary, id: 'route-1' },
        { ...mockItinerary, id: 'route-2' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockItineraries);

      // Act
      const result = await repository.findByRoute(startPlaceId, endPlaceId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('route-1');
      expect(result[1].id).toBe('route-2');
    });
  });
});
