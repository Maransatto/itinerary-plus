import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryColumn,
} from 'typeorm';

@Entity('idempotency_keys')
@Index(['key'])
export class IdempotencyKey {
  @ApiProperty({
    description: 'The idempotency key provided by the client',
    example: 'user-123-request-456',
  })
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key: string;

  @ApiProperty({
    description: 'ID of the itinerary created for this key',
    example: '5b4cc1f8-6e2b-43a2-9c19-2d83f7b16f5b',
  })
  @Column({ type: 'uuid' })
  itineraryId: string;

  @ApiProperty({
    description: 'Hash of the request content for additional validation',
    required: false,
  })
  @Column({ type: 'varchar', length: 64, nullable: true })
  contentHash?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    required: false,
  })
  @CreateDateColumn()
  createdAt?: Date;

  constructor(data: Partial<IdempotencyKey>) {
    Object.assign(this, data);
  }
} 