import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * E2E Tests for Itinerary API
 *
 * These tests cover all critical scenarios including:
 * - Successful itinerary creation and sorting
 * - Error handling for invalid inputs
 * - Business rule violations (disconnected segments, circular routes, etc.)
 * - Different ticket types
 * - API endpoints (POST and GET)
 * - Idempotency functionality
 *
 * Note: Logger is mocked to reduce noise in test output
 */

describe('Itinerary API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mock the logger to reduce noise in test output
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
    app.useLogger(mockLogger);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/itineraries', () => {
    describe('Successful Scenarios', () => {
      it('should create a complete linear itinerary successfully', async () => {
        const completeItineraryRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'St. Anton am Arlberg Bahnhof' },
              to: { name: 'Innsbruck Hbf' },
              number: 'RJX 765',
              platform: '3',
              seat: '17C',
            },
            {
              type: 'tram',
              from: { name: 'Innsbruck Hbf' },
              to: { name: 'Innsbruck Airport' },
              line: 'S5',
            },
            {
              type: 'flight',
              from: { name: 'Innsbruck Airport', code: 'INN' },
              to: { name: 'Venice Airport', code: 'VCE' },
              flightNumber: 'AA904',
              gate: '10',
              seat: '18B',
              baggage: 'self-check-in',
            },
            {
              type: 'taxi',
              from: { name: 'Venice Airport', code: 'VCE' },
              to: { name: 'Gara Venetia Santa Lucia' },
              company: 'Venice Airport Taxi',
              driver: 'Marco',
              vehicleId: 'VE-TX-456',
            },
            {
              type: 'train',
              from: { name: 'Gara Venetia Santa Lucia' },
              to: { name: 'Bologna San Ruffillo' },
              number: 'ICN 35780',
              platform: '1',
              seat: '13F',
            },
            {
              type: 'bus',
              from: { name: 'Bologna San Ruffillo' },
              to: { name: 'Bologna Guglielmo Marconi Airport' },
              operator: 'Airport Shuttle',
            },
            {
              type: 'flight',
              from: { name: 'Bologna Guglielmo Marconi Airport', code: 'BLQ' },
              to: { name: 'Paris CDG Airport', code: 'CDG' },
              flightNumber: 'AF1229',
              gate: '22',
              seat: '10A',
              baggage: 'self-check-in',
            },
            {
              type: 'flight',
              from: { name: 'Paris CDG Airport', code: 'CDG' },
              to: { name: "Chicago O'Hare", code: 'ORD' },
              flightNumber: 'AF136',
              gate: '32',
              seat: '10A',
              baggage: 'auto-transfer',
            },
          ],
          render: 'both',
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(completeItineraryRequest)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('items');
        expect(response.body.items).toHaveLength(8);
        expect(response.body).toHaveProperty('start');
        expect(response.body).toHaveProperty('end');
        expect(response.body.start.name).toBe('St. Anton am Arlberg Bahnhof');
        expect(response.body.end.name).toBe("Chicago O'Hare");
      });

      it('should handle idempotency key correctly', async () => {
        const itineraryRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'Station A' },
              to: { name: 'Station B' },
              number: 'T123',
              platform: '1',
            },
            {
              type: 'bus',
              from: { name: 'Station B' },
              to: { name: 'Station C' },
              operator: 'City Bus',
            },
          ],
        };

        const idempotencyKey = 'test-key-123';

        // First request
        const response1 = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .set('idempotency-key', idempotencyKey)
          .send(itineraryRequest)
          .expect(201);

        // Second request with same key should return same result
        const response2 = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .set('idempotency-key', idempotencyKey)
          .send(itineraryRequest)
          .expect(201);

        expect(response1.body.id).toBe(response2.body.id);
        expect(response1.body.items).toEqual(response2.body.items);
      });
    });

    describe('Disconnected Segments (Multiple Starting Places)', () => {
      it('should reject itinerary with disconnected segments', async () => {
        // Original example without the taxi ticket - creates 2 disconnected segments
        const disconnectedItineraryRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'St. Anton am Arlberg Bahnhof' },
              to: { name: 'Innsbruck Hbf' },
              number: 'RJX 765',
              platform: '3',
              seat: '17C',
            },
            {
              type: 'tram',
              from: { name: 'Innsbruck Hbf' },
              to: { name: 'Innsbruck Airport' },
              line: 'S5',
            },
            {
              type: 'flight',
              from: { name: 'Innsbruck Airport', code: 'INN' },
              to: { name: 'Venice Airport', code: 'VCE' },
              flightNumber: 'AA904',
              gate: '10',
              seat: '18B',
              baggage: 'self-check-in',
            },
            // Missing taxi ticket creates gap here
            {
              type: 'train',
              from: { name: 'Gara Venetia Santa Lucia' },
              to: { name: 'Bologna San Ruffillo' },
              number: 'ICN 35780',
              platform: '1',
              seat: '13F',
            },
            {
              type: 'bus',
              from: { name: 'Bologna San Ruffillo' },
              to: { name: 'Bologna Guglielmo Marconi Airport' },
              operator: 'Airport Shuttle',
            },
            {
              type: 'flight',
              from: { name: 'Bologna Guglielmo Marconi Airport', code: 'BLQ' },
              to: { name: 'Paris CDG Airport', code: 'CDG' },
              flightNumber: 'AF1229',
              gate: '22',
              seat: '10A',
              baggage: 'self-check-in',
            },
            {
              type: 'flight',
              from: { name: 'Paris CDG Airport', code: 'CDG' },
              to: { name: "Chicago O'Hare", code: 'ORD' },
              flightNumber: 'AF136',
              gate: '32',
              seat: '10A',
              baggage: 'auto-transfer',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(disconnectedItineraryRequest)
          .expect(422);

        expect(response.body.message).toBe(
          'Tickets do not form a valid itinerary',
        );
        expect(response.body.errors[0]).toContain('disconnected segments');
      });
    });

    describe('Circular Routes', () => {
      it('should reject circular route', async () => {
        const circularRouteRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'Station A' },
              to: { name: 'Station B' },
              number: 'T1',
              platform: '1',
            },
            {
              type: 'bus',
              from: { name: 'Station B' },
              to: { name: 'Station C' },
              operator: 'City Bus',
            },
            {
              type: 'taxi',
              from: { name: 'Station C' },
              to: { name: 'Station A' },
              company: 'Local Taxi',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(circularRouteRequest)
          .expect(422);

        expect(response.body.message).toBe(
          'Tickets do not form a valid itinerary',
        );
        expect(response.body.errors).toContain('Circular route detected');
      });
    });

    describe('Multiple Branches', () => {
      it('should reject route with multiple branches', async () => {
        const multipleBranchesRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'Station A' },
              to: { name: 'Station B' },
              number: 'T1',
              platform: '1',
            },
            {
              type: 'bus',
              from: { name: 'Station B' },
              to: { name: 'Station C' },
              operator: 'City Bus',
            },
            {
              type: 'taxi',
              from: { name: 'Station B' },
              to: { name: 'Station D' },
              company: 'Local Taxi',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(multipleBranchesRequest)
          .expect(422);

        expect(response.body.message).toBe(
          'Tickets do not form a valid itinerary',
        );
        expect(response.body.errors[0]).toContain(
          'Multiple possible starting places found',
        );
      });
    });

    describe('Invalid Input Validation', () => {
      it('should reject empty tickets array', async () => {
        const emptyRequest = {
          tickets: [],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(emptyRequest)
          .expect(500);

        expect(response.body.message).toBe('Unable to process itinerary');
        expect(response.body.errors[0]).toContain('No tickets provided');
      });

      it('should reject ticket with missing from place', async () => {
        const invalidRequest = {
          tickets: [
            {
              type: 'train',
              to: { name: 'Station B' },
              number: 'T1',
              platform: '1',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.message).toBe('Invalid input data');
        expect(response.body.errors[0]).toContain(
          'From place name is required',
        );
      });

      it('should reject ticket with missing to place', async () => {
        const invalidRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'Station A' },
              number: 'T1',
              platform: '1',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.message).toBe('Invalid input data');
        expect(response.body.errors[0]).toContain('To place name is required');
      });

      it('should reject ticket with same from and to place', async () => {
        const invalidRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'Station A' },
              to: { name: 'Station A' },
              number: 'T1',
              platform: '1',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(invalidRequest)
          .expect(500);

        expect(response.body.message).toBe('Unable to process itinerary');
        expect(response.body.errors[0]).toContain(
          'From and to places cannot be the same',
        );
      });

      it('should reject malformed JSON', async () => {
        await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send('invalid json')
          .expect(500);
      });
    });

    describe('Different Ticket Types', () => {
      it('should handle all ticket types correctly', async () => {
        const allTicketTypesRequest = {
          tickets: [
            {
              type: 'train',
              from: { name: 'Train Station A' },
              to: { name: 'Train Station B' },
              number: 'T123',
              platform: '1',
              seat: '12A',
            },
            {
              type: 'flight',
              from: { name: 'Train Station B' },
              to: { name: 'Airport A', code: 'AAA' },
              flightNumber: 'FL123',
              gate: '10',
              seat: '15B',
              baggage: 'self-check-in',
            },
            {
              type: 'bus',
              from: { name: 'Airport A', code: 'AAA' },
              to: { name: 'Bus Stop A' },
              operator: 'City Bus',
            },
            {
              type: 'tram',
              from: { name: 'Bus Stop A' },
              to: { name: 'Tram Stop A' },
              line: 'T1',
            },
            {
              type: 'taxi',
              from: { name: 'Tram Stop A' },
              to: { name: 'Location A' },
              company: 'Local Taxi',
              driver: 'John',
              vehicleId: 'TX-123',
            },
            {
              type: 'boat',
              from: { name: 'Location A' },
              to: { name: 'Port A' },
              vessel: 'Ferry 1',
              deck: 'Main',
              cabin: 'C101',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/v1/itineraries')
          .send(allTicketTypesRequest)
          .expect(201);

        expect(response.body.items).toHaveLength(6);
        expect(response.body.items[0].ticket.type).toBe('train');
        expect(response.body.items[1].ticket.type).toBe('flight');
        expect(response.body.items[2].ticket.type).toBe('bus');
        expect(response.body.items[3].ticket.type).toBe('tram');
        expect(response.body.items[4].ticket.type).toBe('taxi');
        expect(response.body.items[5].ticket.type).toBe('boat');
      });
    });
  });

  describe('GET /v1/itineraries/:id', () => {
    let createdItineraryId: string;

    beforeEach(async () => {
      // Create a test itinerary for GET tests
      const testRequest = {
        tickets: [
          {
            type: 'train',
            from: { name: 'Station A' },
            to: { name: 'Station B' },
            number: 'T123',
            platform: '1',
          },
          {
            type: 'bus',
            from: { name: 'Station B' },
            to: { name: 'Station C' },
            operator: 'City Bus',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/v1/itineraries')
        .send(testRequest);

      createdItineraryId = response.body.id;
    });

    it('should return itinerary in JSON format by default', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/itineraries/${createdItineraryId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdItineraryId);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('start');
      expect(response.body).toHaveProperty('end');
    });

    it('should return human-readable format when requested', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/itineraries/${createdItineraryId}`)
        .set('Accept', 'text/plain')
        .expect(200);

      expect(response.text).toContain('Start.');
      expect(response.text).toContain('Board train');
      expect(response.text).toContain('City Bus bus');
      expect(response.text).toContain('Last destination reached.');
    });

    it('should return 404 for non-existent itinerary', async () => {
      await request(app.getHttpServer())
        .get('/v1/itineraries/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll test with invalid data that might cause issues
      const invalidRequest = {
        tickets: [
          {
            type: 'invalid_type',
            from: { name: 'A' },
            to: { name: 'B' },
          },
        ],
      };

      // This should either return 400 (validation error) or 500 (server error)
      const response = await request(app.getHttpServer())
        .post('/v1/itineraries')
        .send(invalidRequest);

      expect([400, 500]).toContain(response.status);
    });
  });
});
