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

export class CreateTrainTicketDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.TRAIN],
    example: TicketType.TRAIN,
  })
  @IsEnum(TicketType)
  type: TicketType.TRAIN;

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
    example: '17C',
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
    description: 'Train line designation',
    example: 'RJX',
    required: false,
  })
  @IsOptional()
  @IsString()
  line?: string;

  @ApiProperty({
    description: 'Train number (e.g., RJX 765)',
    example: 'RJX 765',
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'Platform number or name',
    example: '3',
  })
  @IsString()
  platform: string;
}
