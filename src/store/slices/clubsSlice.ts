import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Club, ShortGameShot } from '../../types';

interface ClubsState {
  clubs: Club[];
  shortGameShots: ShortGameShot[];
  isConfigured: boolean;
}

const defaultClubs: Club[] = [
  {
    id: 'driver',
    name: 'Driver',
    type: 'driver',
    loft: 10.5,
    carryDistance: 250,
    totalDistance: 275,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 5 },
      { type: 'closed', directionModifier: -5 },
    ],
  },
  {
    id: '3wood',
    name: '3 Wood',
    type: 'fairway',
    loft: 15,
    carryDistance: 220,
    totalDistance: 240,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 3 },
      { type: 'closed', directionModifier: -3 },
    ],
  },
  {
    id: '5wood',
    name: '5 Wood',
    type: 'fairway',
    loft: 18,
    carryDistance: 200,
    totalDistance: 215,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 3 },
      { type: 'closed', directionModifier: -3 },
    ],
  },
  {
    id: '4hybrid',
    name: '4 Hybrid',
    type: 'hybrid',
    loft: 22,
    carryDistance: 180,
    totalDistance: 190,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 2 },
      { type: 'closed', directionModifier: -2 },
    ],
  },
  {
    id: '5iron',
    name: '5 Iron',
    type: 'iron',
    loft: 27,
    carryDistance: 170,
    totalDistance: 175,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 2 },
      { type: 'closed', directionModifier: -2 },
    ],
  },
  {
    id: '6iron',
    name: '6 Iron',
    type: 'iron',
    loft: 31,
    carryDistance: 160,
    totalDistance: 165,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 2 },
      { type: 'closed', directionModifier: -2 },
    ],
  },
  {
    id: '7iron',
    name: '7 Iron',
    type: 'iron',
    loft: 35,
    carryDistance: 150,
    totalDistance: 155,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 2 },
      { type: 'closed', directionModifier: -2 },
    ],
  },
  {
    id: '8iron',
    name: '8 Iron',
    type: 'iron',
    loft: 39,
    carryDistance: 140,
    totalDistance: 145,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 2 },
      { type: 'closed', directionModifier: -2 },
    ],
  },
  {
    id: '9iron',
    name: '9 Iron',
    type: 'iron',
    loft: 43,
    carryDistance: 130,
    totalDistance: 135,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 2 },
      { type: 'closed', directionModifier: -2 },
    ],
  },
  {
    id: 'pw',
    name: 'Pitching Wedge',
    type: 'wedge',
    loft: 47,
    carryDistance: 120,
    totalDistance: 125,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 3 },
      { type: 'closed', directionModifier: -3 },
    ],
  },
  {
    id: 'sw',
    name: 'Sand Wedge',
    type: 'wedge',
    loft: 56,
    carryDistance: 100,
    totalDistance: 105,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 5 },
      { type: 'closed', directionModifier: -5 },
    ],
  },
  {
    id: 'lw',
    name: 'Lob Wedge',
    type: 'wedge',
    loft: 60,
    carryDistance: 80,
    totalDistance: 85,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
      { type: 'three_quarter', distanceModifier: 0.85 },
      { type: 'half', distanceModifier: 0.7 },
      { type: 'choke', distanceModifier: 0.9 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
      { type: 'open', directionModifier: 5 },
      { type: 'closed', directionModifier: -5 },
    ],
  },
  {
    id: 'putter',
    name: 'Putter',
    type: 'putter',
    loft: 3,
    carryDistance: 0,
    totalDistance: 0,
    takebackOptions: [
      { type: 'full', distanceModifier: 1.0 },
    ],
    faceOptions: [
      { type: 'square', directionModifier: 0 },
    ],
  },
];

const initialState: ClubsState = {
  clubs: defaultClubs,
  shortGameShots: [],
  isConfigured: false,
};

const clubsSlice = createSlice({
  name: 'clubs',
  initialState,
  reducers: {
    updateClub: (state, action: PayloadAction<{ id: string; updates: Partial<Club> }>) => {
      const { id, updates } = action.payload;
      const clubIndex = state.clubs.findIndex(club => club.id === id);
      if (clubIndex !== -1) {
        state.clubs[clubIndex] = { ...state.clubs[clubIndex], ...updates };
      }
    },
    addClub: (state, action: PayloadAction<Club>) => {
      state.clubs.push(action.payload);
    },
    removeClub: (state, action: PayloadAction<string>) => {
      state.clubs = state.clubs.filter(club => club.id !== action.payload);
    },
    updateShortGameShot: (state, action: PayloadAction<ShortGameShot>) => {
      const shotIndex = state.shortGameShots.findIndex(shot => shot.distance === action.payload.distance);
      if (shotIndex !== -1) {
        state.shortGameShots[shotIndex] = action.payload;
      } else {
        state.shortGameShots.push(action.payload);
      }
    },
    removeShortGameShot: (state, action: PayloadAction<number>) => {
      state.shortGameShots = state.shortGameShots.filter(shot => shot.distance !== action.payload);
    },
    setClubsConfigured: (state, action: PayloadAction<boolean>) => {
      state.isConfigured = action.payload;
    },
    resetClubs: (state) => {
      state.clubs = defaultClubs;
      state.shortGameShots = [];
      state.isConfigured = false;
    },
  },
});

export const {
  updateClub,
  addClub,
  removeClub,
  updateShortGameShot,
  removeShortGameShot,
  setClubsConfigured,
  resetClubs,
} = clubsSlice.actions;

export default clubsSlice.reducer;