import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('trips')
export class TripEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  prompt!: string;

  @Column('float')
  detourKm!: number;

  @Column('text')
  originName!: string;

  @Column('text')
  destinationName!: string;

  @Column('int')
  distanceKm!: number;

  @Column('int')
  durationMin!: number;

  @Column('text', { nullable: true })
  summary!: string | null;

  /** Encoded route polyline — lets saved trips redraw the map without re-planning. */
  @Column('text', { nullable: true })
  polyline!: string | null;

  @OneToMany(() => StopEntity, (stop) => stop.trip, { cascade: true, eager: true })
  stops!: StopEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('stops')
export class StopEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TripEntity, (trip) => trip.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip!: TripEntity;

  @Column('int')
  position!: number;

  @Column('text')
  placeId!: string;

  @Column('text')
  name!: string;

  @Column('text')
  category!: string;

  @Column('float', { nullable: true })
  rating!: number | null;

  @Column('int', { nullable: true })
  reviewCount!: number | null;

  @Column('float')
  detourKm!: number;

  @Column('text')
  tier!: string;

  @Column('text', { nullable: true })
  legLabel!: string | null;

  @Column('jsonb', { default: [] })
  reasons!: Array<{ icon: string; text: string }>;

  @Column('float')
  lat!: number;

  @Column('float')
  lng!: number;
}
