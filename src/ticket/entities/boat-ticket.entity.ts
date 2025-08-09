import { ChildEntity, Column } from 'typeorm';
import { Ticket, TicketType } from './ticket.entity';

@ChildEntity(TicketType.BOAT)
export class BoatTicket extends Ticket {
  declare type: TicketType.BOAT;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vessel?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dock?: string;

  constructor(data: Partial<BoatTicket>) {
    super(data);
    Object.assign(this, data);
  }
}
