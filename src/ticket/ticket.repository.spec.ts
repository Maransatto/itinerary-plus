/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../place/entities/place.entity';
import { BoatTicket } from './entities/boat-ticket.entity';
import { BusTicket } from './entities/bus-ticket.entity';
import { BaggageType, FlightTicket } from './entities/flight-ticket.entity';
import { TaxiTicket } from './entities/taxi-ticket.entity';
import { Ticket, TicketType } from './entities/ticket.entity';
import { TrainTicket } from './entities/train-ticket.entity';
import { TramTicket } from './entities/tram-ticket.entity';
import { TicketRepository } from './ticket.repository';
import { CreateTicket } from './ticket.service';

describe('TicketRepository', () => {
  let repository: TicketRepository;
  let typeOrmRepository: jest.Mocked<Repository<Ticket>>;

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

  const mockBusTicket: BusTicket = {
    id: 'ticket-789',
    type: TicketType.BUS,
    from: mockFromPlace,
    to: mockToPlace,
    seat: '12A',
    notes: 'Airport shuttle',
    route: 'Airport Express',
    operator: 'City Bus Co',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockTramTicket: TramTicket = {
    id: 'ticket-101',
    type: TicketType.TRAM,
    from: mockFromPlace,
    to: mockToPlace,
    seat: '5B',
    notes: 'Metro line',
    line: 'S5',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockBoatTicket: BoatTicket = {
    id: 'ticket-202',
    type: TicketType.BOAT,
    from: mockFromPlace,
    to: mockToPlace,
    seat: 'Deck 2, Seat 15',
    notes: 'Ferry service',
    vessel: 'Sea Explorer',
    dock: 'Pier 3',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockTaxiTicket: TaxiTicket = {
    id: 'ticket-303',
    type: TicketType.TAXI,
    from: mockFromPlace,
    to: mockToPlace,
    seat: 'Front',
    notes: 'Airport transfer',
    company: 'City Taxi',
    driver: 'John Doe',
    vehicleId: 'TAXI-001',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    // Create mock TypeORM repository
    const mockTypeOrmRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketRepository,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<TicketRepository>(TicketRepository);
    typeOrmRepository = module.get(getRepositoryToken(Ticket));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a flight ticket', async () => {
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

      typeOrmRepository.save.mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.createTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TicketType.FLIGHT,
          from: mockFromPlace,
          to: mockToPlace,
          seat: '18B',
          notes: 'Self-check-in luggage at counter',
        }),
      );
      expect(result).toEqual(mockFlightTicket);
    });

    it('should create a train ticket', async () => {
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

      typeOrmRepository.save.mockResolvedValue(mockTrainTicket);

      // Act
      const result = await repository.createTicket(
        ticketData,
        mockToPlace,
        mockFromPlace,
      );

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TicketType.TRAIN,
          from: mockToPlace,
          to: mockFromPlace,
          seat: '17C',
          notes: 'Platform 3',
        }),
      );
      expect(result).toEqual(mockTrainTicket);
    });

    it('should create a bus ticket', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.BUS,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: '12A',
        notes: 'Airport shuttle',
        route: 'Airport Express',
        operator: 'City Bus Co',
      };

      typeOrmRepository.save.mockResolvedValue(mockBusTicket);

      // Act
      const result = await repository.createTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TicketType.BUS,
          from: mockFromPlace,
          to: mockToPlace,
          seat: '12A',
          notes: 'Airport shuttle',
        }),
      );
      expect(result).toEqual(mockBusTicket);
    });

    it('should create a tram ticket', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TRAM,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: '5B',
        notes: 'Metro line',
        line: 'S5',
      };

      typeOrmRepository.save.mockResolvedValue(mockTramTicket);

      // Act
      const result = await repository.createTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TicketType.TRAM,
          from: mockFromPlace,
          to: mockToPlace,
          seat: '5B',
          notes: 'Metro line',
        }),
      );
      expect(result).toEqual(mockTramTicket);
    });

    it('should create a boat ticket', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.BOAT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: 'Deck 2, Seat 15',
        notes: 'Ferry service',
        vessel: 'Sea Explorer',
        dock: 'Pier 3',
      };

      typeOrmRepository.save.mockResolvedValue(mockBoatTicket);

      // Act
      const result = await repository.createTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TicketType.BOAT,
          from: mockFromPlace,
          to: mockToPlace,
          seat: 'Deck 2, Seat 15',
          notes: 'Ferry service',
        }),
      );
      expect(result).toEqual(mockBoatTicket);
    });

    it('should create a taxi ticket', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TAXI,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: 'Front',
        notes: 'Airport transfer',
        company: 'City Taxi',
        driver: 'John Doe',
        vehicleId: 'TAXI-001',
      };

      typeOrmRepository.save.mockResolvedValue(mockTaxiTicket);

      // Act
      const result = await repository.createTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TicketType.TAXI,
          from: mockFromPlace,
          to: mockToPlace,
          seat: 'Front',
          notes: 'Airport transfer',
        }),
      );
      expect(result).toEqual(mockTaxiTicket);
    });

    it('should throw error for unsupported ticket type', async () => {
      // Arrange
      const ticketData = {
        type: 'UNSUPPORTED',
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
      } as unknown as CreateTicket;

      // Act & Assert
      await expect(
        repository.createTicket(ticketData, mockFromPlace, mockToPlace),
      ).rejects.toThrow('Unsupported ticket type: UNSUPPORTED');
    });

    it('should handle database save errors', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        flightNumber: 'TEST123',
      };

      const saveError = new Error('Database connection failed');
      typeOrmRepository.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(
        repository.createTicket(ticketData, mockFromPlace, mockToPlace),
      ).rejects.toThrow(saveError);
    });
  });

  describe('findByIds', () => {
    it('should find tickets by IDs', async () => {
      // Arrange
      const ids = ['ticket-123', 'ticket-456'];
      const mockTickets = [mockFlightTicket, mockTrainTicket];
      mockQueryBuilder.getMany.mockResolvedValue(mockTickets);

      // Act
      const result = await repository.findByIds(ids);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
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
        'ticket.id IN (:...ids)',
        { ids },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });

    it('should return empty array when no tickets found', async () => {
      // Arrange
      const ids = ['non-existent-1', 'non-existent-2'];
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByIds(ids);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const ids = ['ticket-123'];
      const error = new Error('Database connection failed');
      mockQueryBuilder.getMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByIds(ids)).rejects.toThrow(error);
    });
  });

  describe('findByType', () => {
    it('should find tickets by type', async () => {
      // Arrange
      const type = TicketType.FLIGHT;
      const mockTickets = [mockFlightTicket];
      mockQueryBuilder.getMany.mockResolvedValue(mockTickets);

      // Act
      const result = await repository.findByType(type);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'ticket',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.type = :type',
        { type },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });

    it('should return empty array when no tickets of type found', async () => {
      // Arrange
      const type = TicketType.BOAT;
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByType(type);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByFromPlace', () => {
    it('should find tickets by from place', async () => {
      // Arrange
      const placeId = 'place-from-123';
      const mockTickets = [mockFlightTicket];
      mockQueryBuilder.getMany.mockResolvedValue(mockTickets);

      // Act
      const result = await repository.findByFromPlace(placeId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'ticket',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.from_place_id = :placeId',
        { placeId },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });
  });

  describe('findByToPlace', () => {
    it('should find tickets by to place', async () => {
      // Arrange
      const placeId = 'place-to-456';
      const mockTickets = [mockFlightTicket];
      mockQueryBuilder.getMany.mockResolvedValue(mockTickets);

      // Act
      const result = await repository.findByToPlace(placeId);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'ticket',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.to_place_id = :placeId',
        { placeId },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });
  });

  describe('findById', () => {
    it('should find ticket by ID', async () => {
      // Arrange
      const id = 'ticket-123';
      mockQueryBuilder.getOne.mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'ticket',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ticket.id = :id', {
        id,
      });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockFlightTicket);
    });

    it('should return null when ticket not found', async () => {
      // Arrange
      const id = 'non-existent';
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('saveMultiple', () => {
    it('should save multiple tickets', async () => {
      // Arrange
      const tickets = [mockFlightTicket, mockTrainTicket] as Ticket[];
      typeOrmRepository.save.mockResolvedValue(tickets as unknown as Ticket);

      // Act
      const result = await repository.saveMultiple(tickets);

      // Assert
      expect(typeOrmRepository.save).toHaveBeenCalledWith(tickets);
      expect(result).toEqual(tickets);
    });

    it('should handle database errors during save', async () => {
      // Arrange
      const tickets = [mockFlightTicket] as Ticket[];
      const error = new Error('Save failed');
      typeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.saveMultiple(tickets)).rejects.toThrow(error);
    });
  });

  describe('findExistingTicket', () => {
    it('should find existing flight ticket with matching criteria', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        seat: '18B',
        flightNumber: 'AA904',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'ticket',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.type = :type',
        { type: TicketType.FLIGHT },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.from_place_id = :fromPlaceId',
        { fromPlaceId: 'place-from-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.to_place_id = :toPlaceId',
        { toPlaceId: 'place-to-456' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.flightNumber = :flightNumber',
        { flightNumber: 'AA904' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.seat = :seat',
        { seat: '18B' },
      );
      expect(result).toEqual(mockFlightTicket);
    });

    it('should find existing flight ticket without seat', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        flightNumber: 'AA904',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.flightNumber = :flightNumber',
        { flightNumber: 'AA904' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'ticket.seat = :seat',
        expect.anything(),
      );
      expect(result).toEqual(mockFlightTicket);
    });

    it('should find existing flight ticket without seat', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        flightNumber: 'AA904',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.flightNumber = :flightNumber',
        { flightNumber: 'AA904' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'ticket.seat = :seat',
        expect.anything(),
      );
      expect(result).toEqual(mockFlightTicket);
    });

    it('should find existing train ticket with matching criteria', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TRAIN,
        from: { name: 'Innsbruck Hbf', code: 'INN' },
        to: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        seat: '17C',
        number: '765',
        platform: '3',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTrainTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-to-456',
        'place-from-123',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.number = :number',
        { number: '765' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.platform = :platform',
        { platform: '3' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.seat = :seat',
        { seat: '17C' },
      );
      expect(result).toEqual(mockTrainTicket);
    });

    it('should find existing train ticket with partial criteria', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TRAIN,
        from: { name: 'Innsbruck Hbf', code: 'INN' },
        to: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        number: '765',
        platform: '3',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTrainTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-to-456',
        'place-from-123',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.number = :number',
        { number: '765' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.platform = :platform',
        { platform: '3' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'ticket.seat = :seat',
        expect.anything(),
      );
      expect(result).toEqual(mockTrainTicket);
    });

    it('should find existing bus ticket with matching criteria', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.BUS,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        route: 'Airport Express',
        operator: 'City Bus Co',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockBusTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.route = :route',
        { route: 'Airport Express' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.operator = :operator',
        { operator: 'City Bus Co' },
      );
      expect(result).toEqual(mockBusTicket);
    });

    it('should find existing bus ticket with route only', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.BUS,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        route: 'Airport Express',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockBusTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.route = :route',
        { route: 'Airport Express' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'ticket.operator = :operator',
        expect.anything(),
      );
      expect(result).toEqual(mockBusTicket);
    });

    it('should find existing tram ticket with matching criteria', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TRAM,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        line: 'S5',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTramTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.line = :line',
        { line: 'S5' },
      );
      expect(result).toEqual(mockTramTicket);
    });

    it('should find existing tram ticket with line', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TRAM,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        line: 'S5',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTramTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.line = :line',
        { line: 'S5' },
      );
      expect(result).toEqual(mockTramTicket);
    });

    it('should find existing taxi ticket with matching criteria', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TAXI,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        company: 'City Taxi',
        vehicleId: 'TAXI-001',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTaxiTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.company = :company',
        { company: 'City Taxi' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.vehicleId = :vehicleId',
        { vehicleId: 'TAXI-001' },
      );
      expect(result).toEqual(mockTaxiTicket);
    });

    it('should find existing taxi ticket with company only', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.TAXI,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        company: 'City Taxi',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTaxiTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.company = :company',
        { company: 'City Taxi' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'ticket.vehicleId = :vehicleId',
        expect.anything(),
      );
      expect(result).toEqual(mockTaxiTicket);
    });

    it('should find existing boat ticket with matching criteria', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.BOAT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        vessel: 'Sea Explorer',
        dock: 'Pier 3',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockBoatTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.vessel = :vessel',
        { vessel: 'Sea Explorer' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.dock = :dock',
        { dock: 'Pier 3' },
      );
      expect(result).toEqual(mockBoatTicket);
    });

    it('should find existing boat ticket with vessel only', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.BOAT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        vessel: 'Sea Explorer',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockBoatTicket);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-from-123',
        'place-to-456',
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.vessel = :vessel',
        { vessel: 'Sea Explorer' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'ticket.dock = :dock',
        expect.anything(),
      );
      expect(result).toEqual(mockBoatTicket);
    });

    it('should return null when no existing ticket found', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        flightNumber: 'TEST123',
      };

      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findExistingTicket(
        ticketData,
        'place-1',
        'place-2',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'Test', code: 'TEST' },
        to: { name: 'Test2', code: 'TEST2' },
        flightNumber: 'TEST123',
      };

      const dbError = new Error('Database connection failed');
      mockQueryBuilder.getOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        repository.findExistingTicket(ticketData, 'place-1', 'place-2'),
      ).rejects.toThrow(dbError);
    });
  });

  describe('findOrCreateTicket', () => {
    it('should return existing ticket when found', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        flightNumber: 'AA904',
      };

      jest
        .spyOn(repository, 'findExistingTicket')
        .mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.findOrCreateTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(repository.findExistingTicket).toHaveBeenCalledWith(
        ticketData,
        'place-from-123',
        'place-to-456',
      );
      expect(result).toEqual(mockFlightTicket);
    });

    it('should create new ticket when not found', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'St. Anton am Arlberg Bahnhof', code: 'STANT' },
        to: { name: 'Innsbruck Hbf', code: 'INN' },
        flightNumber: 'AA904',
      };

      jest.spyOn(repository, 'findExistingTicket').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createTicket')
        .mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.findOrCreateTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(repository.findExistingTicket).toHaveBeenCalledWith(
        ticketData,
        'place-from-123',
        'place-to-456',
      );
      expect(repository.createTicket).toHaveBeenCalledWith(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );
      expect(result).toEqual(mockFlightTicket);
    });
  });

  describe('countByType', () => {
    it('should count tickets by type', async () => {
      // Arrange
      const mockCounts = [
        { type: TicketType.FLIGHT, count: '5' },
        { type: TicketType.TRAIN, count: '3' },
        { type: TicketType.BUS, count: '2' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockCounts);

      // Act
      const result = await repository.countByType();

      // Assert
      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'ticket',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'ticket.type',
        'type',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(*)',
        'count',
      );
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('ticket.type');
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();

      // Check that all ticket types are included with counts
      expect(result[TicketType.FLIGHT]).toBe(5);
      expect(result[TicketType.TRAIN]).toBe(3);
      expect(result[TicketType.BUS]).toBe(2);
      expect(result[TicketType.TRAM]).toBe(0);
      expect(result[TicketType.BOAT]).toBe(0);
      expect(result[TicketType.TAXI]).toBe(0);
    });

    it('should return zero counts when no tickets exist', async () => {
      // Arrange
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      const result = await repository.countByType();

      // Assert
      expect(result[TicketType.FLIGHT]).toBe(0);
      expect(result[TicketType.TRAIN]).toBe(0);
      expect(result[TicketType.BUS]).toBe(0);
      expect(result[TicketType.TRAM]).toBe(0);
      expect(result[TicketType.BOAT]).toBe(0);
      expect(result[TicketType.TAXI]).toBe(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex findOrCreateTicket scenario', async () => {
      // Arrange
      const ticketData: CreateTicket = {
        type: TicketType.FLIGHT,
        from: { name: 'Test Airport', code: 'TEST' },
        to: { name: 'Destination Airport', code: 'DEST' },
        flightNumber: 'TEST123',
        seat: '12A',
      };

      jest.spyOn(repository, 'findExistingTicket').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createTicket')
        .mockResolvedValue(mockFlightTicket);

      // Act
      const result = await repository.findOrCreateTicket(
        ticketData,
        mockFromPlace,
        mockToPlace,
      );

      // Assert
      expect(repository.findExistingTicket).toHaveBeenCalled();
      expect(repository.createTicket).toHaveBeenCalled();
      expect(result).toEqual(mockFlightTicket);
    });

    it('should handle batch operations with findByIds', async () => {
      // Arrange
      const ids = ['ticket-1', 'ticket-2', 'ticket-3'];
      const mockTickets = [
        { ...mockFlightTicket, id: 'ticket-1' },
        { ...mockTrainTicket, id: 'ticket-2' },
        { ...mockFlightTicket, id: 'ticket-3' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockTickets);

      // Act
      const result = await repository.findByIds(ids);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('ticket-1');
      expect(result[1].id).toBe('ticket-2');
      expect(result[2].id).toBe('ticket-3');
    });
  });
});
