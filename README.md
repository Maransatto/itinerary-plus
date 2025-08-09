# Itinerary Plus (NestJS)

Contract-first API to sort travel tickets into a complete itinerary and render a human-readable version.

## Mock the API (no backend needed)

You can mock the endpoints from the OpenAPI contract immediately.

### Prerequisites

- Node.js >= 18

### Using Prism (recommended)

1. Install Prism CLI (globally or via npx):

   ```bash
   npx @stoplight/prism-cli@5 mock openapi.yaml
   ```

2. Prism will start a mock server (default on `http://127.0.0.1:4010`).

3. Try the examples:
   - Create itinerary (201)

     ```bash
     curl -i \
       -H "Content-Type: application/json" \
       -H "Idempotency-Key: demo-123" \
       --data @examples/create-itinerary-request.json \
       http://127.0.0.1:4010/v1/itineraries
     ```

   - Retrieve by id (200 JSON)

     ```bash
     curl -i http://127.0.0.1:4010/v1/itineraries/5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b
     ```

   - Retrieve human-readable (text/plain)

     ```bash
     curl -i -H "Accept: text/plain" http://127.0.0.1:4010/v1/itineraries/5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b
     ```

   - Example business error (422)
     ```bash
     curl -i \
       -H "Content-Type: application/json" \
       --data @examples/error-422.json \
       http://127.0.0.1:4010/v1/itineraries
     ```

### Notes

- Spec version: OpenAPI 3.1.0 (`openapi.yaml`).
- No authentication in v1.
- Status codes: 201 (create), 200 (get), 400, 404, 409, 422, 500.
- Extensible tickets via `type` discriminator: train, tram, bus, boat, flight, taxi.

---

## API contract (summary)

- POST `/v1/itineraries`
  - Body:
    ```json
    {
      "tickets": [
        {
          "type": "train",
          "from": { "name": "St. Anton am Arlberg Bahnhof" },
          "to": { "name": "Innsbruck Hbf" },
          "number": "RJX 765",
          "platform": "3",
          "seat": "17C"
        },
        {
          "type": "tram",
          "from": { "name": "Innsbruck Hbf" },
          "to": { "name": "Innsbruck Airport" },
          "line": "S5"
        },
        {
          "type": "flight",
          "from": { "name": "Innsbruck Airport", "code": "INN" },
          "to": { "name": "Venice Airport", "code": "VCE" },
          "flightNumber": "AA904",
          "gate": "10",
          "seat": "18B",
          "baggage": "self-check-in"
        }
      ],
      "render": "both"
    }
    ```
  - 201 Response (JSON):
    ```json
    {
      "id": "5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b",
      "start": { "name": "St. Anton am Arlberg Bahnhof" },
      "end": { "name": "Venice Airport", "code": "VCE" },
      "items": [
        {
          "index": 0,
          "type": "train",
          "from": { "name": "St. Anton am Arlberg Bahnhof" },
          "to": { "name": "Innsbruck Hbf" },
          "number": "RJX 765",
          "platform": "3",
          "seat": "17C"
        },
        {
          "index": 1,
          "type": "tram",
          "from": { "name": "Innsbruck Hbf" },
          "to": { "name": "Innsbruck Airport" },
          "line": "S5"
        },
        {
          "index": 2,
          "type": "flight",
          "from": { "name": "Innsbruck Airport", "code": "INN" },
          "to": { "name": "Venice Airport", "code": "VCE" },
          "flightNumber": "AA904",
          "gate": "10",
          "seat": "18B",
          "baggage": "self-check-in"
        }
      ],
      "stepsHuman": [
        "0. Start.",
        "1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.",
        "2. Board the Tram S5 from Innsbruck Hbf to Innsbruck Airport.",
        "3. From Innsbruck Airport, board the flight AA904 to Venice Airport from gate 10, seat 18B. Self-check-in luggage at counter.",
        "4. Last destination reached."
      ],
      "createdAt": "2025-08-08T10:00:00Z"
    }
    ```
  - Headers: optional `Idempotency-Key` (request), `Location` (response)
  - Errors: 400 validation, 409 idempotency conflict, 422 disconnected itinerary

- GET `/v1/itineraries/{id}`
  - 200 Response (JSON): same shape as above
  - `Accept: text/plain` returns human-readable itinerary (one step per line)

- GET `/v1/itineraries/{id}/human`
  - 200 Response (text/plain): same human-readable content

### Ticket model (input)

