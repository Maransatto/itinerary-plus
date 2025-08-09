import { Ticket, TicketType } from './ticket.entity';

export enum BaggageType {
  AUTO_TRANSFER = 'auto-transfer',
  SELF_CHECK_IN = 'self-check-in',
  COUNTER = 'counter',
}

export class FlightTicket extends Ticket {
  declare type: TicketType.FLIGHT;
  airline?: string;
  flightNumber: string;
  gate?: string;
  baggage?: BaggageType;

  constructor(data: Partial<FlightTicket>) {
    super(data);
    this.type = TicketType.FLIGHT;
  }
}
