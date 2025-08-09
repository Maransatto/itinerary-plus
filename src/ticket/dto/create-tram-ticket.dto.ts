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

export class CreateTramTicketDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.TRAM],
    example: TicketType.TRAM,
  })
  @IsEnum(TicketType)
  type: TicketType.TRAM;

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
    example: '12A',
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
    description: 'Tram line designation',
    example: 'S5',
  })
  @IsString()
  line: string;
}
