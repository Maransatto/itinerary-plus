/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../place/entities/place.entity';
import { Ticket, TicketType } from '../ticket/entities/ticket.entity';
import { CreateTicket, TicketService } from '../ticket/ticket.service';
import { CreateItineraryDto, RenderType } from './dto/create-itinerary.dto';
import { IdempotencyKey } from './entities/idempotency.entity';
import { Itinerary, ItineraryItem } from './entities/itinerary.entity';
import { ItineraryItemRepository } from './itinerary-item.repository';
import {
  ItinerarySortingService,
  SortingResult,
} from './itinerary-sorting.service';
import { ItineraryRepository } from './itinerary.repository';
import { ItineraryService } from './itinerary.service';

describe('ItineraryService', () => {
  let service: ItineraryService;
  let itineraryRepository: jest.Mocked<ItineraryRepository>;
  let itineraryItemRepository: jest.Mocked<ItineraryItemRepository>;
  let ticketService: jest.Mocked<TicketService>;
  let sortingService: jest.Mocked<ItinerarySortingService>;
  let idempotencyRepository: jest.Mocked<Repository<IdempotencyKey>>;

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

  const mockTicket: Ticket = {
    id: 'ticket-123',
    type: TicketType.TRAIN,
    from: mockStartPlace,
    to: mockEndPlace,
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

  const mockItinerary: Itinerary = {
    id: 'itinerary-123',
    start: mockStartPlace,
    end: mockEndPlace,
    stepsHuman: [
      '0. Start.',
      '1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.',
      '2. Last destination reached.',
    ],
    items: [mockItineraryItem],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockCreateItineraryDto: CreateItineraryDto = {
    tickets: [
      {
        type: TicketType.TRAIN,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: '17C',
        notes: 'Platform 3',
        line: 'RJX',
        number: '765',
        platform: '3',
      } as CreateTicket,
    ],
    render: RenderType.HUMAN,
  };

  const mockSortingResult: SortingResult = {
    sortedTickets: [mockTicket],
    startPlace: mockStartPlace,
    endPlace: mockEndPlace,
    isValid: true,
    errors: [],
    warnings: [],
  };

  beforeEach(async () => {
    // Create mock repositories and services
    const mockItineraryRepository = {
      create: jest.fn(() => Promise.resolve()),
      findById: jest.fn(() => Promise.resolve()),
      save: jest.fn(() => Promise.resolve()),
      count: jest.fn(() => Promise.resolve()),
    };

    const mockItineraryItemRepository = {
      createMultiple: jest.fn(() => Promise.resolve()),
      findByItineraryId: jest.fn(() => Promise.resolve()),
    };

    const mockTicketService = {
      createMultipleTickets: jest.fn(() => Promise.resolve()),
    };

    const mockSortingService = {
      sortTickets: jest.fn(() => Promise.resolve()),
    };

    const mockIdempotencyRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryService,
        {
          provide: ItineraryRepository,
          useValue: mockItineraryRepository,
        },
        {
          provide: ItineraryItemRepository,
          useValue: mockItineraryItemRepository,
        },
        {
          provide: TicketService,
          useValue: mockTicketService,
        },
        {
          provide: ItinerarySortingService,
          useValue: mockSortingService,
        },
        {
          provide: getRepositoryToken(IdempotencyKey),
          useValue: mockIdempotencyRepository,
        },
      ],
    }).compile();

    service = module.get<ItineraryService>(ItineraryService);
    itineraryRepository = module.get(ItineraryRepository);
    itineraryItemRepository = module.get(ItineraryItemRepository);
    ticketService = module.get(TicketService);
    sortingService = module.get(ItinerarySortingService);
    idempotencyRepository = module.get(getRepositoryToken(IdempotencyKey));

    // Mock Logger to suppress console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createItinerary', () => {
    it('should create a complete itinerary successfully', async () => {
      // Arrange
      const idempotencyKey = 'test-key-123';
      const mockItems = [mockItineraryItem];
      const mockCreatedItinerary = { ...mockItinerary, items: mockItems };

      idempotencyRepository.findOne.mockResolvedValue(null);
      ticketService.createMultipleTickets.mockResolvedValue([mockTicket]);
      sortingService.sortTickets.mockResolvedValue(mockSortingResult);
      itineraryRepository.create.mockResolvedValue(mockCreatedItinerary);
      itineraryItemRepository.createMultiple.mockResolvedValue(mockItems);
      idempotencyRepository.save.mockResolvedValue({} as IdempotencyKey);

      // Act
      const result = await service.createItinerary(
        mockCreateItineraryDto,
        idempotencyKey,
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.itinerary).toEqual(mockCreatedItinerary);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(ticketService.createMultipleTickets).toHaveBeenCalledWith(
        mockCreateItineraryDto.tickets,
      );
      expect(sortingService.sortTickets).toHaveBeenCalledWith([mockTicket]);
      expect(itineraryRepository.create).toHaveBeenCalledWith(
        mockStartPlace,
        mockEndPlace,
        expect.arrayContaining([
          '0. Start.',
          expect.stringContaining('Board train'),
          '2. Last destination reached.',
        ]),
      );
      expect(itineraryItemRepository.createMultiple).toHaveBeenCalledWith(
        [mockTicket],
        mockCreatedItinerary.id,
      );
    });

    it('should return existing itinerary when idempotency key exists', async () => {
      // Arrange
      const idempotencyKey = 'existing-key-123';
      const existingIdempotencyKey = {
        key: idempotencyKey,
        itineraryId: 'itinerary-123',
        contentHash: 'hash123',
      } as IdempotencyKey;

      idempotencyRepository.findOne.mockResolvedValue(existingIdempotencyKey);
      itineraryRepository.findById.mockResolvedValue(mockItinerary);

      // Act
      const result = await service.createItinerary(
        mockCreateItineraryDto,
        idempotencyKey,
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.itinerary).toEqual(mockItinerary);
      expect(result.warnings).toContain(
        'Returned existing itinerary based on idempotency key',
      );
      expect(ticketService.createMultipleTickets).not.toHaveBeenCalled();
      expect(sortingService.sortTickets).not.toHaveBeenCalled();
    });

    it('should handle case when existing idempotency key has no itinerary', async () => {
      // Arrange
      const idempotencyKey = 'existing-key-123';
      const existingIdempotencyKey = {
        key: idempotencyKey,
        itineraryId: 'non-existent',
        contentHash: 'hash123',
      } as IdempotencyKey;

      idempotencyRepository.findOne.mockResolvedValue(existingIdempotencyKey);
      itineraryRepository.findById.mockResolvedValue(null);
      ticketService.createMultipleTickets.mockResolvedValue([mockTicket]);
      sortingService.sortTickets.mockResolvedValue(mockSortingResult);
      itineraryRepository.create.mockResolvedValue(mockItinerary);
      itineraryItemRepository.createMultiple.mockResolvedValue([
        mockItineraryItem,
      ]);

      // Act
      const result = await service.createItinerary(
        mockCreateItineraryDto,
        idempotencyKey,
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(ticketService.createMultipleTickets).toHaveBeenCalled();
      expect(sortingService.sortTickets).toHaveBeenCalled();
    });

    it('should handle sorting failure', async () => {
      // Arrange
      const invalidSortingResult: SortingResult = {
        sortedTickets: [],
        startPlace: null,
        endPlace: null,
        isValid: false,
        errors: ['Invalid route structure'],
        warnings: ['Multiple disconnected segments'],
      };

      ticketService.createMultipleTickets.mockResolvedValue([mockTicket]);
      sortingService.sortTickets.mockResolvedValue(invalidSortingResult);

      // Act
      const result = await service.createItinerary(mockCreateItineraryDto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.itinerary).toBeNull();
      expect(result.errors).toContain('Invalid route structure');
      expect(result.warnings).toContain('Multiple disconnected segments');
      expect(itineraryRepository.create).not.toHaveBeenCalled();
    });

    it('should handle missing start or end place', async () => {
      // Arrange
      const invalidSortingResult: SortingResult = {
        sortedTickets: [mockTicket],
        startPlace: null,
        endPlace: mockEndPlace,
        isValid: true,
        errors: [],
        warnings: [],
      };

      ticketService.createMultipleTickets.mockResolvedValue([mockTicket]);
      sortingService.sortTickets.mockResolvedValue(invalidSortingResult);

      // Act
      const result = await service.createItinerary(mockCreateItineraryDto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Could not determine start or end place for itinerary',
      );
    });

    it('should handle ticket creation failure', async () => {
      // Arrange
      ticketService.createMultipleTickets.mockRejectedValue(
        new Error('Ticket creation failed'),
      );

      // Act
      const result = await service.createItinerary(mockCreateItineraryDto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Failed to create itinerary: Ticket creation failed',
      );
    });

    it('should handle idempotency key save failure gracefully', async () => {
      // Arrange
      const idempotencyKey = 'test-key-123';
      const mockItems = [mockItineraryItem];
      const mockCreatedItinerary = { ...mockItinerary, items: mockItems };

      idempotencyRepository.findOne.mockResolvedValue(null);
      ticketService.createMultipleTickets.mockResolvedValue([mockTicket]);
      sortingService.sortTickets.mockResolvedValue(mockSortingResult);
      itineraryRepository.create.mockResolvedValue(mockCreatedItinerary);
      itineraryItemRepository.createMultiple.mockResolvedValue(mockItems);
      idempotencyRepository.save.mockRejectedValue(
        new Error('Idempotency save failed'),
      );

      // Act
      const result = await service.createItinerary(
        mockCreateItineraryDto,
        idempotencyKey,
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.itinerary).toEqual(mockCreatedItinerary);
      // Should not fail the request if idempotency key save fails
    });

    it('should create itinerary without human steps when render is not human', async () => {
      // Arrange
      const dtoWithoutHuman = { ...mockCreateItineraryDto, render: 'json' };
      const mockItems = [mockItineraryItem];
      const mockCreatedItinerary = { ...mockItinerary, items: mockItems };

      ticketService.createMultipleTickets.mockResolvedValue([mockTicket]);
      sortingService.sortTickets.mockResolvedValue(mockSortingResult);
      itineraryRepository.create.mockResolvedValue(mockCreatedItinerary);
      itineraryItemRepository.createMultiple.mockResolvedValue(mockItems);

      // Act
      const result = await service.createItinerary(
        dtoWithoutHuman as unknown as CreateItineraryDto,
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(itineraryRepository.create).toHaveBeenCalledWith(
        mockStartPlace,
        mockEndPlace,
        undefined, // No human steps
      );
    });
  });

  describe('findItineraryById', () => {
    it('should find itinerary by ID with items', async () => {
      // Arrange
      const id = 'itinerary-123';
      const mockItems = [mockItineraryItem];

      itineraryRepository.findById.mockResolvedValue(mockItinerary);
      itineraryItemRepository.findByItineraryId.mockResolvedValue(mockItems);

      // Act
      const result = await service.findItineraryById(id);

      // Assert
      expect(result).toEqual({ ...mockItinerary, items: mockItems });
      expect(itineraryRepository.findById).toHaveBeenCalledWith(id);
      expect(itineraryItemRepository.findByItineraryId).toHaveBeenCalledWith(
        id,
      );
    });

    it('should return null when itinerary not found', async () => {
      // Arrange
      const id = 'non-existent';
      itineraryRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findItineraryById(id);

      // Assert
      expect(result).toBeNull();
      expect(itineraryItemRepository.findByItineraryId).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const id = 'itinerary-123';
      itineraryRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.findItineraryById(id)).rejects.toThrow(
        'Unable to find itinerary: Database error',
      );
    });
  });

  describe('getHumanReadableItinerary', () => {
    it('should return existing human steps when available', async () => {
      // Arrange
      const id = 'itinerary-123';
      const mockItineraryWithSteps = {
        ...mockItinerary,
        stepsHuman: ['Step 1', 'Step 2'],
      };
      const mockItems = [mockItineraryItem];

      itineraryRepository.findById.mockResolvedValue(mockItineraryWithSteps);
      itineraryItemRepository.findByItineraryId.mockResolvedValue(mockItems);

      // Act
      const result = await service.getHumanReadableItinerary(id);

      // Assert
      expect(result).toEqual(['Step 1', 'Step 2']);
      expect(itineraryRepository.save).not.toHaveBeenCalled();
    });

    it('should generate and save human steps when not available', async () => {
      // Arrange
      const id = 'itinerary-123';
      const mockItineraryWithoutSteps = {
        ...mockItinerary,
        stepsHuman: undefined,
      };
      const mockItems = [mockItineraryItem];

      itineraryRepository.findById.mockResolvedValue(mockItineraryWithoutSteps);
      itineraryItemRepository.findByItineraryId.mockResolvedValue(mockItems);
      itineraryRepository.save.mockResolvedValue(mockItineraryWithoutSteps);

      // Act
      const result = await service.getHumanReadableItinerary(id);

      // Assert
      expect(result).toEqual([
        '0. Start.',
        "1. Board train undefined from St. Anton am Arlberg Bahnhof to Chicago O'Hare. Seat number 17C.",
        '2. Last destination reached.',
      ]);
      expect(itineraryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          stepsHuman: expect.arrayContaining([
            '0. Start.',
            expect.stringContaining('Board train'),
            '2. Last destination reached.',
          ]),
        }),
      );
    });

    it('should return null when itinerary not found', async () => {
      // Arrange
      const id = 'non-existent';
      itineraryRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getHumanReadableItinerary(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const id = 'itinerary-123';
      itineraryRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.getHumanReadableItinerary(id)).rejects.toThrow(
        'Unable to get human-readable format: Unable to find itinerary: Database error',
      );
    });
  });

  describe('getStatistics', () => {
    it('should return itinerary statistics', async () => {
      // Arrange
      const totalItineraries = 42;
      itineraryRepository.count.mockResolvedValue(totalItineraries);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result).toEqual({
        totalItineraries,
        averageStops: 0,
        mostCommonRoutes: [],
      });
      expect(itineraryRepository.count).toHaveBeenCalled();
    });

    it('should handle repository errors during statistics', async () => {
      // Arrange
      itineraryRepository.count.mockRejectedValue(new Error('Count failed'));

      // Act & Assert
      await expect(service.getStatistics()).rejects.toThrow('Count failed');
    });
  });

  describe('Private methods', () => {
    describe('generateHumanReadableSteps', () => {
      it('should generate human-readable steps for train tickets', () => {
        // Arrange
        const trainTicket = {
          ...mockTicket,
          type: TicketType.TRAIN,
          number: 'RJX 765',
          platform: '3',
          from: { name: 'St. Anton am Arlberg Bahnhof' },
          to: { name: 'Innsbruck Hbf' },
          seat: '17C',
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([
          trainTicket,
        ]);

        // Assert
        expect(result).toEqual([
          '0. Start.',
          '1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.',
          '2. Last destination reached.',
        ]);
      });

      it('should generate human-readable steps for flight tickets', () => {
        // Arrange
        const flightTicket = {
          ...mockTicket,
          type: TicketType.FLIGHT,
          flightNumber: 'AA904',
          airline: 'American Airlines',
          gate: '10',
          seat: '18B',
          baggage: 'self-check-in',
          from: { name: 'Innsbruck Airport' },
          to: { name: 'Venice Airport' },
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([
          flightTicket,
        ]);

        // Assert
        expect(result).toEqual([
          '0. Start.',
          '1. From Innsbruck Airport, board the American Airlines flight AA904 to Venice Airport from gate 10, seat 18B. Self-check-in luggage at counter.',
          '2. Last destination reached.',
        ]);
      });

      it('should generate human-readable steps for tram tickets', () => {
        // Arrange
        const tramTicket = {
          ...mockTicket,
          type: TicketType.TRAM,
          line: 'S5',
          from: { name: 'Innsbruck Hbf' },
          to: { name: 'Innsbruck Airport' },
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([
          tramTicket,
        ]);

        // Assert
        expect(result).toEqual([
          '0. Start.',
          '1. Board the Tram S5 from Innsbruck Hbf to Innsbruck Airport.',
          '2. Last destination reached.',
        ]);
      });

      it('should generate human-readable steps for bus tickets', () => {
        // Arrange
        const busTicket = {
          ...mockTicket,
          type: TicketType.BUS,
          route: 'Airport Bus',
          operator: 'City Transport',
          from: { name: 'Bologna San Ruffillo' },
          to: { name: 'Bologna Guglielmo Marconi Airport' },
          seat: '12A',
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([busTicket]);

        // Assert
        expect(result).toEqual([
          '0. Start.',
          '1. Board the City Transport bus from Bologna San Ruffillo to Bologna Guglielmo Marconi Airport. Seat number 12A.',
          '2. Last destination reached.',
        ]);
      });

      it('should generate human-readable steps for boat tickets', () => {
        // Arrange
        const boatTicket = {
          ...mockTicket,
          type: TicketType.BOAT,
          vessel: 'Venice Ferry',
          dock: 'Dock 5',
          from: { name: 'Venice Port' },
          to: { name: 'Venice Island' },
          seat: 'Deck A',
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([
          boatTicket,
        ]);

        // Assert
        expect(result).toEqual([
          '0. Start.',
          '1. Board the Venice Ferry from Venice Port to Venice Island at dock Dock 5. Seat number Deck A.',
          '2. Last destination reached.',
        ]);
      });

      it('should generate human-readable steps for taxi tickets', () => {
        // Arrange
        const taxiTicket = {
          ...mockTicket,
          type: TicketType.TAXI,
          company: 'Yellow Cab',
          driver: 'John Smith',
          vehicleId: 'TAXI-123',
          from: { name: 'Hotel' },
          to: { name: 'Airport' },
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([
          taxiTicket,
        ]);

        // Assert
        expect(result).toEqual([
          '0. Start.',
          '1. Take a Yellow Cab taxi from Hotel to Airport. Driver: John Smith. Vehicle ID: TAXI-123.',
          '2. Last destination reached.',
        ]);
      });

      it('should handle unknown ticket types', () => {
        // Arrange
        const unknownTicket = {
          ...mockTicket,
          type: 'unknown' as TicketType,
          from: { name: 'Place A' },
          to: { name: 'Place B' },
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([
          unknownTicket,
        ]);

        // Assert
        expect(result).toEqual([
          '0. Start.',
          '1. Travel by unknown from Place A to Place B. Seat number 17C.',
          '2. Last destination reached.',
        ]);
      });

      it('should handle multiple tickets in sequence', () => {
        // Arrange
        const trainTicket = {
          ...mockTicket,
          type: TicketType.TRAIN,
          number: 'RJX 765',
          platform: '3',
          from: { name: 'St. Anton' },
          to: { name: 'Innsbruck' },
        };
        const flightTicket = {
          ...mockTicket,
          type: TicketType.FLIGHT,
          flightNumber: 'AA904',
          from: { name: 'Innsbruck' },
          to: { name: 'Venice' },
        };

        // Act
        const result = (service as any).generateHumanReadableSteps([
          trainTicket,
          flightTicket,
        ]);

        // Assert
        expect(result).toHaveLength(4); // Start + 2 tickets + End
        expect(result[0]).toBe('0. Start.');
        expect(result[1]).toContain('Board train RJX 765');
        expect(result[2]).toContain('board the flight AA904');
        expect(result[3]).toBe('3. Last destination reached.');
      });
    });

    describe('generateContentHash', () => {
      it('should generate consistent hash for same content', () => {
        // Arrange
        const dto1 = { tickets: [{ type: 'train' }], render: 'human' };
        const dto2 = { tickets: [{ type: 'train' }], render: 'human' };

        // Act
        const hash1 = (service as any).generateContentHash(dto1);
        const hash2 = (service as any).generateContentHash(dto2);

        // Assert
        expect(hash1).toBe(hash2);
        expect(typeof hash1).toBe('string');
        expect(hash1.length).toBeGreaterThan(0);
      });

      it('should generate different hashes for different content', () => {
        // Arrange
        const dto1 = { tickets: [{ type: 'train' }], render: 'human' };
        const dto2 = { tickets: [{ type: 'flight' }], render: 'json' };

        // Act
        const hash1 = (service as any).generateContentHash(dto1);
        const hash2 = (service as any).generateContentHash(dto2);

        // Assert
        expect(hash1).not.toBe(hash2);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete itinerary creation workflow', async () => {
      // Arrange
      const idempotencyKey = 'workflow-test-123';
      const mockItems = [mockItineraryItem];
      const mockCreatedItinerary = { ...mockItinerary, items: mockItems };

      idempotencyRepository.findOne.mockResolvedValue(null);
      ticketService.createMultipleTickets.mockResolvedValue([mockTicket]);
      sortingService.sortTickets.mockResolvedValue(mockSortingResult);
      itineraryRepository.create.mockResolvedValue(mockCreatedItinerary);
      itineraryItemRepository.createMultiple.mockResolvedValue(mockItems);
      idempotencyRepository.save.mockResolvedValue({} as IdempotencyKey);

      // Act
      const result = await service.createItinerary(
        mockCreateItineraryDto,
        idempotencyKey,
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.itinerary).toBeDefined();
      expect(result.itinerary!.items).toHaveLength(1);
    });

    it('should handle complex multi-ticket itinerary', async () => {
      // Arrange
      const complexDto: CreateItineraryDto = {
        tickets: [
          {
            type: TicketType.TRAIN,
            from: { name: 'St. Anton', code: 'STANT' },
            to: { name: 'Innsbruck', code: 'INN' },
            number: 'RJX 765',
            platform: '3',
            seat: '17C',
          } as CreateTicket,
          {
            type: TicketType.FLIGHT,
            from: { name: 'Innsbruck', code: 'INN' },
            to: { name: 'Venice', code: 'VCE' },
            flightNumber: 'AA904',
            seat: '18B',
          } as CreateTicket,
        ],
        render: RenderType.BOTH,
      };

      const complexSortingResult: SortingResult = {
        sortedTickets: [mockTicket, mockTicket],
        startPlace: mockStartPlace,
        endPlace: mockEndPlace,
        isValid: true,
        errors: [],
        warnings: [],
      };

      ticketService.createMultipleTickets.mockResolvedValue([
        mockTicket,
        mockTicket,
      ]);
      sortingService.sortTickets.mockResolvedValue(complexSortingResult);
      itineraryRepository.create.mockResolvedValue(mockItinerary);
      itineraryItemRepository.createMultiple.mockResolvedValue([
        mockItineraryItem,
        mockItineraryItem,
      ]);

      // Act
      const result = await service.createItinerary(complexDto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(ticketService.createMultipleTickets).toHaveBeenCalledWith(
        complexDto.tickets,
      );
      expect(sortingService.sortTickets).toHaveBeenCalledWith([
        mockTicket,
        mockTicket,
      ]);
    });
  });
});
