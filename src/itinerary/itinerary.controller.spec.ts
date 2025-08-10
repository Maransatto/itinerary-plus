/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { Place } from '../place/entities/place.entity';
import { Ticket, TicketType } from '../ticket/entities/ticket.entity';
import { CreateItineraryDto, RenderType } from './dto/create-itinerary.dto';
import { Itinerary, ItineraryItem } from './entities/itinerary.entity';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';

describe('ItineraryController', () => {
  let controller: ItineraryController;
  let service: jest.Mocked<ItineraryService>;
  let mockResponse: jest.Mocked<Response>;

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
      },
    ],
    render: RenderType.HUMAN,
  };

  const mockHumanReadableSteps = [
    '0. Start.',
    '1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.',
    '2. Last destination reached.',
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItineraryController],
      providers: [
        {
          provide: ItineraryService,
          useValue: {
            createItinerary: jest.fn(),
            findItineraryById: jest.fn(),
            getHumanReadableItinerary: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ItineraryController>(ItineraryController);
    service = module.get(ItineraryService);

    // Mock response object
    mockResponse = {
      req: {
        headers: {},
      },
      header: jest.fn(),
    } as any;

    // Spy on logger
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createItinerary', () => {
    it('should create an itinerary successfully', async () => {
      // Arrange
      const idempotencyKey = 'test-key-123';
      service.createItinerary.mockResolvedValue({
        itinerary: mockItinerary,
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Act
      const result = await controller.createItinerary(
        mockCreateItineraryDto,
        idempotencyKey,
      );

      // Assert
      expect(service.createItinerary).toHaveBeenCalledWith(
        mockCreateItineraryDto,
        idempotencyKey,
      );
      expect(result).toEqual(mockItinerary);
    });

    it('should create an itinerary without idempotency key', async () => {
      // Arrange
      service.createItinerary.mockResolvedValue({
        itinerary: mockItinerary,
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Act
      const result = await controller.createItinerary(mockCreateItineraryDto);

      // Assert
      expect(service.createItinerary).toHaveBeenCalledWith(
        mockCreateItineraryDto,
        undefined,
      );
      expect(result).toEqual(mockItinerary);
    });

    it('should handle validation errors and throw BadRequestException', async () => {
      // Arrange
      service.createItinerary.mockResolvedValue({
        itinerary: null,
        isValid: false,
        errors: ['Required field missing', 'Invalid ticket format'],
        warnings: [],
      });

      // Act & Assert
      await expect(
        controller.createItinerary(mockCreateItineraryDto),
      ).rejects.toThrow(BadRequestException);

      expect(service.createItinerary).toHaveBeenCalledWith(
        mockCreateItineraryDto,
        undefined,
      );
    });

    it('should handle business rule errors and throw UnprocessableEntityException', async () => {
      // Arrange
      service.createItinerary.mockResolvedValue({
        itinerary: null,
        isValid: false,
        errors: [
          'Tickets do not form a continuous route',
          'Multiple paths detected',
        ],
        warnings: [],
      });

      // Act & Assert
      await expect(
        controller.createItinerary(mockCreateItineraryDto),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(service.createItinerary).toHaveBeenCalledWith(
        mockCreateItineraryDto,
        undefined,
      );
    });

    it('should handle warnings and still return successful result', async () => {
      // Arrange
      service.createItinerary.mockResolvedValue({
        itinerary: mockItinerary,
        isValid: true,
        errors: [],
        warnings: ['Some tickets have missing seat assignments'],
      });

      // Act
      const result = await controller.createItinerary(mockCreateItineraryDto);

      // Assert
      expect(result).toEqual(mockItinerary);
      expect(service.createItinerary).toHaveBeenCalledWith(
        mockCreateItineraryDto,
        undefined,
      );
    });

    it('should handle service exceptions and throw InternalServerErrorException', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      service.createItinerary.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(
        controller.createItinerary(mockCreateItineraryDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(service.createItinerary).toHaveBeenCalledWith(
        mockCreateItineraryDto,
        undefined,
      );
    });

    it('should re-throw HttpExceptions from service', async () => {
      // Arrange
      const httpError = new BadRequestException('Invalid input');
      service.createItinerary.mockRejectedValue(httpError);

      // Act & Assert
      await expect(
        controller.createItinerary(mockCreateItineraryDto),
      ).rejects.toThrow(BadRequestException);

      expect(service.createItinerary).toHaveBeenCalledWith(
        mockCreateItineraryDto,
        undefined,
      );
    });
  });

  describe('getItinerary', () => {
    it('should return itinerary in JSON format by default', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      service.findItineraryById.mockResolvedValue(mockItinerary);

      // Act
      const result = await controller.getItinerary(itineraryId, mockResponse);

      // Assert
      expect(service.findItineraryById).toHaveBeenCalledWith(itineraryId);
      expect(result).toEqual(mockItinerary);
      expect(mockResponse.header).not.toHaveBeenCalled();
    });

    it('should return human-readable format when Accept header is text/plain', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      mockResponse.req.headers.accept = 'text/plain';
      service.findItineraryById.mockResolvedValue(mockItinerary);
      service.getHumanReadableItinerary.mockResolvedValue(
        mockHumanReadableSteps,
      );

      // Act
      const result = await controller.getItinerary(itineraryId, mockResponse);

      // Assert
      expect(service.findItineraryById).toHaveBeenCalledWith(itineraryId);
      expect(service.getHumanReadableItinerary).toHaveBeenCalledWith(
        itineraryId,
      );
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain',
      );
      expect(result).toBe(mockHumanReadableSteps.join('\n'));
    });

    it('should throw NotFoundException when itinerary is not found', async () => {
      // Arrange
      const itineraryId = 'non-existent-id';
      service.findItineraryById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.getItinerary(itineraryId, mockResponse),
      ).rejects.toThrow(NotFoundException);

      expect(service.findItineraryById).toHaveBeenCalledWith(itineraryId);
    });

    it('should throw InternalServerErrorException when human-readable generation fails', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      mockResponse.req.headers.accept = 'text/plain';
      service.findItineraryById.mockResolvedValue(mockItinerary);
      service.getHumanReadableItinerary.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.getItinerary(itineraryId, mockResponse),
      ).rejects.toThrow(InternalServerErrorException);

      expect(service.findItineraryById).toHaveBeenCalledWith(itineraryId);
      expect(service.getHumanReadableItinerary).toHaveBeenCalledWith(
        itineraryId,
      );
    });

    it('should handle service exceptions and throw InternalServerErrorException', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const serviceError = new Error('Database error');
      service.findItineraryById.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(
        controller.getItinerary(itineraryId, mockResponse),
      ).rejects.toThrow(InternalServerErrorException);

      expect(service.findItineraryById).toHaveBeenCalledWith(itineraryId);
    });

    it('should re-throw HttpExceptions from service', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const httpError = new NotFoundException('Not found');
      service.findItineraryById.mockRejectedValue(httpError);

      // Act & Assert
      await expect(
        controller.getItinerary(itineraryId, mockResponse),
      ).rejects.toThrow(NotFoundException);

      expect(service.findItineraryById).toHaveBeenCalledWith(itineraryId);
    });
  });

  describe('getItineraryHuman', () => {
    it('should return human-readable itinerary', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      service.getHumanReadableItinerary.mockResolvedValue(
        mockHumanReadableSteps,
      );

      // Act
      const result = await controller.getItineraryHuman(itineraryId);

      // Assert
      expect(service.getHumanReadableItinerary).toHaveBeenCalledWith(
        itineraryId,
      );
      expect(result).toBe(mockHumanReadableSteps.join('\n'));
    });

    it('should throw NotFoundException when itinerary is not found', async () => {
      // Arrange
      const itineraryId = 'non-existent-id';
      service.getHumanReadableItinerary.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getItineraryHuman(itineraryId)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.getHumanReadableItinerary).toHaveBeenCalledWith(
        itineraryId,
      );
    });

    it('should handle service exceptions and throw InternalServerErrorException', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const serviceError = new Error('Database error');
      service.getHumanReadableItinerary.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getItineraryHuman(itineraryId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(service.getHumanReadableItinerary).toHaveBeenCalledWith(
        itineraryId,
      );
    });

    it('should re-throw HttpExceptions from service', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      const httpError = new NotFoundException('Not found');
      service.getHumanReadableItinerary.mockRejectedValue(httpError);

      // Act & Assert
      await expect(controller.getItineraryHuman(itineraryId)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.getHumanReadableItinerary).toHaveBeenCalledWith(
        itineraryId,
      );
    });
  });

  describe('handleSortingErrors', () => {
    it('should throw BadRequestException for validation errors', () => {
      // Arrange
      const result = {
        errors: ['Required field missing', 'Invalid format'],
        warnings: [],
      };

      // Act & Assert
      expect(() => {
        (controller as any).handleSortingErrors(result);
      }).toThrow(BadRequestException);
    });

    it('should throw UnprocessableEntityException for business rule errors', () => {
      // Arrange
      const result = {
        errors: [
          'Tickets do not form a continuous route',
          'Multiple paths detected',
        ],
        warnings: [],
      };

      // Act & Assert
      expect(() => {
        (controller as any).handleSortingErrors(result);
      }).toThrow(UnprocessableEntityException);
    });

    it('should throw InternalServerErrorException for other errors', () => {
      // Arrange
      const result = {
        errors: ['Unknown error occurred'],
        warnings: [],
      };

      // Act & Assert
      expect(() => {
        (controller as any).handleSortingErrors(result);
      }).toThrow(InternalServerErrorException);
    });
  });

  describe('hasValidationErrors', () => {
    it('should return true for validation-related errors', () => {
      // Arrange
      const errors = [
        'Required field missing',
        'Invalid format',
        'Empty array',
      ];

      // Act
      const result = (controller as any).hasValidationErrors(errors);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-validation errors', () => {
      // Arrange
      const errors = ['Route not found', 'Connection failed'];

      // Act
      const result = (controller as any).hasValidationErrors(errors);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasBusinessRuleErrors', () => {
    it('should return true for business rule violations', () => {
      // Arrange
      const errors = [
        'Route not found',
        'Multiple paths detected',
        'Circular reference',
      ];

      // Act
      const result = (controller as any).hasBusinessRuleErrors(errors);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-business rule errors', () => {
      // Arrange
      const errors = ['Required field missing', 'Database error'];

      // Act
      const result = (controller as any).hasBusinessRuleErrors(errors);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('logging', () => {
    it('should log debug messages for createItinerary', async () => {
      // Arrange
      service.createItinerary.mockResolvedValue({
        itinerary: mockItinerary,
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Act
      await controller.createItinerary(mockCreateItineraryDto);

      // Assert
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        'Creating itinerary with 1 tickets',
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Successfully created itinerary itinerary-123',
      );
    });

    it('should log warnings when itinerary creation has warnings', async () => {
      // Arrange
      service.createItinerary.mockResolvedValue({
        itinerary: mockItinerary,
        isValid: true,
        errors: [],
        warnings: ['Some warnings'],
      });

      // Act
      await controller.createItinerary(mockCreateItineraryDto);

      // Assert
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Itinerary created with warnings: Some warnings',
      );
    });

    it('should log errors when itinerary creation fails', async () => {
      // Arrange
      service.createItinerary.mockResolvedValue({
        itinerary: null,
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
      });

      // Act & Assert
      await expect(
        controller.createItinerary(mockCreateItineraryDto),
      ).rejects.toThrow();

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Itinerary creation failed: Validation failed',
      );
    });

    it('should log debug messages for getItinerary', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      service.findItineraryById.mockResolvedValue(mockItinerary);

      // Act
      await controller.getItinerary(itineraryId, mockResponse);

      // Assert
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        `Retrieving itinerary: ${itineraryId}`,
      );
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        `Successfully retrieved itinerary: ${itineraryId}`,
      );
    });

    it('should log debug messages for getItineraryHuman', async () => {
      // Arrange
      const itineraryId = 'itinerary-123';
      service.getHumanReadableItinerary.mockResolvedValue(
        mockHumanReadableSteps,
      );

      // Act
      await controller.getItineraryHuman(itineraryId);

      // Assert
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        `Retrieving human-readable itinerary: ${itineraryId}`,
      );
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        `Successfully retrieved human-readable itinerary: ${itineraryId}`,
      );
    });
  });
});
