export interface DirtySpot {
  id: string;
  x: number;
  y: number;
}

export interface TankState {
  cleanliness: number;
  dirtySpots: DirtySpot[];
  isNight: boolean;
  currentHour: number;
}
