import { ChildEntity, Column } from 'typeorm';
import { Ticket, TicketType } from './ticket.entity';

@ChildEntity(TicketType.TRAM)
export class TramTicket extends Ticket {
  declare type: TicketType.TRAM;

  @Column({ type: 'varchar', length: 20 })
  line: string;

  constructor(data?: Partial<TramTicket>) {
    super(data || {});
    this.type = TicketType.TRAM;

    if (data?.line !== undefined) {
      this.line = data.line;
    }
  }
}
