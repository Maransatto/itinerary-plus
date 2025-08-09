import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateItineraryDto, RenderType } from './dto/create-itinerary.dto';
import { Itinerary } from './entities/itinerary.entity';
import {
  CreateTrainTicketDto,
  CreateFlightTicketDto,
  CreateTramTicketDto,
  CreateBusTicketDto,
  CreateBoatTicketDto,
  CreateTaxiTicketDto,
} from '../ticket/dto';

@ApiTags('Itineraries')
@ApiExtraModels(
  CreateTrainTicketDto,
  CreateFlightTicketDto,
  CreateTramTicketDto,
  CreateBusTicketDto,
  CreateBoatTicketDto,
  CreateTaxiTicketDto,
)
@Controller('v1/itineraries')
export class ItineraryController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create and sort an itinerary from unsorted tickets',
    description:
      'Accepts a set of unsorted tickets, sorts them into a single uninterrupted itinerary, and returns the created itinerary with an identifier.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Optional idempotency key to safely retry POST requests.',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Itinerary created and sorted successfully',
    type: Itinerary,
  })
  @ApiResponse({
    status: 400,
    description: 'The request was invalid (validation or malformed input)',
  })
  @ApiResponse({
    status: 409,
    description: 'The request conflicts with the current state',
  })
  @ApiResponse({
    status: 422,
    description:
      'Business rule violation (e.g., tickets do not form a single uninterrupted path)',
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error',
  })
  async createItinerary(
    @Body() createItineraryDto: CreateItineraryDto,
  ): Promise<any> {
    // TODO: Implement sorting logic
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock response that matches what we expect
    const mockResponse = {
      id: '5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b',
      start: { name: 'St. Anton am Arlberg Bahnhof' },
      end: { name: 'Venice Airport', code: 'VCE' },
      items: [
        {
          index: 0,
          type: 'train',
          from: { name: 'St. Anton am Arlberg Bahnhof' },
          to: { name: 'Innsbruck Hbf' },
          number: 'RJX 765',
          platform: '3',
          seat: '17C',
        },
        {
          index: 1,
          type: 'tram',
          from: { name: 'Innsbruck Hbf' },
          to: { name: 'Innsbruck Airport' },
          line: 'S5',
        },
        {
          index: 2,
          type: 'flight',
          from: { name: 'Innsbruck Airport', code: 'INN' },
          to: { name: 'Venice Airport', code: 'VCE' },
          flightNumber: 'AA904',
          gate: '10',
          seat: '18B',
          baggage: 'self-check-in',
        },
      ],
      stepsHuman: [
        '0. Start.',
        '1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.',
        '2. Board the Tram S5 from Innsbruck Hbf to Innsbruck Airport.',
        '3. From Innsbruck Airport, board the flight AA904 to Venice Airport from gate 10, seat 18B. Self-check-in luggage at counter.',
        '4. Last destination reached.',
      ],
      createdAt: new Date().toISOString(),
    };

    // Include human-readable steps if requested
    if (
      createItineraryDto.render === RenderType.HUMAN ||
      createItineraryDto.render === RenderType.BOTH
    ) {
      return mockResponse;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { stepsHuman, ...responseWithoutHuman } = mockResponse;
      return responseWithoutHuman;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve an itinerary by id',
    description:
      'Returns the itinerary in JSON. Set Accept: text/plain to receive the human-readable version.',
  })
  @ApiParam({
    name: 'id',
    description: 'Itinerary ID',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Itinerary found',
    type: Itinerary,
  })
  @ApiResponse({
    status: 404,
    description: 'The requested resource was not found',
  })
  async getItinerary(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Implement retrieval logic
    const mockResponse = {
      id,
      start: { name: 'St. Anton am Arlberg Bahnhof' },
      end: { name: 'Venice Airport', code: 'VCE' },
      items: [
        {
          index: 0,
          type: 'train',
          from: { name: 'St. Anton am Arlberg Bahnhof' },
          to: { name: 'Innsbruck Hbf' },
          number: 'RJX 765',
          platform: '3',
          seat: '17C',
        },
        {
          index: 1,
          type: 'tram',
          from: { name: 'Innsbruck Hbf' },
          to: { name: 'Innsbruck Airport' },
          line: 'S5',
        },
        {
          index: 2,
          type: 'flight',
          from: { name: 'Innsbruck Airport', code: 'INN' },
          to: { name: 'Venice Airport', code: 'VCE' },
          flightNumber: 'AA904',
          gate: '10',
          seat: '18B',
          baggage: 'self-check-in',
        },
      ],
      stepsHuman: [
        '0. Start.',
        '1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.',
        '2. Board the Tram S5 from Innsbruck Hbf to Innsbruck Airport.',
        '3. From Innsbruck Airport, board the flight AA904 to Venice Airport from gate 10, seat 18B. Self-check-in luggage at counter.',
        '4. Last destination reached.',
      ],
      createdAt: new Date().toISOString(),
    };

    const acceptHeader = res.req.headers.accept;
    if (acceptHeader === 'text/plain') {
      res.header('Content-Type', 'text/plain');
      return mockResponse.stepsHuman?.join('\n') || '';
    }

    return mockResponse;
  }

  @Get(':id/human')
  @ApiOperation({
    summary: 'Retrieve an itinerary in human-readable form',
    description:
      'Convenience endpoint for plain text rendering of an itinerary',
  })
  @ApiParam({
    name: 'id',
    description: 'Itinerary ID',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Human-readable itinerary',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  @Header('Content-Type', 'text/plain')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getItineraryHuman(@Param('id') id: string): Promise<string> {
    // TODO: Implement retrieval logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `0. Start.
1. Board train RJX 765, Platform 3 from St. Anton am Arlberg Bahnhof to Innsbruck Hbf. Seat number 17C.
2. Board the Tram S5 from Innsbruck Hbf to Innsbruck Airport.
3. From Innsbruck Airport, board the flight AA904 to Venice Airport from gate 10, seat 18B. Self-check-in luggage at counter.
4. Last destination reached.`;
  }
}
