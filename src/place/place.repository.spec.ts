/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceRepository } from './place.repository';
import { Place } from './entities/place.entity';

describe('PlaceRepository', () => {
  let repository: PlaceRepository;
  let typeOrmRepository: jest.Mocked<Repository<Place>>;

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

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    // Create mock TypeORM repository
    const mockTypeOrmRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaceRepository,
        {
          provide: getRepositoryToken(Place),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<PlaceRepository>(PlaceRepository);
    typeOrmRepository = module.get(getRepositoryToken(Place));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByNameAndCode', () => {
    it('should find place by name and code', async () => {
      // Arrange
      const name = 'St. Anton am Arlberg Bahnhof';
      const code = 'STANT';
      mockQueryBuilder.getOne.mockResolvedValue(mockPlace);

      // Act
      const result = await repository.findByNameAndCode(name, code);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'place',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'place.name = :name',
        { name },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'place.code = :code',
        { code },
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockPlace);
    });

    it('should find place by name only when code is not provided', async () => {
      // Arrange
      const name = 'Innsbruck Hbf';
      mockQueryBuilder.getOne.mockResolvedValue(mockPlaceWithoutCode);

      // Act
      const result = await repository.findByNameAndCode(name);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'place',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'place.name = :name',
        { name },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'place.code IS NULL',
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockPlaceWithoutCode);
    });

    it('should return null when place not found', async () => {
      // Arrange
      const name = 'Non-existent Place';
      const code = 'NEP';
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByNameAndCode(name, code);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const name = 'Test Place';
      const code = 'TEST';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByNameAndCode(name, code)).rejects.toThrow(
        error,
      );
    });
  });

  describe('findOrCreate', () => {
    it('should create new place when it does not exist', async () => {
      // Arrange
      const name = 'New Airport';
      const code = 'NAP';
      const newPlace = { ...mockPlace, name, code };

      // Mock the internal methods
      jest.spyOn(repository, 'findByNameOnly').mockResolvedValue(null);
      typeOrmRepository.save.mockResolvedValue(newPlace);

      // Act
      const result = await repository.findOrCreate(name, code);

      // Assert
      expect(repository.findByNameOnly).toHaveBeenCalledWith(name);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name, code }),
      );
      expect(result).toEqual(newPlace);
    });

    it('should return existing place when it exists with same code', async () => {
      // Arrange
      const name = 'St. Anton am Arlberg Bahnhof';
      const code = 'STANT';
      const existingPlace = { ...mockPlace, name, code };

      jest.spyOn(repository, 'findByNameOnly').mockResolvedValue(existingPlace);

      // Act
      const result = await repository.findOrCreate(name, code);

      // Assert
      expect(repository.findByNameOnly).toHaveBeenCalledWith(name);
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingPlace);
    });

    it('should update existing place when code is different', async () => {
      // Arrange
      const name = 'St. Anton am Arlberg Bahnhof';
      const oldCode = 'OLD';
      const newCode = 'NEW';
      const existingPlace = { ...mockPlace, name, code: oldCode };
      const updatedPlace = { ...existingPlace, code: newCode };

      jest.spyOn(repository, 'findByNameOnly').mockResolvedValue(existingPlace);
      typeOrmRepository.save.mockResolvedValue(updatedPlace);

      // Act
      const result = await repository.findOrCreate(name, newCode);

      // Assert
      expect(repository.findByNameOnly).toHaveBeenCalledWith(name);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...existingPlace,
          code: newCode,
        }),
      );
      expect(result).toEqual(updatedPlace);
    });

    it('should handle place without code', async () => {
      // Arrange
      const name = 'Innsbruck Hbf';

      jest
        .spyOn(repository, 'findByNameOnly')
        .mockResolvedValue(mockPlaceWithoutCode);

      // Act
      const result = await repository.findOrCreate(name);

      // Assert
      expect(repository.findByNameOnly).toHaveBeenCalledWith(name);
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockPlaceWithoutCode);
    });

    it('should add code to existing place without code', async () => {
      // Arrange
      const name = 'Innsbruck Hbf';
      const code = 'INN';
      const existingPlace = { ...mockPlaceWithoutCode, name };
      const updatedPlace = { ...existingPlace, code };

      jest.spyOn(repository, 'findByNameOnly').mockResolvedValue(existingPlace);
      typeOrmRepository.save.mockResolvedValue(updatedPlace);

      // Act
      const result = await repository.findOrCreate(name, code);

      // Assert
      expect(repository.findByNameOnly).toHaveBeenCalledWith(name);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...existingPlace,
          code,
        }),
      );
      expect(result).toEqual(updatedPlace);
    });

    it('should handle database errors during save', async () => {
      // Arrange
      const name = 'Test Place';
      const code = 'TEST';
      const error = new Error('Save failed');

      jest.spyOn(repository, 'findByNameOnly').mockResolvedValue(null);
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findOrCreate(name, code)).rejects.toThrow(error);
    });
  });

  describe('findByNames', () => {
    it('should find multiple places by names', async () => {
      // Arrange
      const names = ['Place 1', 'Place 2', 'Place 3'];
      const mockPlaces = [
        { ...mockPlace, name: 'Place 1' },
        { ...mockPlace, name: 'Place 2' },
        { ...mockPlace, name: 'Place 3' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockPlaces);

      // Act
      const result = await repository.findByNames(names);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'place',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'place.name IN (:...names)',
        { names },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockPlaces);
    });

    it('should return empty array when no places found', async () => {
      // Arrange
      const names = ['Non-existent 1', 'Non-existent 2'];
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByNames(names);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle empty names array', async () => {
      // Arrange
      const names: string[] = [];
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByNames(names);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'place',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'place.name IN (:...names)',
        { names },
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const names = ['Place 1', 'Place 2'];
      const error = new Error('Database error');
      mockQueryBuilder.getMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByNames(names)).rejects.toThrow(error);
    });
  });

  describe('save', () => {
    it('should save a place entity', async () => {
      // Arrange
      const placeToSave = new Place({ name: 'Test Place', code: 'TEST' });
      const savedPlace = { ...placeToSave, id: 'saved-123' };
      typeOrmRepository.save.mockResolvedValue(savedPlace);

      // Act
      const result = await repository.save(placeToSave);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(placeToSave);
      expect(result).toEqual(savedPlace);
    });

    it('should handle database errors during save', async () => {
      // Arrange
      const placeToSave = new Place({ name: 'Test Place', code: 'TEST' });
      const error = new Error('Save failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.save(placeToSave)).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should find place by ID', async () => {
      // Arrange
      const id = 'place-123';
      typeOrmRepository.findOne.mockResolvedValue(mockPlace);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockPlace);
    });

    it('should return null when place not found', async () => {
      // Arrange
      const id = 'non-existent';
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const id = 'place-123';
      const error = new Error('Database error');
      typeOrmRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById(id)).rejects.toThrow(error);
    });
  });

  describe('findByNameOnly', () => {
    it('should find place by name only', async () => {
      // Arrange
      const name = 'St. Anton am Arlberg Bahnhof';
      mockQueryBuilder.getOne.mockResolvedValue(mockPlace);

      // Act
      const result = await repository.findByNameOnly(name);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'place',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'place.name = :name',
        { name },
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockPlace);
    });

    it('should return null when place not found', async () => {
      // Arrange
      const name = 'Non-existent Place';
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByNameOnly(name);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const name = 'Test Place';
      const error = new Error('Database error');
      mockQueryBuilder.getOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByNameOnly(name)).rejects.toThrow(error);
    });
  });

  describe('updatePlaceCode', () => {
    it('should update place code', async () => {
      // Arrange
      const place = { ...mockPlace, code: 'OLD' };
      const newCode = 'NEW';
      const updatedPlace = { ...place, code: newCode };
      typeOrmRepository.save.mockResolvedValue(updatedPlace);

      // Act
      const result = await repository.updatePlaceCode(place, newCode);

      // Assert
      expect(place.code).toBe(newCode);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(place);
      expect(result).toEqual(updatedPlace);
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const place = { ...mockPlace, code: 'OLD' };
      const newCode = 'NEW';
      const error = new Error('Update failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.updatePlaceCode(place, newCode)).rejects.toThrow(
        error,
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex findOrCreate scenario with code update', async () => {
      // Arrange
      const name = 'Complex Place';
      const oldCode = 'OLD';
      const newCode = 'NEW';
      const existingPlace = { ...mockPlace, name, code: oldCode };
      const updatedPlace = { ...existingPlace, code: newCode };

      jest.spyOn(repository, 'findByNameOnly').mockResolvedValue(existingPlace);
      typeOrmRepository.save.mockResolvedValue(updatedPlace);

      // Act
      const result = await repository.findOrCreate(name, newCode);

      // Assert
      expect(repository.findByNameOnly).toHaveBeenCalledWith(name);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...existingPlace,
          code: newCode,
        }),
      );
      expect(result).toEqual(updatedPlace);
    });

    it('should handle batch operations with findByNames', async () => {
      // Arrange
      const names = ['Place 1', 'Place 2', 'Place 3'];
      const mockPlaces = names.map((name, index) => ({
        ...mockPlace,
        id: `place-${index + 1}`,
        name,
      }));
      mockQueryBuilder.getMany.mockResolvedValue(mockPlaces);

      // Act
      const result = await repository.findByNames(names);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Place 1');
      expect(result[1].name).toBe('Place 2');
      expect(result[2].name).toBe('Place 3');
    });
  });
});
