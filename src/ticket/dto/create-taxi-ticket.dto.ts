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
import { TicketType } from '../entities/ticket.entity';

export class CreateTaxiTicketDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.TAXI],
    example: TicketType.TAXI,
  })
  @IsEnum(TicketType)
  type: TicketType.TAXI;

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
    description: 'Taxi company name',
    example: 'Yellow Cab',
    required: false,
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    description: 'Driver name or ID',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  driver?: string;

  @ApiProperty({
    description: 'Vehicle license plate or ID',
    example: 'ABC-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;
}
