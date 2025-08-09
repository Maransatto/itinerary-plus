import { Ticket, TicketType } from './ticket.entity';

export class BoatTicket extends Ticket {
  type: TicketType.BOAT = TicketType.BOAT;
  vessel?: string;
  dock?: string;

  constructor(data: Partial<BoatTicket>) {
    super(data);
    Object.assign(this, data);
  }
}
