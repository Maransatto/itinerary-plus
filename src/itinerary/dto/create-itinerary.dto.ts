import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTrainTicketDto } from '../../ticket/dto/create-train-ticket.dto';
import { CreateFlightTicketDto } from '../../ticket/dto/create-flight-ticket.dto';

export enum RenderType {
  JSON = 'json',
  HUMAN = 'human',
  BOTH = 'both',
}

export class CreateItineraryDto {
  @ApiProperty({
    description: 'Array of tickets to sort into an itinerary',
    isArray: true,
    oneOf: [
      { $ref: '#/components/schemas/CreateTrainTicketDto' },
      { $ref: '#/components/schemas/CreateFlightTicketDto' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Object, {
    // keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: CreateTrainTicketDto, name: 'train' },
        { value: CreateFlightTicketDto, name: 'flight' },
      ],
    },
  })
  tickets: (CreateTrainTicketDto | CreateFlightTicketDto)[];

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
