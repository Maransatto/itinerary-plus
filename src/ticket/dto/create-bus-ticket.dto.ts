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

export class CreateBusTicketDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.BUS],
    example: TicketType.BUS,
  })
  @IsEnum(TicketType)
  type: TicketType.BUS;

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
    example: '15B',
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
    description: 'Bus route number',
    example: '42',
    required: false,
  })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiProperty({
    description: 'Bus operator/company name',
    example: 'FlixBus',
    required: false,
  })
  @IsOptional()
  @IsString()
  operator?: string;
}
