import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { PlaceRepository } from './place.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Place])],
  controllers: [],
  providers: [PlaceRepository],
  exports: [PlaceRepository],
})
export class PlaceModule {}
