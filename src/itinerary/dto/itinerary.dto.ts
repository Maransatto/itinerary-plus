import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { PlaceDto } from '../../place/dto/place.dto';
import { TicketType } from '../../ticket/dto/ticket-base.dto';

export class ItineraryItemDto {
  @ApiProperty({
    description: 'Zero-based order of the ticket in the itinerary',
    minimum: 0,
    example: 0,
  })
  @IsNumber()
  @Min(0)
  index: number;

  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: TicketType,
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Departure place',
    type: () => PlaceDto,
  })
  from: PlaceDto;

  @ApiProperty({
    description: 'Destination place',
    type: () => PlaceDto,
  })
  to: PlaceDto;

  @ApiProperty({
    description: 'Seat number, if assigned',
    required: false,
    example: '17C',
  })
  @IsOptional()
  @IsString()
  seat?: string;

  // Train-specific fields
  @ApiProperty({
    description: 'Train number (e.g., RJX 765)',
    required: false,
  })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({
    description: 'Platform number or name',
    required: false,
  })
  @IsOptional()
  @IsString()
  platform?: string;

  // Tram-specific fields
  @ApiProperty({
    description: 'Tram line identifier',
    required: false,
  })
  @IsOptional()
  @IsString()
  line?: string;

  // Flight-specific fields
  @ApiProperty({
    description: 'Flight number',
    required: false,
  })
  @IsOptional()
  @IsString()
  flightNumber?: string;

  @ApiProperty({
    description: 'Gate number',
    required: false,
  })
  @IsOptional()
  @IsString()
  gate?: string;

  @ApiProperty({
    description: 'Baggage handling information',
    required: false,
  })
  @IsOptional()
  @IsString()
  baggage?: string;
}

export class ItineraryDto {
  @ApiProperty({
    description: 'Unique identifier for the itinerary',
    format: 'uuid',
    example: '5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Sorted tickets with their order',
    type: [ItineraryItemDto],
  })
  @IsArray()
  items: ItineraryItemDto[];

  @ApiProperty({
    description: 'Starting place of the itinerary',
    type: () => PlaceDto,
  })
  start: PlaceDto;

  @ApiProperty({
    description: 'Final destination of the itinerary',
    type: () => PlaceDto,
  })
  end: PlaceDto;

  @ApiProperty({
    description:
      'Optional human-readable steps; included when render is human or both',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  stepsHuman?: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    format: 'date-time',
    example: '2025-08-08T10:00:00Z',
  })
  @IsDateString()
  createdAt: string;
}
