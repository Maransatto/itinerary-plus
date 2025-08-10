import { ChildEntity, Column } from 'typeorm';
import { Ticket, TicketType } from './ticket.entity';

@ChildEntity(TicketType.BUS)
export class BusTicket extends Ticket {
  declare type: TicketType.BUS;

  @Column({ type: 'varchar', length: 100, nullable: true })
  route?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator?: string;

  constructor(data?: Partial<BusTicket>) {
    super(data || {});
    this.type = TicketType.BUS;

    // Only assign if data is provided
    if (data?.route !== undefined) this.route = data.route;
    if (data?.operator !== undefined) this.operator = data.operator;
  }
}
