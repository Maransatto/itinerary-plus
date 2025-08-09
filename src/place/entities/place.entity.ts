import { ApiProperty } from '@nestjs/swagger';

export class Place {
  @ApiProperty({
    description: 'Unique identifier for the place',
    required: false,
  })
  id?: string;

  @ApiProperty({
    description: 'Display name of the place (station, airport, etc.)',
    example: 'St. Anton am Arlberg Bahnhof',
  })
  name: string;

  @ApiProperty({
    description: 'Optional code (e.g., IATA, station code)',
    example: 'INN',
    required: false,
  })
  code?: string;

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

  constructor(data: Partial<Place>) {
    Object.assign(this, data);
  }
}
