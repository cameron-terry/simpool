export interface Pocket {
  id: number;
  x: number;
  y: number;
}

export interface PoolBall {
  id: number;
  number: number;
  color: string;
  type: 'solid' | 'stripe';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  racked?: boolean;
}

export interface TrajectoryLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BallColor {
  type: 'solid' | 'stripe';
  color: string;
  label: string;
}

export interface PhysicsState {
  ballRadius: number;
  friction: number;
  tableMargin: number;
  ballSpeed: number;
}

export type ShotState = {
  selectedBall: number | null;
  shotAngle: number;
  shotVelocity: number;
};

export interface BallCreationState {
  newBallNumber: number;
  newBallColor: string;
  nextBallId: number;
}

export type GameMode = 'normal' | 'golf';

export interface GolfGameState {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  shots: number;
  isComplete: boolean;
}
