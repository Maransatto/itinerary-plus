import { Place } from '../../place/entities/place.entity';

export enum TicketType {
  TRAIN = 'train',
  TRAM = 'tram',
  BUS = 'bus',
  BOAT = 'boat',
  FLIGHT = 'flight',
  TAXI = 'taxi',
}

export abstract class Ticket {
  id?: string;
  type: TicketType;
  from: Place;
  to: Place;
  seat?: string;
  notes?: string;
  meta?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Ticket>) {
    Object.assign(this, data);
  }
}
