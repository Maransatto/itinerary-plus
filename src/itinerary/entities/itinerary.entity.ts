import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Place } from '../../place/entities/place.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';

@Entity('itinerary_items')
export class ItineraryItem {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ApiProperty({
    description: 'Zero-based order of the ticket in the itinerary',
    example: 0,
  })
  @Column({ type: 'int' })
  index: number;

  @ApiProperty({
    description: 'The ticket information',
    type: () => Object,
  })
  @ManyToOne(() => Ticket, { eager: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'uuid', nullable: true })
  itineraryId?: string;

  constructor(data: Partial<ItineraryItem>) {
    Object.assign(this, data);
  }
}

@Entity('itineraries')
export class Itinerary {
  @ApiProperty({
    description: 'Unique identifier for the itinerary',
    format: 'uuid',
    example: '5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b',
    required: false,
  })
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ApiProperty({
    description: 'Sorted tickets with their order',
    type: [ItineraryItem],
  })
  // Items will be managed separately via service layer
  // to avoid circular dependencies
  items: ItineraryItem[];

  @ApiProperty({
    description: 'Starting place of the itinerary',
    type: () => Place,
  })
  @ManyToOne(() => Place, { eager: true })
  @JoinColumn({ name: 'start_place_id' })
  start: Place;

  @ApiProperty({
    description: 'Final destination of the itinerary',
    type: () => Place,
  })
  @ManyToOne(() => Place, { eager: true })
  @JoinColumn({ name: 'end_place_id' })
  end: Place;

  @ApiProperty({
    description:
      'Optional human-readable steps; included when render is human or both',
    type: [String],
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  stepsHuman?: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    required: false,
  })
  @CreateDateColumn()
  createdAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    required: false,
  })
  @UpdateDateColumn()
  updatedAt?: Date;

  constructor(data: Partial<Itinerary>) {
    Object.assign(this, data);
  }
}
