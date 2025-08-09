import { ChildEntity, Column } from 'typeorm';
import { Ticket, TicketType } from './ticket.entity';

@ChildEntity(TicketType.TRAIN)
export class TrainTicket extends Ticket {
  declare type: TicketType.TRAIN;

  @Column({ type: 'varchar', length: 50, nullable: true })
  line?: string;

  @Column({ type: 'varchar', length: 20 })
  number: string;

  @Column({ type: 'varchar', length: 10 })
  platform: string;

  constructor(data: Partial<TrainTicket>) {
    super(data);
    this.type = TicketType.TRAIN;
  }
}
