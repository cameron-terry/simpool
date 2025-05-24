import type { BallColor, Pocket } from '../types/pool';

export const POCKETS: Pocket[] = [
  { id: 1, x: 0, y: 0 }, // Top left
  { id: 2, x: 50, y: 0 }, // Top middle
  { id: 3, x: 100, y: 0 }, // Top right
  { id: 4, x: 0, y: 100 }, // Bottom left
  { id: 5, x: 50, y: 100 }, // Bottom middle
  { id: 6, x: 100, y: 100 }, // Bottom right
];

export const POOL_BALL_COLORS: BallColor[] = [
  { type: 'solid', color: '#FFFFFF', label: 'White (Cue)' },
  { type: 'solid', color: '#FFFF00', label: 'Solid 1 (Yellow)' },
  { type: 'solid', color: '#0000FF', label: 'Solid 2 (Blue)' },
  { type: 'solid', color: '#FF0000', label: 'Solid 3 (Red)' },
  { type: 'solid', color: '#800080', label: 'Solid 4 (Purple)' },
  { type: 'solid', color: '#FFA500', label: 'Solid 5 (Orange)' },
  { type: 'solid', color: '#008000', label: 'Solid 6 (Green)' },
  { type: 'solid', color: '#8B4513', label: 'Solid 7 (Brown)' },
  { type: 'solid', color: '#000000', label: 'Solid 8 (Black)' },
  { type: 'stripe', color: '#FFFF80', label: 'Stripe 9 (Yellow)' },
  { type: 'stripe', color: '#4040FF', label: 'Stripe 10 (Blue)' },
  { type: 'stripe', color: '#FF4040', label: 'Stripe 11 (Red)' },
  { type: 'stripe', color: '#C080C0', label: 'Stripe 12 (Purple)' },
  { type: 'stripe', color: '#FFC040', label: 'Stripe 13 (Orange)' },
  { type: 'stripe', color: '#40C040', label: 'Stripe 14 (Green)' },
  { type: 'stripe', color: '#C08040', label: 'Stripe 15 (Brown)' },
];

export const DEFAULT_PHYSICS = {
  ballRadius: 3.2,
  friction: 0.991,
  tableMargin: 0,
  ballSpeed: 2.0,
};

export const DEFAULT_SHOT = {
  shotAngle: 0,
  shotVelocity: 2.0,
};

export const COLLISION_THRESHOLD = 0.99; // 99% of minDist for collision detection
