import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ItineraryModule } from './itinerary/itinerary.module';
import { PlaceModule } from './place/place.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [ItineraryModule, PlaceModule, TicketModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
