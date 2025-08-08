import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { TicketBaseDto, TicketType } from './ticket-base.dto';

export class TrainTicketDto extends TicketBaseDto {
  @ApiProperty({
    description: 'Type discriminator for the ticket',
    enum: [TicketType.TRAIN],
    example: TicketType.TRAIN,
  })
  declare type: TicketType.TRAIN;

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
