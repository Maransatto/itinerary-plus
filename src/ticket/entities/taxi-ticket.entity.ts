import { Ticket, TicketType } from './ticket.entity';

export class TaxiTicket extends Ticket {
  type: TicketType.TAXI = TicketType.TAXI;
  company?: string;
  driver?: string;
  vehicleId?: string;

  constructor(data: Partial<TaxiTicket>) {
    super(data);
    Object.assign(this, data);
  }
}
