import { ChildEntity, Column } from 'typeorm';
import { Ticket, TicketType } from './ticket.entity';

@ChildEntity(TicketType.TAXI)
export class TaxiTicket extends Ticket {
  declare type: TicketType.TAXI;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  driver?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleId?: string;

  constructor(data?: Partial<TaxiTicket>) {
    super(data || {});
    this.type = TicketType.TAXI;

    // Only assign if data is provided
    if (data?.company !== undefined) this.company = data.company;
    if (data?.driver !== undefined) this.driver = data.driver;
    if (data?.vehicleId !== undefined) this.vehicleId = data.vehicleId;
  }
}
