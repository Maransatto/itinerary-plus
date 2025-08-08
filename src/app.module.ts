import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ItineraryController } from './itinerary.controller';

@Module({
  imports: [],
  controllers: [AppController, ItineraryController],
  providers: [],
})
export class AppModule {}
