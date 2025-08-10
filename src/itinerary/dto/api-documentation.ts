/**
 * API Documentation Constants
 *
 * This file contains all the detailed descriptions and examples for the Swagger documentation.
 * This keeps the controller clean while maintaining comprehensive API documentation.
 */

export const API_DOCUMENTATION = {
  // Main endpoint descriptions
  CREATE_ITINERARY: {
    summary: 'Create and sort an itinerary from unsorted tickets',
    description: `Accepts a set of unsorted tickets, sorts them into a single uninterrupted itinerary, and returns the created itinerary with an identifier.

**How it works:**
1. Validates all tickets have required fields (type, from, to)
2. Builds a directed graph from places and tickets
3. Analyzes the graph to find start/end points and detect issues
4. Sorts tickets into the correct order using graph traversal
5. Generates human-readable instructions (optional)
6. Stores the itinerary with a unique ID for later retrieval

**Success Response (201):**
- Returns the complete sorted itinerary with all ticket details
- Includes human-readable steps if \`render\` is set to \`human\` or \`both\`
- Provides a unique ID for retrieving the itinerary later

**Common Error Scenarios:**
- **400 Bad Request**: Invalid input data (missing fields, malformed JSON)
- **422 Unprocessable Entity**: Tickets don't form a valid itinerary (disconnected segments, circular routes, etc.)
- **409 Conflict**: Idempotency key conflicts
- **500 Internal Server Error**: System-level issues

Set the \`render\` field to \`human\` or \`both\` to request a human-readable output.`,
  },

  GET_ITINERARY: {
    summary: 'Retrieve an itinerary by id',
    description:
      'Returns the itinerary in JSON. Set Accept: text/plain to receive the human-readable version.',
  },

  GET_ITINERARY_HUMAN: {
    summary: 'Retrieve an itinerary in human-readable form',
    description:
      'Convenience endpoint for plain text rendering of an itinerary',
  },

  // Error response descriptions
  ERRORS: {
    BAD_REQUEST: {
      description: `The request was invalid due to validation errors or malformed input.

**Common causes:**
- Empty tickets array
- Missing required fields (type, from, to)
- Invalid ticket type
- Malformed JSON structure
- Missing or invalid place names`,
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Invalid input data' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'tickets should not be empty',
              "Each ticket must have a valid 'from' place",
            ],
          },
          warnings: {
            type: 'array',
            items: { type: 'string' },
            example: [],
          },
        },
      },
    },

    CONFLICT: {
      description: `The request conflicts with the current state.

**This typically occurs when:**
- An idempotency key is reused with a different payload
- The same itinerary is being created simultaneously`,
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Idempotency key already used with a different payload',
          },
          error: {
            type: 'string',
            example: "Key 'demo-123' was used for a different request",
          },
        },
      },
    },

    UNPROCESSABLE_ENTITY: {
      description: `Business rule violation - the tickets cannot form a valid itinerary.

**Common scenarios:**
- **Disconnected segments**: Tickets form multiple separate route segments
- **Circular routes**: Tickets create loops in the itinerary
- **Multiple branches**: A place has multiple possible next destinations
- **Missing connections**: Gaps between consecutive tickets
- **Invalid endpoints**: No clear start or end point

The response includes detailed analysis of the route structure and suggestions for fixing the issues.`,
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Tickets do not form a valid itinerary',
          },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: [
              "Route has 2 disconnected segments. Segment 1: Gara Venetia Santa Lucia → Chicago O'Hare (4 tickets, 5 places); Segment 2: St. Anton am Arlberg Bahnhof → Venice Airport (3 tickets, 4 places). Potential connections needed: Missing: Chicago O'Hare → St. Anton am Arlberg Bahnhof; Missing: Venice Airport → Gara Venetia Santa Lucia",
            ],
          },
          warnings: {
            type: 'array',
            items: { type: 'string' },
            example: [],
          },
        },
      },
    },

    INTERNAL_SERVER_ERROR: {
      description: `Unexpected server error occurred while processing the request.

This indicates a system-level issue that should be reported to the development team.
The error details are logged for debugging purposes.`,
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'An unexpected error occurred while processing the itinerary',
          },
          error: { type: 'string', example: 'Database connection timeout' },
        },
      },
    },

    NOT_FOUND: {
      description: 'The requested resource was not found',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Itinerary not found' },
          error: {
            type: 'string',
            example:
              'No itinerary found with ID: 5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b',
          },
        },
      },
    },
  },

  // Success response examples
  EXAMPLES: {
    HUMAN_READABLE: `0. Start.
1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.
2. Board the Tram S5 from Innsbruck Hbf to Innsbruck Airport.
3. From Innsbruck Airport, board the flight AA904 to Venice Airport from gate 10, seat 18B. Self-check-in luggage at counter.
4. Last destination reached.`,
  },
} as const;