- Common fields: `type`, `from.name`, `to.name`, optional `seat`, `notes`, `meta`
- By `type`:
  - train: `number`, `platform`, `line?`
  - tram: `line`
  - bus: `service`
  - boat: `vessel`
  - flight: `airline?`, `flightNumber` (required), `gate?`, `baggage` (auto-transfer | self-check-in | counter)
  - taxi: `provider?`

---

## Postman import note

Postman may show “Too many levels of nesting to fake this schema” when importing OpenAPI 3.1 with `oneOf` + `allOf` inheritance.

Workarounds:

- Prefer Swagger UI or Prism for mocking.
- Or switch the spec to OpenAPI 3.0.3 and reduce `allOf` depth (e.g., avoid `ItineraryItem` inheriting from `Ticket`).
- Or keep the spec as-is and rely on the concrete JSON examples in `examples/` for Postman requests.

## Development Progress

This project follows a contract-first approach with systematic layered development:

### Phase 1: Contract & API Design ✅

- **DTOs and Entities**: Created comprehensive data transfer objects and entity models for tickets, places, and itineraries
- **OpenAPI Specification**: Defined complete API contract in `openapi.yaml` with proper validation schemas
- **Swagger Integration**: Set up Swagger UI for API documentation and testing
- **Mock Samples**: Provided JSON examples in `examples/` directory to support other teams for mocking and testing

### Phase 2: Database Layer 🚧 (Current)

- **Docker Setup**: Created containerized PostgreSQL database environment
- **TypeORM Integration**: Configured TypeORM with proper entity relationships and migrations
- **Entity Refinement**: Adjusted previously created entities to work with database constraints and relationships

#### Database Setup

1. **Start the PostgreSQL database**:

   ```bash
   docker-compose up -d postgres
   ```

2. **Database Configuration**:
   - **Host**: localhost
   - **Port**: 5433 (to avoid conflicts with existing PostgreSQL installations)
   - **Database**: itinerary_plus
   - **Username**: kevin
   - **Password**: mcallister2024

3. **Verify database is running**:

   ```bash
   docker-compose ps
   ```

4. **Access database directly** (if needed):

   ```bash
   docker exec -it itinerary-plus-db psql -U kevin -d itinerary_plus
   ```

5. **Stop database**:
   ```bash
   docker-compose down
   ```

### Phase 3: Service Layer (Upcoming)

- **Service Implementation**: Create service layer with initial mocked logic for business operations
- **Repository Integration**: Implement repositories to handle database operations through TypeORM
- **Data Persistence**: Connect services to repositories for actual database interactions

### Phase 4: Controller Layer (Upcoming)

- **Controller Implementation**: Wire up NestJS controllers to use the service layer
- **Request/Response Handling**: Implement proper HTTP handling with validation and error responses
- **API Contract Compliance**: Ensure controllers match the OpenAPI specification

### Phase 5: Testing Layer (Upcoming)

- **Unit Tests**: Comprehensive Jest test coverage for services and utilities
- **Integration Tests**: End-to-end tests for API endpoints
- **Test Data**: Create fixtures and test scenarios

### Database Design Notes

The current implementation creates a simplified data model where the `create itinerary` endpoint will:

- **Auto-create places and tickets**: If places or tickets don't exist in the database, they will be created automatically
- **Accept some redundancy**: Initially, tickets may contain duplicate information (e.g., multiple flight tickets for the same flight but different seats)

**Future Enhancement Opportunities:**

- **Granular flight data**: Extract shared flight information (airline, flight number, departure time, aircraft type) into a separate `Flight` entity
- **Train service normalization**: Create a `TrainService` entity with train number, route, operator, and schedule that multiple train tickets can reference
- **Bus route optimization**: Implement `BusRoute` entities containing service number, operator, and route details shared across multiple bus tickets
- **Boat/Ferry services**: Extract vessel information, operator, and route into reusable `BoatService` entities
- **Transportation hubs**: Create `TransportationHub` entities for airports, train stations, and bus terminals with detailed facility information
- **Ticket normalization**: Create relationships where multiple tickets can reference the same underlying transportation service
- **Optimized storage**: Reduce data duplication by normalizing transportation services and shared infrastructure

_Note: The granular normalization is not in scope for the current implementation, prioritizing rapid development and API functionality._

---

## Next Steps (implementation)

- Complete TypeORM entity relationships and migrations
- Implement service layer with sorting algorithm
- Wire up controllers with proper validation
