import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceModule } from '../place/place.module';
import { BoatTicket } from './entities/boat-ticket.entity';
import { BusTicket } from './entities/bus-ticket.entity';
import { FlightTicket } from './entities/flight-ticket.entity';
import { TaxiTicket } from './entities/taxi-ticket.entity';
import { Ticket } from './entities/ticket.entity';
import { TrainTicket } from './entities/train-ticket.entity';
import { TramTicket } from './entities/tram-ticket.entity';
import { TicketRepository } from './ticket.repository';
import { TicketService } from './ticket.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      FlightTicket,
      TrainTicket,
      BusTicket,
      TramTicket,
      BoatTicket,
      TaxiTicket,
    ]),
    PlaceModule,
  ],
  controllers: [],
  providers: [TicketRepository, TicketService],
  exports: [TicketRepository, TicketService],
})
export class TicketModule {}
