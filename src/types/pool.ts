export interface Pocket {
  id: number;
  x: number;
  y: number;
}

export interface PoolBall {
  id: number;
  number: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
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

export interface ShotState {
  selectedBall: number | null;
  shotAngle: number;
  shotVelocity: number;
  trajectoryLine: TrajectoryLine | null;
}

export interface BallCreationState {
  newBallNumber: number;
  newBallColor: string;
  nextBallId: number;
}
