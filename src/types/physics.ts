export type PredictedCollision = {
  x: number;
  y: number;
  distance: number;
  collidedBallId: number;
  collidedBallTrajectory: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};

export type TrajectoryLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
