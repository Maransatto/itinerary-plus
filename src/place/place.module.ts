import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { PlaceRepository } from './place.repository';
import { PlaceService } from './place.service';

@Module({
  imports: [TypeOrmModule.forFeature([Place])],
  controllers: [],
  providers: [PlaceRepository, PlaceService],
  exports: [PlaceRepository, PlaceService],
})
export class PlaceModule {}
