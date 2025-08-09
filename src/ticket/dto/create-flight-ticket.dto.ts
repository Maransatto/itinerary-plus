import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePlaceDto } from '../../place/dto/create-place.dto';
import { BaggageType } from '../entities/flight-ticket.entity';
import { TicketType } from '../entities/ticket.entity';

export class CreateFlightTicketDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.FLIGHT],
    example: TicketType.FLIGHT,
  })
  @IsEnum(TicketType)
  type: TicketType.FLIGHT;

  @ApiProperty({
    description: 'Departure place',
    type: () => CreatePlaceDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePlaceDto)
  from: CreatePlaceDto;

  @ApiProperty({
    description: 'Destination place',
    type: () => CreatePlaceDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePlaceDto)
  to: CreatePlaceDto;

  @ApiProperty({
    description: 'Seat number, if assigned',
    required: false,
    example: '18B',
  })
  @IsOptional()
  @IsString()
  seat?: string;

  @ApiProperty({
    description: 'Free-form notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Airline name',
    example: 'American Airlines',
    required: false,
  })
  @IsOptional()
  @IsString()
  airline?: string;

  @ApiProperty({
    description: 'Flight number',
    example: 'AA904',
  })
  @IsString()
  flightNumber: string;

  @ApiProperty({
    description: 'Gate number',
    example: '10',
    required: false,
  })
  @IsOptional()
  @IsString()
  gate?: string;

  @ApiProperty({
    description: 'Baggage handling information',
    enum: BaggageType,
    example: BaggageType.SELF_CHECK_IN,
    required: false,
  })
  @IsOptional()
  @IsEnum(BaggageType)
  baggage?: BaggageType;
}
