import { Ticket, TicketType } from './ticket.entity';

export class TramTicket extends Ticket {
  type: TicketType.TRAM = TicketType.TRAM;
  line: string;

  constructor(data: Partial<TramTicket>) {
    super(data);
    Object.assign(this, data);
  }
}
