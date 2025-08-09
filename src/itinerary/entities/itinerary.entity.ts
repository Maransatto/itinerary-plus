import { ApiProperty } from '@nestjs/swagger';
import { Place } from '../../place/entities/place.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';

export class ItineraryItem {
  @ApiProperty({
    description: 'Zero-based order of the ticket in the itinerary',
    example: 0,
  })
  index: number;

  @ApiProperty({
    description: 'The ticket information',
    type: () => Object,
  })
  ticket: Ticket;

  constructor(data: Partial<ItineraryItem>) {
    Object.assign(this, data);
  }
}

export class Itinerary {
  @ApiProperty({
    description: 'Unique identifier for the itinerary',
    format: 'uuid',
    example: '5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b',
    required: false,
  })
  id?: string;

  @ApiProperty({
    description: 'Sorted tickets with their order',
    type: [ItineraryItem],
  })
  items: ItineraryItem[];

  @ApiProperty({
    description: 'Starting place of the itinerary',
    type: () => Place,
  })
  start: Place;

  @ApiProperty({
    description: 'Final destination of the itinerary',
    type: () => Place,
  })
  end: Place;

  @ApiProperty({
    description:
      'Optional human-readable steps; included when render is human or both',
    type: [String],
    required: false,
  })
  stepsHuman?: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    required: false,
  })
  updatedAt?: Date;

  constructor(data: Partial<Itinerary>) {
    Object.assign(this, data);
  }
}
