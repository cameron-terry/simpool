import React from 'react';
import type { PoolBall, PhysicsState, ShotState } from '../types/pool';
import type { PredictedCollision } from '../types/physics';
import { calculateTrajectoryLine, predictCollisions } from '../utils/physics';

interface TrajectoryVisualizationProps {
  selectedBall: PoolBall | null;
  balls: PoolBall[];
  shot: ShotState;
  physics: PhysicsState;
}

export function TrajectoryVisualization({
  selectedBall,
  balls,
  shot,
  physics,
}: TrajectoryVisualizationProps) {
  if (!selectedBall) return null;

  const trajectoryLine = calculateTrajectoryLine(selectedBall, shot.shotAngle, 20);
  const predictedCollisions = predictCollisions(
    selectedBall,
    balls,
    shot.shotAngle,
    shot.shotVelocity,
    physics.ballRadius
  );

  return (
    <svg
      className="trajectory-line"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* Original trajectory line */}
      <line
        x1={`${trajectoryLine.x1}%`}
        y1={`${trajectoryLine.y1}%`}
        x2={`${trajectoryLine.x2}%`}
        y2={`${trajectoryLine.y2}%`}
        stroke="black"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
      {/* Predicted collision points and their trajectories */}
      {predictedCollisions.map((collision: PredictedCollision, index: number) => (
        <g key={index}>
          {/* Collision point circle */}
          <circle
            cx={`${collision.x}%`}
            cy={`${collision.y}%`}
            r={`${physics.ballRadius}%`}
            fill="none"
            stroke="rgba(255, 0, 0, 0.5)"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          {/* Collided ball's trajectory */}
          <line
            x1={`${collision.collidedBallTrajectory.x1}%`}
            y1={`${collision.collidedBallTrajectory.y1}%`}
            x2={`${collision.collidedBallTrajectory.x2}%`}
            y2={`${collision.collidedBallTrajectory.y2}%`}
            stroke="rgba(0, 0, 255, 0.5)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </g>
      ))}
    </svg>
  );
}
