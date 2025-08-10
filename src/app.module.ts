import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { ItineraryModule } from './itinerary/itinerary.module';
import { PlaceModule } from './place/place.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    ItineraryModule,
    PlaceModule,
    TicketModule,
  ],
  providers: [],
})
export class AppModule {}
