import { Module } from '@nestjs/common';
import { ItineraryController } from './itinerary.controller';

@Module({
  imports: [],
  controllers: [ItineraryController],
  providers: [],
  exports: [],
})
export class ItineraryModule {}
