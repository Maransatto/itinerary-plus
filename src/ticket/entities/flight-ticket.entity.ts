import { ChildEntity, Column } from 'typeorm';
import { Ticket, TicketType } from './ticket.entity';

export enum BaggageType {
  AUTO_TRANSFER = 'auto-transfer',
  SELF_CHECK_IN = 'self-check-in',
  COUNTER = 'counter',
}

@ChildEntity(TicketType.FLIGHT)
export class FlightTicket extends Ticket {
  declare type: TicketType.FLIGHT;

  @Column({ type: 'varchar', length: 100, nullable: true })
  airline?: string;

  @Column({ type: 'varchar', length: 20 })
  flightNumber: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gate?: string;

  @Column({ 
    type: 'enum', 
    enum: BaggageType, 
    nullable: true 
  })
  baggage?: BaggageType;

  constructor(data: Partial<FlightTicket>) {
    super(data);
    this.type = TicketType.FLIGHT;
  }
}
