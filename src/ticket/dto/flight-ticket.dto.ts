import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketBaseDto, TicketType } from './ticket-base.dto';

export enum BaggageType {
  AUTO_TRANSFER = 'auto-transfer',
  SELF_CHECK_IN = 'self-check-in',
  COUNTER = 'counter',
}

export class FlightTicketDto extends TicketBaseDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.FLIGHT],
    example: TicketType.FLIGHT,
  })
  declare type: TicketType.FLIGHT;

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
