import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { PlaceDto } from '../../place/dto/place.dto';

export enum TicketType {
  TRAIN = 'train',
  TRAM = 'tram',
  BUS = 'bus',
  BOAT = 'boat',
  FLIGHT = 'flight',
  TAXI = 'taxi',
}

export class TicketBaseDto {
  @ApiProperty({
    description: 'Optional client-side identifier for correlation',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: TicketType,
    example: TicketType.TRAIN,
  })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiProperty({
    description: 'Departure place',
    type: () => PlaceDto,
  })
  @IsObject()
  from: PlaceDto;

  @ApiProperty({
    description: 'Destination place',
    type: () => PlaceDto,
  })
  @IsObject()
  to: PlaceDto;

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
    description: 'Extensible metadata container',
    required: false,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
