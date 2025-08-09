import { Ticket, TicketType } from './ticket.entity';

export class BusTicket extends Ticket {
  type: TicketType.BUS = TicketType.BUS;
  route?: string;
  operator?: string;

  constructor(data: Partial<BusTicket>) {
    super(data);
    Object.assign(this, data);
  }
}
