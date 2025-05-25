import type { PoolBall, PhysicsState, ShotState } from '../types/pool';
import type { PredictedCollision } from '../utils/physics';
import { calculateTrajectoryLine, predictCollisions } from '../utils/physics';

interface TrajectoryVisualizationProps {
  selectedBall: PoolBall | null;
  balls: PoolBall[];
  shot: ShotState;
  physics: PhysicsState;
}

// Helper function to generate a color based on collision index
const getCollisionColor = (index: number, isWallCollision: boolean = false) => {
  if (isWallCollision) {
    return 'rgba(255, 165, 0, 0.7)'; // Orange for wall collisions
  }
  // Main ball path is red, deflected paths are different colors
  const colors = [
    'rgba(0, 128, 0, 0.7)', // Green for first deflection
    'rgba(0, 0, 255, 0.7)', // Blue for second deflection
    'rgba(128, 0, 128, 0.7)', // Purple for third deflection
    'rgba(255, 165, 0, 0.7)', // Orange for fourth deflection
  ];
  return colors[index % colors.length];
};

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
    physics.ballRadius,
    physics.tableMargin
  );

  // Get the final positions of all balls involved in collisions
  const getFinalPosition = (collision: PredictedCollision) => {
    if (collision.isWallCollision) return null;
    const ball = balls.find((b) => b.id === collision.collidedBallId);
    if (!ball) return null;
    return {
      x: collision.collidedBallTrajectory.x2,
      y: collision.collidedBallTrajectory.y2,
      color: ball.color,
      number: ball.number,
    };
  };

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
      {/* Original trajectory line - using a distinct red color */}
      <line
        x1={`${trajectoryLine.x1}%`}
        y1={`${trajectoryLine.y1}%`}
        x2={`${trajectoryLine.x2}%`}
        y2={`${trajectoryLine.y2}%`}
        stroke="rgba(255, 0, 0, 0.7)"
        strokeWidth="3"
        strokeDasharray="5,5"
      />
      {/* Final position marker for cue ball */}
      <circle
        cx={`${trajectoryLine.x2}%`}
        cy={`${trajectoryLine.y2}%`}
        r="4"
        fill={selectedBall.color}
        stroke="white"
        strokeWidth="1"
      />
      {/* Predicted collision points and their trajectories */}
      {predictedCollisions.map((collision: PredictedCollision, index: number) => {
        const collisionColor = getCollisionColor(index, collision.isWallCollision);
        const finalPosition = getFinalPosition(collision);

        return (
          <g key={index}>
            {/* Collision point circle */}
            <circle
              cx={`${collision.x}%`}
              cy={`${collision.y}%`}
              r={`${physics.ballRadius}%`}
              fill="none"
              stroke={collisionColor}
              strokeWidth="2"
              strokeDasharray={collision.isWallCollision ? '1,1' : '3,3'}
            />
            {/* Collision number label */}
            <text
              x={`${collision.x}%`}
              y={`${collision.y - physics.ballRadius - 1}%`}
              textAnchor="middle"
              fill={collisionColor}
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textShadow: '0 0 2px rgba(255, 255, 255, 0.8)',
              }}
            >
              {collision.isWallCollision ? 'W' : index + 1}
            </text>
            {/* Collided ball's trajectory */}
            <line
              x1={`${collision.collidedBallTrajectory.x1}%`}
              y1={`${collision.collidedBallTrajectory.y1}%`}
              x2={`${collision.collidedBallTrajectory.x2}%`}
              y2={`${collision.collidedBallTrajectory.y2}%`}
              stroke={collisionColor}
              strokeWidth="2"
              strokeDasharray={collision.isWallCollision ? '2,2' : '5,5'}
            />
            {/* Final position marker for collided ball */}
            {finalPosition && (
              <>
                <circle
                  cx={`${finalPosition.x}%`}
                  cy={`${finalPosition.y}%`}
                  r="4"
                  fill={finalPosition.color}
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={`${finalPosition.x}%`}
                  y={`${finalPosition.y - 6}%`}
                  textAnchor="middle"
                  fill="white"
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textShadow: '0 0 2px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {finalPosition.number}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
