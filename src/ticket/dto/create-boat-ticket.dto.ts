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

export class CreateBoatTicketDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.BOAT],
    example: TicketType.BOAT,
  })
  @IsEnum(TicketType)
  type: TicketType.BOAT;

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
    example: 'A12',
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
    description: 'Vessel name or number',
    example: 'Ferry Neptune',
    required: false,
  })
  @IsOptional()
  @IsString()
  vessel?: string;

  @ApiProperty({
    description: 'Dock or pier information',
    example: 'Pier 15',
    required: false,
  })
  @IsOptional()
  @IsString()
  dock?: string;
}
