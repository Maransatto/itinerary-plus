import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('places')
@Index(['name', 'code'])
export class Place {
  @ApiProperty({
    description: 'Unique identifier for the place',
    required: false,
  })
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ApiProperty({
    description: 'Display name of the place (station, airport, etc.)',
    example: 'St. Anton am Arlberg Bahnhof',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Optional code (e.g., IATA, station code)',
    example: 'INN',
    required: false,
  })
  @Column({ type: 'varchar', length: 10, nullable: true })
  code?: string;

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

  constructor(data: Partial<Place>) {
    Object.assign(this, data);
  }
}
