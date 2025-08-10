/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PlaceService } from './place.service';
import { PlaceRepository } from './place.repository';
import { CreatePlaceDto } from './dto/create-place.dto';
import { Place } from './entities/place.entity';

describe('PlaceService', () => {
  let service: PlaceService;
  let placeRepository: jest.Mocked<PlaceRepository>;

  // Mock data
  const mockPlace: Place = {
    id: 'place-123',
    name: 'St. Anton am Arlberg Bahnhof',
    code: 'STANT',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockPlaceWithoutCode: Place = {
    id: 'place-456',
    name: 'Innsbruck Hbf',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      findOrCreate: jest.fn(() => Promise.resolve()),
      findById: jest.fn(() => Promise.resolve()),
      findByNames: jest.fn(() => Promise.resolve()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaceService,
        {
          provide: PlaceRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PlaceService>(PlaceService);
    placeRepository = module.get(PlaceRepository);

    // Mock Logger to suppress console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreatePlace', () => {
    it('should create a new place when it does not exist', async () => {
      // Arrange
      const placeData: CreatePlaceDto = {
        name: 'New Airport',
        code: 'NAP',
      };
      const newPlace = { ...mockPlace, ...placeData };

      placeRepository.findOrCreate.mockResolvedValue(newPlace);

      // Act
      const result = await service.findOrCreatePlace(placeData);

      // Assert
      expect(placeRepository.findOrCreate).toHaveBeenCalledWith(
        'New Airport',
        'NAP',
      );
      expect(result).toEqual(newPlace);
    });

    it('should return existing place when it already exists', async () => {
      // Arrange
      const placeData: CreatePlaceDto = {
        name: 'St. Anton am Arlberg Bahnhof',
        code: 'STANT',
      };

      placeRepository.findOrCreate.mockResolvedValue(mockPlace);

      // Act
      const result = await service.findOrCreatePlace(placeData);

      // Assert
      expect(placeRepository.findOrCreate).toHaveBeenCalledWith(
        'St. Anton am Arlberg Bahnhof',
        'STANT',
      );
      expect(result).toEqual(mockPlace);
    });

    it('should handle place without code', async () => {
      // Arrange
      const placeData: CreatePlaceDto = {
        name: 'Innsbruck Hbf',
      };

      placeRepository.findOrCreate.mockResolvedValue(mockPlaceWithoutCode);

      // Act
      const result = await service.findOrCreatePlace(placeData);

      // Assert
      expect(placeRepository.findOrCreate).toHaveBeenCalledWith(
        'Innsbruck Hbf',
        undefined,
      );
      expect(result).toEqual(mockPlaceWithoutCode);
    });

    it('should normalize input data (trim and uppercase code)', async () => {
      // Arrange
      const placeData: CreatePlaceDto = {
        name: '  Venice Airport  ',
        code: '  vce  ',
      };

      placeRepository.findOrCreate.mockResolvedValue(mockPlace);

      // Act
      await service.findOrCreatePlace(placeData);

      // Assert
      expect(placeRepository.findOrCreate).toHaveBeenCalledWith(
        'Venice Airport',
        'VCE',
      );
    });

    it('should handle empty string code as undefined', async () => {
      // Arrange
      const placeData: CreatePlaceDto = {
        name: 'Test Place',
        code: '',
      };

      placeRepository.findOrCreate.mockResolvedValue(mockPlaceWithoutCode);

      // Act
      await service.findOrCreatePlace(placeData);

      // Assert
      expect(placeRepository.findOrCreate).toHaveBeenCalledWith(
        'Test Place',
        undefined,
      );
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const placeData: CreatePlaceDto = {
        name: 'Test Place',
        code: 'TEST',
      };

      placeRepository.findOrCreate.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service.findOrCreatePlace(placeData)).rejects.toThrow(
        'Unable to process place: Test Place',
      );
    });
  });

  describe('findOrCreateMultiplePlaces', () => {
    it('should process multiple places sequentially', async () => {
      // Arrange
      const placesData: CreatePlaceDto[] = [
        { name: 'Place 1', code: 'P1' },
        { name: 'Place 2', code: 'P2' },
        { name: 'Place 3' },
      ];

      const mockPlaces = [
        { ...mockPlace, name: 'Place 1', code: 'P1' },
        { ...mockPlace, name: 'Place 2', code: 'P2' },
        { ...mockPlaceWithoutCode, name: 'Place 3' },
      ];

      placeRepository.findOrCreate
        .mockResolvedValueOnce(mockPlaces[0])
        .mockResolvedValueOnce(mockPlaces[1])
        .mockResolvedValueOnce(mockPlaces[2]);

      // Act
      const result = await service.findOrCreateMultiplePlaces(placesData);

      // Assert
      expect(placeRepository.findOrCreate).toHaveBeenCalledTimes(3);
      expect(placeRepository.findOrCreate).toHaveBeenNthCalledWith(
        1,
        'Place 1',
        'P1',
      );
      expect(placeRepository.findOrCreate).toHaveBeenNthCalledWith(
        2,
        'Place 2',
        'P2',
      );
      expect(placeRepository.findOrCreate).toHaveBeenNthCalledWith(
        3,
        'Place 3',
        undefined,
      );
      expect(result).toEqual(mockPlaces);
    });

    it('should handle empty array', async () => {
      // Act
      const result = await service.findOrCreateMultiplePlaces([]);

      // Assert
      expect(placeRepository.findOrCreate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getUniquePlaces', () => {
    it('should remove duplicate places by name and code', () => {
      // Arrange
      const placesData: CreatePlaceDto[] = [
        { name: 'Place 1', code: 'P1' },
        { name: 'Place 1', code: 'P1' }, // Duplicate
        { name: 'Place 2', code: 'P2' },
        { name: 'Place 1', code: 'P2' }, // Different code, should keep
        { name: 'Place 3' },
        { name: 'Place 3' }, // Duplicate without code
      ];

      // Act
      const result = service.getUniquePlaces(placesData);

      // Assert
      expect(result).toEqual([
        { name: 'Place 1', code: 'P1' },
        { name: 'Place 2', code: 'P2' },
        { name: 'Place 1', code: 'P2' },
        { name: 'Place 3' },
      ]);
    });

    it('should handle empty array', () => {
      // Act
      const result = service.getUniquePlaces([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find place by ID', async () => {
      // Arrange
      const placeId = 'place-123';
      placeRepository.findById.mockResolvedValue(mockPlace);

      // Act
      const result = await service.findById(placeId);

      // Assert
      expect(placeRepository.findById).toHaveBeenCalledWith(placeId);
      expect(result).toEqual(mockPlace);
    });

    it('should return null when place not found', async () => {
      // Arrange
      const placeId = 'non-existent';
      placeRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(placeId);

      // Assert
      expect(placeRepository.findById).toHaveBeenCalledWith(placeId);
      expect(result).toBeNull();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const placeId = 'place-123';
      placeRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findById(placeId)).rejects.toThrow(
        'Unable to find place with ID: place-123',
      );
    });
  });

  describe('searchByName', () => {
    it('should search places by name', async () => {
      // Arrange
      const searchName = 'Innsbruck';
      const mockResults = [mockPlace, mockPlaceWithoutCode];
      placeRepository.findByNames.mockResolvedValue(mockResults);

      // Act
      const result = await service.searchByName(searchName);

      // Assert
      expect(placeRepository.findByNames).toHaveBeenCalledWith([searchName]);
      expect(result).toEqual(mockResults);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const searchName = 'Test';
      placeRepository.findByNames.mockRejectedValue(new Error('Search failed'));

      // Act & Assert
      await expect(service.searchByName(searchName)).rejects.toThrow(
        'Unable to search places with name: Test',
      );
    });
  });

  describe('getPlaceStatistics', () => {
    it('should return placeholder statistics', async () => {
      // Act
      const result = await service.getPlaceStatistics();

      // Assert
      expect(result).toEqual({
        totalPlaces: 0,
        placesWithCodes: 0,
        placesWithoutCodes: 0,
      });
    });
  });

  describe('validatePlaceData', () => {
    it('should throw error for empty name', () => {
      // Arrange
      const invalidData: CreatePlaceDto = { name: '' };

      // Act & Assert
      expect(() => service.validatePlaceData(invalidData)).toThrow(
        'Place name is required and cannot be empty',
      );
    });

    it('should throw error for whitespace-only name', () => {
      // Arrange
      const invalidData: CreatePlaceDto = { name: '   ' };

      // Act & Assert
      expect(() => service.validatePlaceData(invalidData)).toThrow(
        'Place name is required and cannot be empty',
      );
    });

    it('should throw error for name too long', () => {
      // Arrange
      const invalidData: CreatePlaceDto = {
        name: 'A'.repeat(256),
      };

      // Act & Assert
      expect(() => service.validatePlaceData(invalidData)).toThrow(
        'Place name is too long (maximum 255 characters)',
      );
    });

    it('should throw error for code too long', () => {
      // Arrange
      const invalidData: CreatePlaceDto = {
        name: 'Test Place',
        code: 'A'.repeat(11),
      };

      // Act & Assert
      expect(() => service.validatePlaceData(invalidData)).toThrow(
        'Place code is too long (maximum 10 characters)',
      );
    });

    it('should handle empty string code', () => {
      // Arrange
      const data: CreatePlaceDto = {
        name: 'Test Place',
        code: '',
      };

      // Act
      service.validatePlaceData(data);

      // Assert
      expect(data.code).toBeUndefined();
    });

    it('should normalize valid data', () => {
      // Arrange
      const data: CreatePlaceDto = {
        name: '  Test Place  ',
        code: '  test  ',
      };

      // Act
      service.validatePlaceData(data);

      // Assert
      expect(data.name).toBe('Test Place');
      expect(data.code).toBe('TEST');
    });

    it('should handle null code', () => {
      // Arrange
      const data: CreatePlaceDto = {
        name: 'Test Place',
        code: null as any,
      };

      // Act
      service.validatePlaceData(data);

      // Assert
      expect(data.code).toBeNull(); // The validation doesn't convert null to undefined
    });
  });
});
