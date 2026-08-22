import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StopEntity, TripEntity } from './trip.entity';
import { TripsResolver } from './trips.resolver';
import { TripsService } from './trips.service';

/** Registered by AppModule only when DATABASE_URL is set. */
@Module({
  imports: [TypeOrmModule.forFeature([TripEntity, StopEntity])],
  providers: [TripsService, TripsResolver],
  exports: [TripsService],
})
export class TripsModule {}
