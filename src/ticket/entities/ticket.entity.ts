import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn
} from 'typeorm';
import { Place } from '../../place/entities/place.entity';

export enum TicketType {
  TRAIN = 'train',
  TRAM = 'tram',
  BUS = 'bus',
  BOAT = 'boat',
  FLIGHT = 'flight',
  TAXI = 'taxi',
}

@Entity('tickets')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'varchar', length: 20 })
  type: TicketType;

  @ManyToOne(() => Place, { eager: true, cascade: true })
  @JoinColumn({ name: 'from_place_id' })
  from: Place;

  @ManyToOne(() => Place, { eager: true, cascade: true })
  @JoinColumn({ name: 'to_place_id' })
  to: Place;

  @Column({ type: 'varchar', length: 50, nullable: true })
  seat?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any>;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  constructor(data: Partial<Ticket>) {
    Object.assign(this, data);
  }
}
