import { Ticket, TicketType } from './ticket.entity';

export class TrainTicket extends Ticket {
  declare type: TicketType.TRAIN;
  line?: string;
  number: string;
  platform: string;

  constructor(data: Partial<TrainTicket>) {
    super(data);
    this.type = TicketType.TRAIN;
  }
}
