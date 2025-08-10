/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Place } from '../place/entities/place.entity';
import { PlaceService } from '../place/place.service';
import { BaggageType, FlightTicket } from './entities/flight-ticket.entity';
import { TicketType } from './entities/ticket.entity';
import { TrainTicket } from './entities/train-ticket.entity';
import { TicketRepository } from './ticket.repository';
import { CreateTicket, TicketService } from './ticket.service';

describe('TicketService', () => {
  let service: TicketService;
  let ticketRepository: jest.Mocked<TicketRepository>;
  let placeService: jest.Mocked<PlaceService>;

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

  const mockFlightTicket: FlightTicket = {
    id: 'ticket-123',
    type: TicketType.FLIGHT,
    from: mockFromPlace,
    to: mockToPlace,
    seat: '18B',
    notes: 'Self-check-in luggage at counter',
    airline: 'American Airlines',
    flightNumber: 'AA904',
    gate: '10',
    baggage: BaggageType.SELF_CHECK_IN,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockTrainTicket: TrainTicket = {
    id: 'ticket-456',
    type: TicketType.TRAIN,
    from: mockToPlace,
    to: mockFromPlace,
    seat: '17C',
    notes: 'Platform 3',
    line: 'RJX',
    number: '765',
    platform: '3',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(async () => {
    // Create mock repositories and services
    const mockTicketRepository = {
      findOrCreateTicket: jest.fn(() => Promise.resolve()),
      findByIds: jest.fn(() => Promise.resolve()),
      findByType: jest.fn(() => Promise.resolve()),
      countByType: jest.fn(() => Promise.resolve()),
    };

    const mockPlaceService = {
      findOrCreatePlace: jest.fn(() => Promise.resolve()),
      findOrCreateMultiplePlaces: jest.fn(() => Promise.resolve()),
      getUniquePlaces: jest.fn(() => []),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: TicketRepository,
          useValue: mockTicketRepository,
        },
        {
          provide: PlaceService,
          useValue: mockPlaceService,
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    ticketRepository = module.get(TicketRepository);
    placeService = module.get(PlaceService);

    // Mock Logger to suppress console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a flight ticket successfully', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: '18B',
        notes: 'Self-check-in luggage at counter',
        airline: 'American Airlines',
        flightNumber: 'AA904',
        gate: '10',
        baggage: BaggageType.SELF_CHECK_IN,
      };

      placeService.findOrCreatePlace
        .mockResolvedValueOnce(mockFromPlace)
        .mockResolvedValueOnce(mockToPlace);
      ticketRepository.findOrCreateTicket.mockResolvedValue({
        ticket: mockFlightTicket,
        wasFound: false,
      });

      // Act
      const result = await service.createTicket(ticketData);

      // Assert
      expect(placeService.findOrCreatePlace).toHaveBeenCalledTimes(2);
      expect(placeService.findOrCreatePlace).toHaveBeenNthCalledWith(1, {
        name: 'St. Anton am Arlberg Bahnhof',
        code: 'STANT',
      });
      expect(placeService.findOrCreatePlace).toHaveBeenNthCalledWith(2, {
        name: 'Innsbruck Hbf',
        code: 'INN',
      });
      expect(ticketRepository.findOrCreateTicket).toHaveBeenCalledWith(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );
      expect(result).toEqual(mockFlightTicket);
    });

    it('should create a train ticket successfully', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TRAIN,
        from: { name: 'Innsbruck Hbf', code: 'INN' },
        to: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        seat: '17C',
        notes: 'Platform 3',
        line: 'RJX',
        number: '765',
        platform: '3',
      };

      placeService.findOrCreatePlace
        .mockResolvedValueOnce(mockToPlace)
        .mockResolvedValueOnce(mockFromPlace);
      ticketRepository.findOrCreateTicket.mockResolvedValue({
        ticket: mockTrainTicket,
        wasFound: false,
      });

      // Act
      const result = await service.createTicket(ticketData);

      // Assert
      expect(ticketRepository.findOrCreateTicket).toHaveBeenCalledWith(
        ticketData,
        mockToPlace,
        mockFromPlace,
      );
      expect(result).toEqual(mockTrainTicket);
    });

    it('should throw error when ticket type is missing', async () => {
      // Arrange
      const ticketData = {
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
      } as CreateTicket;

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'Ticket type is required',
      );
    });

    it('should throw error when from place name is missing', async () => {
      // Arrange
      const ticketData = {
        type: TicketType.FLIGHT,
        from: { code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        flightNumber: 'TEST123',
      } as CreateTicket;

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'From place name is required',
      );
    });

    it('should throw error when to place name is missing', async () => {
      // Arrange
      const ticketData = {
        type: TicketType.FLIGHT,
        from: { name: 'Test', code: 'TEST' },
        to: { code: 'TEST2' },
        flightNumber: 'TEST123',
      } as CreateTicket;

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'To place name is required',
      );
    });

    it('should throw error when from and to places are the same', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'Same Place', code: 'SAME' },
        to: { name: 'Same Place', code: 'SAME' },
        flightNumber: 'TEST123',
      };

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'From and to places cannot be the same',
      );
    });

    it('should throw error when flight number is missing for flight ticket', async () => {
      // Arrange
      const ticketData = {
        type: TicketType.FLIGHT,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
      } as CreateTicket;

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'Flight number is required for flight tickets',
      );
    });

    it('should throw error when train number is missing for train ticket', async () => {
      // Arrange
      const ticketData = {
        type: TicketType.TRAIN,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        platform: '3',
      } as CreateTicket;

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'Train number is required for train tickets',
      );
    });

    it('should throw error when platform is missing for train ticket', async () => {
      // Arrange
      const ticketData = {
        type: TicketType.TRAIN,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        number: '123',
      } as CreateTicket;

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'Platform is required for train tickets',
      );
    });

    it('should throw error when line is missing for tram ticket', async () => {
      // Arrange
      const ticketData = {
        type: TicketType.TRAM,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
      } as CreateTicket;

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'Line is required for tram tickets',
      );
    });

    it('should throw error when place service fails', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        flightNumber: 'TEST123',
      };

      placeService.findOrCreatePlace.mockRejectedValue(
        new Error('Place service failed'),
      );

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'Unable to create flight ticket: Place service failed',
      );
    });

    it('should throw error when ticket repository fails', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        flightNumber: 'TEST123',
      };

      placeService.findOrCreatePlace
        .mockResolvedValueOnce(mockFromPlace)
        .mockResolvedValueOnce(mockToPlace);
      ticketRepository.findOrCreateTicket.mockRejectedValue(
        new Error('Ticket repository failed'),
      );

      // Act & Assert
      await expect(service.createTicket(ticketData)).rejects.toThrow(
        'Unable to create flight ticket: Ticket repository failed',
      );
    });
  });

  describe('createMultipleTickets', () => {
    it('should create multiple tickets successfully', async () => {
      // Arrange
      const ticketsData: CreateTicket[] = [
        {
          type: TicketType.FLIGHT,
          from: { name: 'Place 1', code: 'P1' },
          to: { name: 'Place 2', code: 'P2' },
          flightNumber: 'FLIGHT1',
        },
        {
          type: TicketType.TRAIN,
          from: { name: 'Place 2', code: 'P2' },
          to: { name: 'Place 3', code: 'P3' },
          number: 'TRAIN1',
          platform: '1',
        },
      ];

      const mockPlaces = [
        { ...mockFromPlace, name: 'Place 1', code: 'P1' },
        { ...mockToPlace, name: 'Place 2', code: 'P2' },
        { ...mockFromPlace, name: 'Place 3', code: 'P3' },
      ];

      placeService.getUniquePlaces.mockReturnValue([
        { name: 'Place 1', code: 'P1' },
        { name: 'Place 2', code: 'P2' },
        { name: 'Place 2', code: 'P2' },
        { name: 'Place 3', code: 'P3' },
      ]);
      placeService.findOrCreateMultiplePlaces.mockResolvedValue(mockPlaces);
      ticketRepository.findOrCreateTicket
        .mockResolvedValueOnce({
          ticket: mockFlightTicket,
          wasFound: false,
        })
        .mockResolvedValueOnce({
          ticket: mockTrainTicket,
          wasFound: false,
        });

      // Act
      const result = await service.createMultipleTickets(ticketsData);

      // Assert
      expect(placeService.getUniquePlaces).toHaveBeenCalledWith([
        { name: 'Place 1', code: 'P1' },
        { name: 'Place 2', code: 'P2' },
        { name: 'Place 2', code: 'P2' },
        { name: 'Place 3', code: 'P3' },
      ]);
      expect(placeService.findOrCreateMultiplePlaces).toHaveBeenCalled();
      expect(ticketRepository.findOrCreateTicket).toHaveBeenCalledTimes(2);
      expect(result).toEqual([mockFlightTicket, mockTrainTicket]);
    });

    it('should handle empty tickets array', async () => {
      // Arrange
      placeService.getUniquePlaces.mockReturnValue([]);
      placeService.findOrCreateMultiplePlaces.mockResolvedValue([]);

      // Act
      const result = await service.createMultipleTickets([]);

      // Assert
      expect(placeService.getUniquePlaces).toHaveBeenCalledWith([]);
      expect(placeService.findOrCreateMultiplePlaces).toHaveBeenCalledWith([]);
      expect(ticketRepository.findOrCreateTicket).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw error when place not found in map', async () => {
      // Arrange
      const ticketsData: CreateTicket[] = [
        {
          type: TicketType.FLIGHT,
          from: { name: 'Place 1', code: 'P1' },
          to: { name: 'Place 2', code: 'P2' },
          flightNumber: 'FLIGHT1',
        },
      ];

      const mockPlaces = [
        { ...mockFromPlace, name: 'Place 1', code: 'P1' },
        // Missing Place 2
      ];

      placeService.getUniquePlaces.mockReturnValue([
        { name: 'Place 1', code: 'P1' },
        { name: 'Place 2', code: 'P2' },
      ]);
      placeService.findOrCreateMultiplePlaces.mockResolvedValue(mockPlaces);

      // Act & Assert
      await expect(service.createMultipleTickets(ticketsData)).rejects.toThrow(
        'Unable to find places for ticket: Place 1 -> Place 2',
      );
    });

    it('should throw error when ticket creation fails', async () => {
      // Arrange
      const ticketsData: CreateTicket[] = [
        {
          type: TicketType.FLIGHT,
          from: { name: 'Place 1', code: 'P1' },
          to: { name: 'Place 2', code: 'P2' },
          flightNumber: 'FLIGHT1',
        },
      ];

      const mockPlaces = [
        { ...mockFromPlace, name: 'Place 1', code: 'P1' },
        { ...mockToPlace, name: 'Place 2', code: 'P2' },
      ];

      placeService.getUniquePlaces.mockReturnValue([
        { name: 'Place 1', code: 'P1' },
        { name: 'Place 2', code: 'P2' },
      ]);
      placeService.findOrCreateMultiplePlaces.mockResolvedValue(mockPlaces);
      ticketRepository.findOrCreateTicket.mockRejectedValue(
        new Error('Ticket creation failed'),
      );

      // Act & Assert
      await expect(service.createMultipleTickets(ticketsData)).rejects.toThrow(
        'Unable to create tickets: Ticket creation failed',
      );
    });
  });

  describe('findTicketsByIds', () => {
    it('should find tickets by IDs', async () => {
      // Arrange
      const ids = ['ticket-123', 'ticket-456'];
      const mockTickets = [mockFlightTicket, mockTrainTicket];
      ticketRepository.findByIds.mockResolvedValue(mockTickets);

      // Act
      const result = await service.findTicketsByIds(ids);

      // Assert
      expect(ticketRepository.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual(mockTickets);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const ids = ['ticket-123'];
      ticketRepository.findByIds.mockRejectedValue(
        new Error('Repository failed'),
      );

      // Act & Assert
      await expect(service.findTicketsByIds(ids)).rejects.toThrow(
        'Unable to find tickets: Repository failed',
      );
    });
  });

  describe('findTicketsByType', () => {
    it('should find tickets by type', async () => {
      // Arrange
      const type = TicketType.FLIGHT;
      const mockTickets = [mockFlightTicket];
      ticketRepository.findByType.mockResolvedValue(mockTickets);

      // Act
      const result = await service.findTicketsByType(type);

      // Assert
      expect(ticketRepository.findByType).toHaveBeenCalledWith(type);
      expect(result).toEqual(mockTickets);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const type = TicketType.FLIGHT;
      ticketRepository.findByType.mockRejectedValue(
        new Error('Repository failed'),
      );

      // Act & Assert
      await expect(service.findTicketsByType(type)).rejects.toThrow(
        'Unable to find flight tickets: Repository failed',
      );
    });
  });

  describe('getTicketStatistics', () => {
    it('should get ticket statistics', async () => {
      // Arrange
      const mockStats = {
        [TicketType.FLIGHT]: 5,
        [TicketType.TRAIN]: 3,
        [TicketType.BUS]: 2,
        [TicketType.TRAM]: 1,
        [TicketType.BOAT]: 0,
        [TicketType.TAXI]: 0,
      };
      ticketRepository.countByType.mockResolvedValue(mockStats);

      // Act
      const result = await service.getTicketStatistics();

      // Assert
      expect(ticketRepository.countByType).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      ticketRepository.countByType.mockRejectedValue(
        new Error('Repository failed'),
      );

      // Act & Assert
      await expect(service.getTicketStatistics()).rejects.toThrow(
        'Unable to get ticket statistics: Repository failed',
      );
    });
  });

  describe('Private methods', () => {
    describe('extractAllPlaces', () => {
      it('should extract all places from ticket data', () => {
        // Arrange
        const ticketsData: CreateTicket[] = [
          {
            type: TicketType.FLIGHT,
            from: { name: 'Place 1', code: 'P1' },
            to: { name: 'Place 2', code: 'P2' },
            flightNumber: 'FLIGHT1',
          },
          {
            type: TicketType.TRAIN,
            from: { name: 'Place 2', code: 'P2' },
            to: { name: 'Place 3', code: 'P3' },
            number: 'TRAIN1',
            platform: '1',
          },
        ];

        // Act
        const result = (service as any).extractAllPlaces(ticketsData);

        // Assert
        expect(result).toEqual([
          { name: 'Place 1', code: 'P1' },
          { name: 'Place 2', code: 'P2' },
          { name: 'Place 2', code: 'P2' },
          { name: 'Place 3', code: 'P3' },
        ]);
      });
    });

    describe('createPlaceMap', () => {
      it('should create place map for efficient lookup', () => {
        // Arrange
        const places = [
          { ...mockFromPlace, name: 'Place 1' },
          { ...mockToPlace, name: 'Place 2' },
        ];

        // Act
        const result = (service as any).createPlaceMap(places);

        // Assert
        expect(result.get('Place 1')).toEqual(places[0]);
        expect(result.get('Place 2')).toEqual(places[1]);
        expect(result.get('Non-existent')).toBeUndefined();
      });
    });

    describe('findPlaceInMap', () => {
      it('should find place in map by name', () => {
        // Arrange
        const placeMap = new Map<string, Place>();
        const place1 = { ...mockFromPlace, name: 'Place 1' };
        const place2 = { ...mockToPlace, name: 'Place 2' };
        placeMap.set('Place 1', place1);
        placeMap.set('Place 2', place2);

        // Act
        const result1 = (service as any).findPlaceInMap(placeMap, {
          name: 'Place 1',
          code: 'P1',
        });
        const result2 = (service as any).findPlaceInMap(placeMap, {
          name: 'Place 2',
        });
        const result3 = (service as any).findPlaceInMap(placeMap, {
          name: 'Non-existent',
        });

        // Assert
        expect(result1).toEqual(place1);
        expect(result2).toEqual(place2);
        expect(result3).toBeUndefined();
      });
    });
  });

  describe('Duplicate Detection', () => {
    it('should find existing ticket when all attributes match', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: '18B',
        notes: 'Self-check-in luggage at counter',
        airline: 'American Airlines',
        flightNumber: 'AA904',
        gate: '10',
        baggage: BaggageType.SELF_CHECK_IN,
      };

      placeService.findOrCreatePlace
        .mockResolvedValueOnce(mockFromPlace)
        .mockResolvedValueOnce(mockToPlace);
      ticketRepository.findOrCreateTicket.mockResolvedValue({
        ticket: mockFlightTicket,
        wasFound: true, // Simulate finding existing ticket
      });

      // Act
      const result = await service.createTicket(ticketData);

      // Assert
      expect(ticketRepository.findOrCreateTicket).toHaveBeenCalledWith(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );
      expect(result).toEqual(mockFlightTicket);
    });

    it('should create new ticket when attributes differ', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: '18B',
        notes: 'Self-check-in luggage at counter',
        airline: 'American Airlines',
        flightNumber: 'AA904',
        gate: '10',
        baggage: BaggageType.SELF_CHECK_IN,
      };

      placeService.findOrCreatePlace
        .mockResolvedValueOnce(mockFromPlace)
        .mockResolvedValueOnce(mockToPlace);
      ticketRepository.findOrCreateTicket.mockResolvedValue({
        ticket: mockFlightTicket,
        wasFound: false, // Simulate creating new ticket
      });

      // Act
      const result = await service.createTicket(ticketData);

      // Assert
      expect(ticketRepository.findOrCreateTicket).toHaveBeenCalledWith(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );
      expect(result).toEqual(mockFlightTicket);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex multiple ticket creation scenario', async () => {
      // Arrange
      const ticketsData: CreateTicket[] = [
        {
          type: TicketType.FLIGHT,
          from: { name: 'Airport 1', code: 'AP1' },
          to: { name: 'Airport 2', code: 'AP2' },
          flightNumber: 'FLIGHT1',
        },
        {
          type: TicketType.TRAIN,
          from: { name: 'Airport 2', code: 'AP2' },
          to: { name: 'Station 1', code: 'ST1' },
          number: 'TRAIN1',
          platform: '1',
        },
        {
          type: TicketType.BUS,
          from: { name: 'Station 1', code: 'ST1' },
          to: { name: 'Bus Stop 1' },
          route: 'BUS1',
        },
      ];

      const mockPlaces = [
        { ...mockFromPlace, name: 'Airport 1', code: 'AP1' },
        { ...mockToPlace, name: 'Airport 2', code: 'AP2' },
        { ...mockFromPlace, name: 'Station 1', code: 'ST1' },
        { ...mockToPlace, name: 'Bus Stop 1' },
      ];

      placeService.getUniquePlaces.mockReturnValue([
        { name: 'Airport 1', code: 'AP1' },
        { name: 'Airport 2', code: 'AP2' },
        { name: 'Station 1', code: 'ST1' },
        { name: 'Bus Stop 1' },
      ]);
      placeService.findOrCreateMultiplePlaces.mockResolvedValue(mockPlaces);
      ticketRepository.findOrCreateTicket
        .mockResolvedValueOnce({
          ticket: mockFlightTicket,
          wasFound: false,
        })
        .mockResolvedValueOnce({
          ticket: mockTrainTicket,
          wasFound: false,
        })
        .mockResolvedValueOnce({
          ticket: mockFlightTicket,
          wasFound: false,
        });

      // Act
      const result = await service.createMultipleTickets(ticketsData);

      // Assert
      expect(result).toHaveLength(3);
      expect(ticketRepository.findOrCreateTicket).toHaveBeenCalledTimes(3);
    });

    it('should handle validation errors in multiple ticket creation', async () => {
      // Arrange
      const ticketsData: CreateTicket[] = [
        {
          type: TicketType.FLIGHT,
          from: { name: 'Place 1', code: 'P1' },
          to: { name: 'Place 2', code: 'P2' },
          // Missing flightNumber - should cause validation error
        } as CreateTicket,
      ];

      // Act & Assert
      await expect(service.createMultipleTickets(ticketsData)).rejects.toThrow(
        'Flight number is required for flight tickets',
      );
    });
  });
});
