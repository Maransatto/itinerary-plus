/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Place } from '../place/entities/place.entity';
import { Ticket, TicketType } from '../ticket/entities/ticket.entity';
import { ItineraryItem } from './entities/itinerary.entity';
import { ItineraryItemRepository } from './itinerary-item.repository';

describe('ItineraryItemRepository', () => {
  let repository: ItineraryItemRepository;
  let typeOrmRepository: jest.Mocked<Repository<ItineraryItem>>;

  // Mock data
  const mockFromPlace: Place = {
    id: 'place-from-123',
    name: 'St. Anton am Arlberg Bahnhof',
    code: 'STANT',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockToPlace: Place = {
    id: 'place-to-456',
    name: 'Innsbruck Hbf',
    code: 'INN',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockTicket: Ticket = {
    id: 'ticket-123',
    type: TicketType.TRAIN,
    from: mockFromPlace,
    to: mockToPlace,
    seat: '17C',
    notes: 'Platform 3',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockItineraryItem: ItineraryItem = {
    id: 'item-123',
    index: 0,
    ticket: mockTicket,
    itineraryId: 'itinerary-123',
  };

  const mockItineraryItem2: ItineraryItem = {
    id: 'item-456',
    index: 1,
    ticket: mockTicket,
    itineraryId: 'itinerary-123',
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    getRawOne: jest.fn(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    update: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    // Create mock TypeORM repository
    const mockTypeOrmRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryItemRepository,
        {
          provide: getRepositoryToken(ItineraryItem),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ItineraryItemRepository>(ItineraryItemRepository);
    typeOrmRepository = module.get(getRepositoryToken(ItineraryItem));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new itinerary item', async () => {
      // Arrange
      const index = 0;
      const itineraryId = 'itinerary-123';
      const newItem = { ...mockItineraryItem };
      typeOrmRepository.save.mockResolvedValue(newItem);

      // Act
      const result = await repository.create(mockTicket, index, itineraryId);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ticket: mockTicket,
          index,
          itineraryId,
        }),
      );
      expect(result).toEqual(newItem);
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.create(mockTicket, 0, 'itinerary-123'),
      ).rejects.toThrow(error);
    });
  });

  describe('createMultiple', () => {
    it('should create multiple itinerary items', async () => {
      // Arrange
      const tickets = [mockTicket, mockTicket];
      const itineraryId = 'itinerary-123';
      const newItems = [mockItineraryItem, mockItineraryItem2];
      typeOrmRepository.save.mockResolvedValue(
        newItems as unknown as ItineraryItem,
      );

      // Act
      const result = await repository.createMultiple(tickets, itineraryId);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            ticket: mockTicket,
            index: 0,
            itineraryId,
          }),
          expect.objectContaining({
            ticket: mockTicket,
            index: 1,
            itineraryId,
          }),
        ]),
      );
      expect(result).toEqual(newItems);
    });

    it('should handle empty tickets array', async () => {
      // Arrange
      const tickets: Ticket[] = [];
      const itineraryId = 'itinerary-123';
      typeOrmRepository.save.mockResolvedValue([] as unknown as ItineraryItem);

      // Act
      const result = await repository.createMultiple(tickets, itineraryId);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should handle database errors during multiple creation', async () => {
      // Arrange
      const tickets = [mockTicket];
      const itineraryId = 'itinerary-123';
      const error = new Error('Database connection failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.createMultiple(tickets, itineraryId),
      ).rejects.toThrow(error);
    });
  });

  describe('findByItineraryId', () => {
    it('should find all items for a specific itinerary ordered by index', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const mockItems = [mockItineraryItem, mockItineraryItem2];
      mockQueryBuilder.getMany.mockResolvedValue(mockItems);

      // Act
      const result = await repository.findByItineraryId(itineraryId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.ticket',
        'ticket',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'ticket.from',
        'fromPlace',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'ticket.to',
        'toPlace',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'item.itineraryId = :itineraryId',
        { itineraryId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'item.index',
        'ASC',
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when no items found', async () => {
      // Arrange
      const itineraryId = 'non-existent';
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByItineraryId(itineraryId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByItineraryId(itineraryId)).rejects.toThrow(
        error,
      );
    });
  });

  describe('findById', () => {
    it('should find an itinerary item by ID', async () => {
      // Arrange
      const id = 'item-123';
      mockQueryBuilder.getOne.mockResolvedValue(mockItineraryItem);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.id = :id', {
        id,
      });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockItineraryItem);
    });

    it('should return null when item not found', async () => {
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
      const id = 'item-123';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById(id)).rejects.toThrow(error);
    });
  });

  describe('findByTicketId', () => {
    it('should find items by ticket ID', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockItems = [mockItineraryItem];
      mockQueryBuilder.getMany.mockResolvedValue(mockItems);

      // Act
      const result = await repository.findByTicketId(ticketId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'item.ticket_id = :ticketId',
        { ticketId },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when no items found for ticket', async () => {
      // Arrange
      const ticketId = 'non-existent';
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByTicketId(ticketId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByTicketId(ticketId)).rejects.toThrow(error);
    });
  });

  describe('updateIndex', () => {
    it('should update the index of an itinerary item', async () => {
      // Arrange
      const id = 'item-123';
      const newIndex = 5;
      typeOrmRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      } as UpdateResult);

      // Act
      await repository.updateIndex(id, newIndex);

      // Assert
      expect(typeOrmRepository.update).toHaveBeenCalledWith(id, {
        index: newIndex,
      });
    });

    it('should handle database errors during index update', async () => {
      // Arrange
      const id = 'item-123';
      const newIndex = 5;
      const error = new Error('Update failed');
      typeOrmRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.updateIndex(id, newIndex)).rejects.toThrow(error);
    });
  });

  describe('deleteByItineraryId', () => {
    it('should delete all items for a specific itinerary', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      mockQueryBuilder.execute.mockResolvedValue({ affected: 2, raw: [] });

      // Act
      await repository.deleteByItineraryId(itineraryId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'itineraryId = :itineraryId',
        { itineraryId },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const error = new Error('Delete failed');
      mockQueryBuilder.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.deleteByItineraryId(itineraryId)).rejects.toThrow(
        error,
      );
    });
  });

  describe('deleteById', () => {
    it('should delete an itinerary item by ID', async () => {
      // Arrange
      const id = 'item-123';
      typeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      // Act
      await repository.deleteById(id);

      // Assert
      expect(typeOrmRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      const id = 'item-123';
      const error = new Error('Delete failed');
      typeOrmRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.deleteById(id)).rejects.toThrow(error);
    });
  });

  describe('save', () => {
    it('should save an itinerary item', async () => {
      // Arrange
      const savedItem = { ...mockItineraryItem, id: 'saved-123' };
      typeOrmRepository.save.mockResolvedValue(savedItem);

      // Act
      const result = await repository.save(mockItineraryItem);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockItineraryItem);
      expect(result).toEqual(savedItem);
    });

    it('should handle database errors during save', async () => {
      // Arrange
      const error = new Error('Save failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.save(mockItineraryItem)).rejects.toThrow(error);
    });
  });

  describe('saveMultiple', () => {
    it('should save multiple itinerary items', async () => {
      // Arrange
      const items = [mockItineraryItem, mockItineraryItem2];
      const savedItems = [
        { ...mockItineraryItem, id: 'saved-1' },
        { ...mockItineraryItem2, id: 'saved-2' },
      ];
      typeOrmRepository.save.mockResolvedValue(
        savedItems as unknown as ItineraryItem,
      );

      // Act
      const result = await repository.saveMultiple(items);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(items);
      expect(result).toEqual(savedItems);
    });

    it('should handle database errors during multiple save', async () => {
      // Arrange
      const items = [mockItineraryItem];
      const error = new Error('Save failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.saveMultiple(items)).rejects.toThrow(error);
    });
  });

  describe('countByItineraryId', () => {
    it('should count items in an itinerary', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const count = 5;
      mockQueryBuilder.getCount.mockResolvedValue(count);

      // Act
      const result = await repository.countByItineraryId(itineraryId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'item.itineraryId = :itineraryId',
        { itineraryId },
      );
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
      expect(result).toBe(count);
    });

    it('should return zero when no items found', async () => {
      // Arrange
      const itineraryId = 'non-existent';
      mockQueryBuilder.getCount.mockResolvedValue(0);

      // Act
      const result = await repository.countByItineraryId(itineraryId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle database errors during count', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const error = new Error('Count failed');
      mockQueryBuilder.getCount.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.countByItineraryId(itineraryId)).rejects.toThrow(
        error,
      );
    });
  });

  describe('getMaxIndexForItinerary', () => {
    it('should get the maximum index for an itinerary', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const maxIndex = 10;
      mockQueryBuilder.getRawOne.mockResolvedValue({
        maxIndex,
      });

      // Act
      const result = await repository.getMaxIndexForItinerary(itineraryId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'MAX(item.index)',
        'maxIndex',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'item.itineraryId = :itineraryId',
        { itineraryId },
      );
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
      expect(result).toBe(maxIndex);
    });

    it('should return -1 when no items found', async () => {
      // Arrange
      const itineraryId = 'non-existent';
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      // Act
      const result = await repository.getMaxIndexForItinerary(itineraryId);

      // Assert
      expect(result).toBe(-1);
    });

    it('should return -1 when maxIndex is null', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxIndex: null });

      // Act
      const result = await repository.getMaxIndexForItinerary(itineraryId);

      // Assert
      expect(result).toBe(-1);
    });

    it('should handle database errors', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const error = new Error('Database connection failed');
      mockQueryBuilder.getRawOne.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.getMaxIndexForItinerary(itineraryId),
      ).rejects.toThrow(error);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex item creation and retrieval', async () => {
      // Arrange
      const tickets = [mockTicket, mockTicket, mockTicket];
      const itineraryId = 'itinerary-123';
      const newItems = [
        { ...mockItineraryItem, id: 'item-1', index: 0 },
        { ...mockItineraryItem, id: 'item-2', index: 1 },
        { ...mockItineraryItem, id: 'item-3', index: 2 },
      ];
      typeOrmRepository.save.mockResolvedValue(
        newItems as unknown as ItineraryItem,
      );
      mockQueryBuilder.getMany.mockResolvedValue(newItems);

      // Act
      const created = await repository.createMultiple(tickets, itineraryId);
      const retrieved = await repository.findByItineraryId(itineraryId);

      // Assert
      expect(created).toEqual(newItems);
      expect(retrieved).toEqual(newItems);
      expect(typeOrmRepository.save).toHaveBeenCalledTimes(1);
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('should handle batch operations with multiple items', async () => {
      // Arrange
      const items = [
        { ...mockItineraryItem, id: 'item-1', index: 0 },
        { ...mockItineraryItem, id: 'item-2', index: 1 },
        { ...mockItineraryItem, id: 'item-3', index: 2 },
      ];
      typeOrmRepository.save.mockResolvedValue(
        items as unknown as ItineraryItem,
      );

      // Act
      const result = await repository.saveMultiple(items);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].index).toBe(0);
      expect(result[1].index).toBe(1);
      expect(result[2].index).toBe(2);
    });

    it('should handle index management operations', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const maxIndex = 5;
      mockQueryBuilder.getRawOne.mockResolvedValue({
        maxIndex,
      });
      typeOrmRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      } as UpdateResult);

      // Act
      const currentMax = await repository.getMaxIndexForItinerary(itineraryId);
      await repository.updateIndex('item-123', currentMax + 1);

      // Assert
      expect(currentMax).toBe(5);
      expect(typeOrmRepository.update).toHaveBeenCalledWith('item-123', {
        index: 6,
      });
    });
  });
});
