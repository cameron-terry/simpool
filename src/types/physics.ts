export type TrajectoryLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type PredictedCollision = {
  x: number;
  y: number;
  distance: number;
  collidedBallId: number | null; // null for wall collisions
  collidedBallTrajectory: TrajectoryLine;
  isWallCollision?: boolean;
};
