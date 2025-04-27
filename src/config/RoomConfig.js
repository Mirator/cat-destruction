// RoomConfig.js

export const ROOM_DIMENSIONS = {
    width: 6,   // meters
    length: 8,  // meters
    height: 3   // meters
};

export const WALL_PALETTES = [
    { base: '#b7c7b0', accent: '#8fa58c' }, // sage
    { base: '#f7e6c4', accent: '#e2c290' }, // cream
    { base: '#f7cac9', accent: '#e6a4b4' }, // blush
    { base: '#c9d6ea', accent: '#a3b8d8' }, // blue
    { base: '#f5e6e8', accent: '#e3b7a0' }, // pinkish
];

export const WALL_PATTERNS = ['stripes', 'polka', 'floral', 'plain'];

export const SHARED_WALL_THICKNESS = 0.2;

export const ROOM_CONFIGS = {
  mainRoom: {
    wallProps: [
      { type: 'telephone', unique: true },
      { type: 'door', unique: true },
      { type: 'shelf', unique: true },
      { type: 'pictureFrame' }
    ],
    furniture: [
      { type: 'table' },
      { type: 'chair' }
    ],
    flowers: { min: 2, max: 4 },
    decorative: [
      // no flower here
    ]
  },
  sleepingRoom: {
    wallProps: [
      { type: 'pictureFrame' }
    ],
    furniture: [
      { type: 'bed' }
    ],
    decorative: [
      { type: 'rug' }]
  }
}; 