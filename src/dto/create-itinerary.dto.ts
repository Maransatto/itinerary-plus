import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { FlightTicketDto } from './flight-ticket.dto';
import { TrainTicketDto } from './train-ticket.dto';

export enum RenderType {
  JSON = 'json',
  HUMAN = 'human',
  BOTH = 'both',
}

export class CreateItineraryDto {
  @ApiProperty({
    description: 'Array of tickets to sort into an itinerary',
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: TrainTicketDto, name: 'train' },
        { value: FlightTicketDto, name: 'flight' },
        // We'll add more subTypes as we create more DTOs
      ],
    },
  })
  tickets: (TrainTicketDto | FlightTicketDto)[];

  @ApiProperty({
    description: 'Controls whether a human-readable output is included',
    enum: RenderType,
    default: RenderType.JSON,
    required: false,
  })
  @IsOptional()
  @IsEnum(RenderType)
  render?: RenderType = RenderType.JSON;
}
