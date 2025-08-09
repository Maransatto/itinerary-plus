import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketModule } from '../ticket/ticket.module';
import { IdempotencyKey } from './entities/idempotency.entity';
import { Itinerary, ItineraryItem } from './entities/itinerary.entity';
import { ItineraryItemRepository } from './itinerary-item.repository';
import { ItinerarySortingService } from './itinerary-sorting.service';
import { ItineraryController } from './itinerary.controller';
import { ItineraryRepository } from './itinerary.repository';
import { ItineraryService } from './itinerary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Itinerary, ItineraryItem, IdempotencyKey]),
    TicketModule,
  ],
  controllers: [ItineraryController],
  providers: [
    ItineraryRepository,
    ItineraryItemRepository,
    ItineraryService,
    ItinerarySortingService,
  ],
  exports: [
    ItineraryRepository,
    ItineraryItemRepository,
    ItineraryService,
    ItinerarySortingService,
  ],
})
export class ItineraryModule {}
