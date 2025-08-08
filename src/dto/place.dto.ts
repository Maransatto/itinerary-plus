import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class PlaceDto {
  @ApiProperty({
    description: 'Display name of the place (station, airport, etc.)',
    example: 'St. Anton am Arlberg Bahnhof',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Optional code (e.g., IATA, station code)',
    example: 'INN',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;
}
