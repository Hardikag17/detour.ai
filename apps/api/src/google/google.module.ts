import { Module } from '@nestjs/common';
import { DirectionsService } from './directions.service';
import { GeocodingService } from './geocoding.service';
import { PlacesService } from './places.service';

@Module({
  providers: [DirectionsService, GeocodingService, PlacesService],
  exports: [DirectionsService, GeocodingService, PlacesService],
})
export class GoogleModule {}
