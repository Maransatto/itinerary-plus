import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  ItinerarySortingService,
  RouteGraph,
} from './itinerary-sorting.service';
import { Ticket, TicketType } from '../ticket/entities/ticket.entity';
import { Place } from '../place/entities/place.entity';

describe('ItinerarySortingService', () => {
  let service: ItinerarySortingService;

  // Mock data
  const mockPlaceA: Place = {
    id: 'place-a',
    name: 'St. Anton am Arlberg Bahnhof',
    code: 'STANT',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockPlaceB: Place = {
    id: 'place-b',
    name: 'Innsbruck Hbf',
    code: 'INN',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockPlaceC: Place = {
    id: 'place-c',
    name: 'Venice Airport',
    code: 'VCE',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockTicketAB: Ticket = {
    id: 'ticket-ab',
    type: TicketType.TRAIN,
    from: mockPlaceA,
    to: mockPlaceB,
    seat: '17C',
    notes: 'Platform 3',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockTicketBC: Ticket = {
    id: 'ticket-bc',
    type: TicketType.FLIGHT,
    from: mockPlaceB,
    to: mockPlaceC,
    seat: '18B',
    notes: 'Gate 10',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItinerarySortingService],
    }).compile();

    service = module.get<ItinerarySortingService>(ItinerarySortingService);

    // Mock Logger to suppress console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sortTickets', () => {
    it('should sort tickets in correct order for linear route', async () => {
      // Arrange
      const tickets = [mockTicketBC, mockTicketAB]; // Out of order

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sortedTickets).toHaveLength(2);
      expect(result.sortedTickets[0]).toBe(mockTicketAB);
      expect(result.sortedTickets[1]).toBe(mockTicketBC);
      expect(result.startPlace).toBe(mockPlaceA);
      expect(result.endPlace).toBe(mockPlaceC);
      expect(result.errors).toEqual([]);
    });

    it('should handle single ticket', async () => {
      // Arrange
      const tickets = [mockTicketAB];

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sortedTickets).toHaveLength(1);
      expect(result.sortedTickets[0]).toBe(mockTicketAB);
      expect(result.startPlace).toBe(mockPlaceA);
      expect(result.endPlace).toBe(mockPlaceB);
    });

    it('should handle empty tickets array', async () => {
      // Arrange
      const tickets: Ticket[] = [];

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No tickets provided for sorting');
    });

    it('should handle null tickets array', async () => {
      // Arrange
      const tickets = null as any;

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No tickets provided for sorting');
    });

    it('should handle tickets with invalid places', async () => {
      // Arrange
      const invalidTicket = {
        ...mockTicketAB,
        from: null,
        to: { name: 'Valid Place' },
      } as unknown as Ticket;

      const tickets = [invalidTicket];

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Ticket 1 has invalid 'from' place");
    });

    it('should handle tickets with same from and to places', async () => {
      // Arrange
      const circularTicket = {
        ...mockTicketAB,
        to: mockPlaceA,
      } as Ticket;

      const tickets = [circularTicket];

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Ticket 1 has same 'from' and 'to' place: St. Anton am Arlberg Bahnhof",
      );
    });

    it('should handle disconnected route segments', async () => {
      // Arrange
      const ticketCD = {
        ...mockTicketBC,
        id: 'ticket-cd',
        from: mockPlaceC,
        to: {
          id: 'place-d',
          name: 'Paris CDG',
          code: 'CDG',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        } as Place,
      } as Ticket;

      const tickets = [mockTicketAB, ticketCD]; // A->B and C->D (disconnected)

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('Route has 2 disconnected segments'),
        ),
      ).toBe(true);
    });

    it('should handle circular routes', async () => {
      // Arrange
      const ticketCA = {
        ...mockTicketAB,
        id: 'ticket-ca',
        from: mockPlaceC,
        to: mockPlaceA,
      } as Ticket;

      const tickets = [mockTicketAB, mockTicketBC, ticketCA]; // A->B->C->A

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('Circular route detected'),
        ),
      ).toBe(true);
    });

    it('should handle multiple route options', async () => {
      // Arrange
      const ticketAD = {
        ...mockTicketAB,
        id: 'ticket-ad',
        to: {
          id: 'place-d',
          name: 'Direct Destination',
          code: 'DIR',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        } as Place,
      } as Ticket;

      const tickets = [mockTicketAB, ticketAD]; // A->B and A->D (branching)

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('Multiple possible ending places found'),
        ),
      ).toBe(true);
    });
  });

  describe('Private methods', () => {
    describe('validateBasicRequirements', () => {
      it('should validate basic requirements for valid tickets', () => {
        // Arrange
        const tickets = [mockTicketAB, mockTicketBC];

        // Act
        const result = (service as any).validateBasicRequirements(tickets);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should return error for empty tickets array', () => {
        // Arrange
        const tickets: Ticket[] = [];

        // Act
        const result = (service as any).validateBasicRequirements(tickets);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('No tickets provided for sorting');
      });

      it('should return error for single ticket with invalid from place', () => {
        // Arrange
        const invalidTicket = {
          ...mockTicketAB,
          from: null,
        } as unknown as Ticket;

        const tickets = [invalidTicket];

        // Act
        const result = (service as any).validateBasicRequirements(tickets);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Ticket 1 has invalid 'from' place");
      });

      it('should return error for single ticket with invalid to place', () => {
        // Arrange
        const invalidTicket = {
          ...mockTicketAB,
          to: null,
        } as unknown as Ticket;

        const tickets = [invalidTicket];

        // Act
        const result = (service as any).validateBasicRequirements(tickets);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Ticket 1 has invalid 'to' place");
      });

      it('should return error for ticket with same from and to places', () => {
        // Arrange
        const circularTicket = {
          ...mockTicketAB,
          to: mockPlaceA,
        } as Ticket;

        const tickets = [circularTicket];

        // Act
        const result = (service as any).validateBasicRequirements(tickets);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Ticket 1 has same 'from' and 'to' place: St. Anton am Arlberg Bahnhof",
        );
      });
    });

    describe('buildRouteGraph', () => {
      it('should build correct route graph from tickets', () => {
        // Arrange
        const tickets = [mockTicketAB, mockTicketBC];

        // Act
        const graph = (service as any).buildRouteGraph(tickets);

        // Assert
        expect(graph.nodes.size).toBe(3);
        expect(graph.nodes.has('place-a')).toBe(true);
        expect(graph.nodes.has('place-b')).toBe(true);
        expect(graph.nodes.has('place-c')).toBe(true);
        expect(graph.edges.size).toBe(2);
        expect(graph.edges.get('place-a')).toHaveLength(1);
        expect(graph.edges.get('place-b')).toHaveLength(1);
        expect(graph.inDegree.get('place-a')).toBe(0);
        expect(graph.inDegree.get('place-b')).toBe(1);
        expect(graph.inDegree.get('place-c')).toBe(1);
        expect(graph.outDegree.get('place-a')).toBe(1);
        expect(graph.outDegree.get('place-b')).toBe(1);
        expect(graph.outDegree.get('place-c')).toBe(0);
      });

      it('should handle tickets with invalid places', () => {
        // Arrange
        const invalidTicket = {
          ...mockTicketAB,
          from: null,
        } as unknown as Ticket;

        const tickets = [invalidTicket, mockTicketBC];

        // Act
        const graph = (service as any).buildRouteGraph(tickets);

        // Assert
        expect(graph.nodes.size).toBe(2); // Only valid places
        expect(graph.edges.size).toBe(1); // Only valid edges
      });
    });

    describe('validateGraphStructure', () => {
      it('should validate valid linear graph structure', () => {
        // Arrange
        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-c', mockPlaceC],
          ]),
          edges: new Map([
            ['place-a', [mockTicketAB]],
            ['place-b', [mockTicketBC]],
          ]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
            ['place-c', 1],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 1],
            ['place-c', 0],
          ]),
        };

        // Act
        const result = (service as any).validateGraphStructure(graph);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should detect isolated places', () => {
        // Arrange
        const isolatedPlace: Place = {
          id: 'place-isolated',
          name: 'Isolated Place',
          code: 'ISO',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-isolated', isolatedPlace],
          ]),
          edges: new Map([['place-a', [mockTicketAB]]]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
            ['place-isolated', 0],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 0],
            ['place-isolated', 0],
          ]),
        };

        // Act
        const result = (service as any).validateGraphStructure(graph);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Place 'Isolated Place' is isolated (no connections)",
        );
      });

      it('should detect multiple starting places', () => {
        // Arrange
        const placeD: Place = {
          id: 'place-d',
          name: 'Place D',
          code: 'PLD',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const ticketAD = {
          ...mockTicketAB,
          id: 'ticket-ad',
          to: placeD,
        } as Ticket;

        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-d', placeD],
          ]),
          edges: new Map([['place-a', [mockTicketAB, ticketAD]]]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
            ['place-d', 1],
          ]),
          outDegree: new Map([
            ['place-a', 2],
            ['place-b', 0],
            ['place-d', 0],
          ]),
        };

        // Act
        const result = (service as any).validateGraphStructure(graph);

        // Assert
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) =>
            error.includes('Multiple possible ending places found'),
          ),
        ).toBe(true);
      });

      it('should detect multiple ending places', () => {
        // Arrange
        const placeD: Place = {
          id: 'place-d',
          name: 'Place D',
          code: 'PLD',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const ticketBD = {
          ...mockTicketAB,
          id: 'ticket-bd',
          from: mockPlaceB,
          to: placeD,
        } as Ticket;

        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-c', mockPlaceC],
            ['place-d', placeD],
          ]),
          edges: new Map([
            ['place-a', [mockTicketAB]],
            ['place-b', [mockTicketBC, ticketBD]],
          ]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
            ['place-c', 1],
            ['place-d', 1],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 2],
            ['place-c', 0],
            ['place-d', 0],
          ]),
        };

        // Act
        const result = (service as any).validateGraphStructure(graph);

        // Assert
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) =>
            error.includes('Multiple possible starting places found'),
          ),
        ).toBe(true);
      });
    });

    describe('findStartAndEndPlaces', () => {
      it('should find correct start and end places for linear route', () => {
        // Arrange
        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-c', mockPlaceC],
          ]),
          edges: new Map([
            ['place-a', [mockTicketAB]],
            ['place-b', [mockTicketBC]],
          ]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
            ['place-c', 1],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 1],
            ['place-c', 0],
          ]),
        };

        // Act
        const result = (service as any).findStartAndEndPlaces(graph);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.startPlace).toBe(mockPlaceA);
        expect(result.endPlace).toBe(mockPlaceC);
        expect(result.errors).toEqual([]);
      });

      it('should return error when no starting place found', () => {
        // Arrange
        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
          ]),
          edges: new Map([['place-a', [mockTicketAB]]]),
          inDegree: new Map([
            ['place-a', 1], // All places have incoming connections
            ['place-b', 1],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 0],
          ]),
        };

        // Act
        const result = (service as any).findStartAndEndPlaces(graph);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Could not determine starting place');
      });

      it('should return error when no ending place found', () => {
        // Arrange
        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
          ]),
          edges: new Map([['place-a', [mockTicketAB]]]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 1], // All places have outgoing connections
          ]),
        };

        // Act
        const result = (service as any).findStartAndEndPlaces(graph);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Could not determine ending place');
      });
    });

    describe('traverseGraphToSort', () => {
      it('should traverse graph and sort tickets correctly', () => {
        // Arrange
        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-c', mockPlaceC],
          ]),
          edges: new Map([
            ['place-a', [mockTicketAB]],
            ['place-b', [mockTicketBC]],
          ]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
            ['place-c', 1],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 1],
            ['place-c', 0],
          ]),
        };

        // Act
        const result = (service as any).traverseGraphToSort(graph, mockPlaceA);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.sortedTickets).toHaveLength(2);
        expect(result.sortedTickets[0]).toBe(mockTicketAB);
        expect(result.sortedTickets[1]).toBe(mockTicketBC);
        expect(result.errors).toEqual([]);
      });

      it('should handle multiple route options', () => {
        // Arrange
        const placeD: Place = {
          id: 'place-d',
          name: 'Place D',
          code: 'PLD',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const ticketAD = {
          ...mockTicketAB,
          id: 'ticket-ad',
          to: placeD,
        } as Ticket;

        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-d', placeD],
          ]),
          edges: new Map([
            ['place-a', [mockTicketAB, ticketAD]], // Multiple options
          ]),
          inDegree: new Map([
            ['place-a', 0],
            ['place-b', 1],
            ['place-d', 1],
          ]),
          outDegree: new Map([
            ['place-a', 2],
            ['place-b', 0],
            ['place-d', 0],
          ]),
        };

        // Act
        const result = (service as any).traverseGraphToSort(graph, mockPlaceA);

        // Assert
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) =>
            error.includes('Multiple route options from'),
          ),
        ).toBe(true);
      });

      it('should handle circular routes', () => {
        // Arrange
        const ticketCA = {
          ...mockTicketAB,
          id: 'ticket-ca',
          from: mockPlaceC,
          to: mockPlaceA,
        } as Ticket;

        const graph: RouteGraph = {
          nodes: new Map([
            ['place-a', mockPlaceA],
            ['place-b', mockPlaceB],
            ['place-c', mockPlaceC],
          ]),
          edges: new Map([
            ['place-a', [mockTicketAB]],
            ['place-b', [mockTicketBC]],
            ['place-c', [ticketCA]],
          ]),
          inDegree: new Map([
            ['place-a', 1],
            ['place-b', 1],
            ['place-c', 1],
          ]),
          outDegree: new Map([
            ['place-a', 1],
            ['place-b', 1],
            ['place-c', 1],
          ]),
        };

        // Act
        const result = (service as any).traverseGraphToSort(graph, mockPlaceA);

        // Assert
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) =>
            error.includes('Circular route detected'),
          ),
        ).toBe(true);
      });
    });

    describe('validateSortedSequence', () => {
      it('should validate correct sorted sequence', () => {
        // Arrange
        const tickets = [mockTicketAB, mockTicketBC];

        // Act
        const result = (service as any).validateSortedSequence(tickets);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should detect gaps in route', () => {
        // Arrange
        const ticketCD = {
          ...mockTicketBC,
          id: 'ticket-cd',
          from: mockPlaceC,
          to: {
            id: 'place-d',
            name: 'Place D',
            code: 'PLD',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
          } as Place,
        } as Ticket;

        const tickets = [mockTicketAB, ticketCD]; // Gap between B and C

        // Act
        const result = (service as any).validateSortedSequence(tickets);

        // Assert
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) =>
            error.includes('Gap in route between ticket 1 and 2'),
          ),
        ).toBe(true);
      });

      it('should warn about tight connections', () => {
        // Arrange
        const ticketBB = {
          ...mockTicketAB,
          id: 'ticket-bb',
          from: mockPlaceB,
          to: mockPlaceB, // Same place
          type: TicketType.TRAIN,
        } as Ticket;

        const tickets = [mockTicketAB, ticketBB];

        // Act
        const result = (service as any).validateSortedSequence(tickets);

        // Assert
        expect(result.isValid).toBe(true);
        expect(
          result.warnings.some((warning) =>
            warning.includes('Potential tight connection'),
          ),
        ).toBe(true);
      });

      it('should handle empty sequence', () => {
        // Arrange
        const tickets: Ticket[] = [];

        // Act
        const result = (service as any).validateSortedSequence(tickets);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('No tickets in sorted sequence');
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex multi-segment route with gaps', async () => {
      // Arrange
      const placeD: Place = {
        id: 'place-d',
        name: 'Paris CDG',
        code: 'CDG',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      const ticketCD = {
        ...mockTicketBC,
        id: 'ticket-cd',
        from: mockPlaceC,
        to: placeD,
      } as Ticket;

      const tickets = [mockTicketAB, ticketCD]; // A->B and C->D (disconnected)

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('Route has 2 disconnected segments'),
        ),
      ).toBe(true);
      expect(
        result.errors.some((error) =>
          error.includes(
            'Segment 1: St. Anton am Arlberg Bahnhof → Innsbruck Hbf',
          ),
        ),
      ).toBe(true);
      expect(
        result.errors.some((error) =>
          error.includes('Segment 2: Venice Airport → Paris CDG'),
        ),
      ).toBe(true);
    });

    it('should handle complete Kevin McCallister scenario', async () => {
      // Arrange
      const placeD: Place = {
        id: 'place-d',
        name: 'Bologna San Ruffillo',
        code: 'BOL',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      const placeE: Place = {
        id: 'place-e',
        name: 'Bologna Guglielmo Marconi Airport',
        code: 'BLQ',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      const placeF: Place = {
        id: 'place-f',
        name: 'Paris CDG',
        code: 'CDG',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      const placeG: Place = {
        id: 'place-g',
        name: "Chicago O'Hare",
        code: 'ORD',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      const ticketCD = {
        ...mockTicketBC,
        id: 'ticket-cd',
        from: mockPlaceC,
        to: placeD,
        type: TicketType.TRAIN,
        number: 'ICN 35780',
        platform: '1',
        seat: '13F',
      } as Ticket;

      const ticketDE = {
        ...mockTicketBC,
        id: 'ticket-de',
        from: placeD,
        to: placeE,
        type: TicketType.BUS,
        route: 'Airport Bus',
      } as Ticket;

      const ticketEF = {
        ...mockTicketBC,
        id: 'ticket-ef',
        from: placeE,
        to: placeF,
        type: TicketType.FLIGHT,
        flightNumber: 'AF1229',
        gate: '22',
        seat: '10A',
      } as Ticket;

      const ticketFG = {
        ...mockTicketBC,
        id: 'ticket-fg',
        from: placeF,
        to: placeG,
        type: TicketType.FLIGHT,
        flightNumber: 'AF136',
        gate: '32',
        seat: '10A',
        baggage: 'auto-transfer',
      } as Ticket;

      const tickets = [
        ticketFG,
        mockTicketAB,
        ticketCD,
        ticketEF,
        mockTicketBC,
        ticketDE,
      ]; // Out of order

      // Act
      const result = await service.sortTickets(tickets);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sortedTickets).toHaveLength(6);
      expect(result.startPlace).toBe(mockPlaceA);
      expect(result.endPlace).toBe(placeG);
      expect(result.sortedTickets[0]).toBe(mockTicketAB);
      expect(result.sortedTickets[1]).toBe(mockTicketBC);
      expect(result.sortedTickets[2]).toBe(ticketCD);
      expect(result.sortedTickets[3]).toBe(ticketDE);
      expect(result.sortedTickets[4]).toBe(ticketEF);
      expect(result.sortedTickets[5]).toBe(ticketFG);
    });
  });
});
