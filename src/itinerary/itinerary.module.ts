import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Itinerary, ItineraryItem } from './entities/itinerary.entity';
import { ItineraryItemRepository } from './itinerary-item.repository';
import { ItineraryController } from './itinerary.controller';
import { ItineraryRepository } from './itinerary.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Itinerary, ItineraryItem])],
  controllers: [ItineraryController],
  providers: [ItineraryRepository, ItineraryItemRepository],
  exports: [ItineraryRepository, ItineraryItemRepository],
})
export class ItineraryModule {}
