import type { PoolBall } from '../types/pool';

// Add type definitions at the top of the file
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
  isWallCollision: boolean;
};

export function updateBallPositions(balls: PoolBall[], friction: number): PoolBall[] {
  return balls.map((ball) => ({
    ...ball,
    x: ball.x + ball.vx,
    y: ball.y + ball.vy,
    vx: ball.vx * friction,
    vy: ball.vy * friction,
  }));
}

export function handleWallCollisions(
  balls: PoolBall[],
  tableMargin: number,
  ballRadius: number
): PoolBall[] {
  return balls.map((ball) => {
    const newBall = { ...ball };

    // Bounce off walls
    if (ball.x - ballRadius < tableMargin || ball.x + ballRadius > 100 - tableMargin) {
      newBall.vx *= -1;
      newBall.x = Math.max(
        tableMargin + ballRadius,
        Math.min(100 - tableMargin - ballRadius, ball.x)
      );
    }
    if (ball.y - ballRadius < tableMargin || ball.y + ballRadius > 100 - tableMargin) {
      newBall.vy *= -1;
      newBall.y = Math.max(
        tableMargin + ballRadius,
        Math.min(100 - tableMargin - ballRadius, ball.y)
      );
    }

    return newBall;
  });
}

export function handleBallCollisions(balls: PoolBall[], ballRadius: number): PoolBall[] {
  const newBalls = [...balls];
  const minDist = ballRadius * 2;

  for (let i = 0; i < newBalls.length; i++) {
    for (let j = i + 1; j < newBalls.length; j++) {
      const b1 = newBalls[i];
      const b2 = newBalls[j];

      // Skip collision between two racked balls
      if (b1.racked && b2.racked) continue;

      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only handle collisions if balls are moving towards each other
      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        const dvx = b2.vx - b1.vx;
        const dvy = b2.vy - b1.vy;
        const relativeVelocity = dvx * nx + dvy * ny;

        // If balls are moving towards each other, handle collision
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity;

          // If a racked ball is hit, unrack it
          if (b1.racked) {
            newBalls[i] = {
              ...b1,
              racked: false,
              vx: b1.vx - impulse * nx,
              vy: b1.vy - impulse * ny,
            };
          } else {
            newBalls[i] = {
              ...b1,
              vx: b1.vx - impulse * nx,
              vy: b1.vy - impulse * ny,
            };
          }

          if (b2.racked) {
            newBalls[j] = {
              ...b2,
              racked: false,
              vx: b2.vx + impulse * nx,
              vy: b2.vy + impulse * ny,
            };
          } else {
            newBalls[j] = {
              ...b2,
              vx: b2.vx + impulse * nx,
              vy: b2.vy + impulse * ny,
            };
          }
        }

        // Only separate non-racked balls
        if (!b1.racked && !b2.racked && dist < minDist * 0.99) {
          const overlap = (minDist - dist) / 2;
          const separationX = nx * overlap;
          const separationY = ny * overlap;

          // Move balls apart
          newBalls[i].x -= separationX;
          newBalls[i].y -= separationY;
          newBalls[j].x += separationX;
          newBalls[j].y += separationY;
        }
      }
    }
  }

  return newBalls;
}

export function calculateTrajectoryLine(
  ball: PoolBall,
  angle: number,
  lineLength: number
): TrajectoryLine {
  const angleRad = (angle * Math.PI) / 180;
  return {
    x1: ball.x,
    y1: ball.y,
    x2: ball.x + Math.cos(angleRad) * lineLength,
    y2: ball.y + Math.sin(angleRad) * lineLength,
  };
}

export function getRandomPosition(tableMargin: number, ballRadius: number) {
  const margin = tableMargin + ballRadius;
  const x = margin + Math.random() * (100 - 2 * margin);
  const y = margin + Math.random() * (100 - 2 * margin);
  return { x, y };
}

export function getRandomVelocity(ballSpeed: number) {
  const angle = Math.random() * Math.PI * 2;
  return {
    vx: Math.cos(angle) * ballSpeed,
    vy: Math.sin(angle) * ballSpeed,
  };
}

// Add type for wall collision data
type WallCollision = {
  x: number;
  y: number;
  distance: number;
  normalX: number;
  normalY: number;
};

// Function to predict wall collisions
const predictWallCollision = (
  ball: PoolBall,
  vx: number,
  vy: number,
  tableMargin: number,
  ballRadius: number
): WallCollision | null => {
  let earliestCollision: WallCollision | null = null;

  // Check horizontal walls (top and bottom)
  if (vy !== 0) {
    const timeToTopWall = (tableMargin - ball.y + ballRadius) / vy;
    const timeToBottomWall = (100 - tableMargin - ball.y - ballRadius) / vy;

    if (timeToTopWall > 0) {
      const collisionX = ball.x + vx * timeToTopWall;
      if (collisionX >= tableMargin && collisionX <= 100 - tableMargin) {
        earliestCollision = {
          x: collisionX,
          y: tableMargin - ballRadius,
          distance: timeToTopWall * Math.sqrt(vx * vx + vy * vy),
          normalX: 0,
          normalY: 1, // Normal pointing down
        };
      }
    }

    if (
      timeToBottomWall > 0 &&
      (!earliestCollision ||
        timeToBottomWall * Math.sqrt(vx * vx + vy * vy) < earliestCollision.distance)
    ) {
      const collisionX = ball.x + vx * timeToBottomWall;
      if (collisionX >= tableMargin && collisionX <= 100 - tableMargin) {
        earliestCollision = {
          x: collisionX,
          y: 100 - tableMargin + ballRadius,
          distance: timeToBottomWall * Math.sqrt(vx * vx + vy * vy),
          normalX: 0,
          normalY: -1, // Normal pointing up
        };
      }
    }
  }

  // Check vertical walls (left and right)
  if (vx !== 0) {
    const timeToLeftWall = (tableMargin - ball.x + ballRadius) / vx;
    const timeToRightWall = (100 - tableMargin - ball.x - ballRadius) / vx;

    if (
      timeToLeftWall > 0 &&
      (!earliestCollision ||
        timeToLeftWall * Math.sqrt(vx * vx + vy * vy) < earliestCollision.distance)
    ) {
      const collisionY = ball.y + vy * timeToLeftWall;
      if (collisionY >= tableMargin && collisionY <= 100 - tableMargin) {
        earliestCollision = {
          x: tableMargin - ballRadius,
          y: collisionY,
          distance: timeToLeftWall * Math.sqrt(vx * vx + vy * vy),
          normalX: 1, // Normal pointing right
          normalY: 0,
        };
      }
    }

    if (
      timeToRightWall > 0 &&
      (!earliestCollision ||
        timeToRightWall * Math.sqrt(vx * vx + vy * vy) < earliestCollision.distance)
    ) {
      const collisionY = ball.y + vy * timeToRightWall;
      if (collisionY >= tableMargin && collisionY <= 100 - tableMargin) {
        earliestCollision = {
          x: 100 - tableMargin + ballRadius,
          y: collisionY,
          distance: timeToRightWall * Math.sqrt(vx * vx + vy * vy),
          normalX: -1, // Normal pointing left
          normalY: 0,
        };
      }
    }
  }

  return earliestCollision;
};

// Function to predict subsequent collisions after a wall bounce
const predictSubsequentCollisions = (
  ball: PoolBall,
  otherBalls: PoolBall[],
  vx: number,
  vy: number,
  ballRadius: number,
  tableMargin: number,
  maxDepth: number = 3,
  currentDepth: number = 0,
  predictedBalls: Set<number> = new Set() // Track which balls we've already predicted
): PredictedCollision[] => {
  if (currentDepth >= maxDepth) return [];

  // Add current ball to predicted set
  predictedBalls.add(ball.id);

  const collisions: PredictedCollision[] = [];
  const velocity = Math.sqrt(vx * vx + vy * vy);

  // First check for wall collision
  const wallCollision = predictWallCollision(ball, vx, vy, tableMargin, ballRadius);

  // Then check for ball collisions, excluding balls we've already predicted
  const ballCollisions = otherBalls
    .filter((other) => other.id !== ball.id && !predictedBalls.has(other.id))
    .map((other) => {
      // Calculate time until collision using quadratic formula
      const dx = other.x - ball.x;
      const dy = other.y - ball.y;
      const relativeX = dx;
      const relativeY = dy;
      const dotProduct = vx * relativeX + vy * relativeY;

      if (dotProduct <= 0) return null;

      const relativeSpeedSquared = vx * vx + vy * vy;
      const closestApproachDistance = Math.abs(
        (relativeX * vy - relativeY * vx) / Math.sqrt(relativeSpeedSquared)
      );

      if (closestApproachDistance > ballRadius * 2) return null;

      const distanceSquared = dx * dx + dy * dy;
      const collisionDistanceSquared = ballRadius * 2 * (ballRadius * 2);
      const a = relativeSpeedSquared;
      const b = -2 * dotProduct;
      const c = distanceSquared - collisionDistanceSquared;
      const discriminant = b * b - 4 * a * c;

      if (discriminant < 0) return null;

      const t = (-b - Math.sqrt(discriminant)) / (2 * a);
      if (t < 0) return null;

      // If there's a wall collision before this ball collision, ignore this collision
      if (wallCollision && t * velocity > wallCollision.distance) return null;

      const collisionX = ball.x + vx * t;
      const collisionY = ball.y + vy * t;

      // Calculate the collided ball's trajectory
      const normalX = (collisionX - other.x) / (ballRadius * 2);
      const normalY = (collisionY - other.y) / (ballRadius * 2);
      const relativeVelocityX = vx;
      const relativeVelocityY = vy;
      const normalVelocity = relativeVelocityX * normalX + relativeVelocityY * normalY;
      const newVx = normalVelocity * normalX;
      const newVy = normalVelocity * normalY;

      return {
        x: collisionX,
        y: collisionY,
        distance: t * velocity,
        collidedBallId: other.id,
        collidedBallTrajectory: {
          x1: collisionX,
          y1: collisionY,
          x2: collisionX + (newVx * 20) / velocity,
          y2: collisionY + (newVy * 20) / velocity,
        },
        isWallCollision: false,
      };
    })
    .filter((collision): collision is NonNullable<typeof collision> => collision !== null);

  // Sort all potential collisions by distance
  const allCollisions = [
    ...(wallCollision
      ? [
          {
            x: wallCollision.x,
            y: wallCollision.y,
            distance: wallCollision.distance,
            collidedBallId: null,
            collidedBallTrajectory: {
              x1: wallCollision.x,
              y1: wallCollision.y,
              x2: wallCollision.x + (vx * 20) / velocity,
              y2: wallCollision.y + (vy * 20) / velocity,
            },
            isWallCollision: true,
          },
        ]
      : []),
    ...ballCollisions,
  ].sort((a, b) => a.distance - b.distance);

  // Process collisions in order of distance
  for (const collision of allCollisions) {
    collisions.push(collision);

    if (collision.isWallCollision) {
      // Calculate reflected velocity for wall collision
      const dotProduct = vx * wallCollision!.normalX + vy * wallCollision!.normalY;
      const reflectedVx = vx - 2 * dotProduct * wallCollision!.normalX;
      const reflectedVy = vy - 2 * dotProduct * wallCollision!.normalY;

      // Predict collisions after wall bounce, passing the same predictedBalls set
      const subsequentCollisions = predictSubsequentCollisions(
        { ...ball, x: collision.x, y: collision.y },
        otherBalls,
        reflectedVx,
        reflectedVy,
        ballRadius,
        tableMargin,
        maxDepth,
        currentDepth + 1,
        predictedBalls
      );
      collisions.push(...subsequentCollisions);
      break; // Stop after wall collision as the original trajectory is no longer valid
    } else {
      // For ball collisions, predict subsequent collisions for the hit ball
      const hitBall = otherBalls.find((b) => b.id === collision.collidedBallId);
      if (hitBall) {
        const subsequentCollisions = predictSubsequentCollisions(
          hitBall,
          otherBalls.filter((b) => b.id !== hitBall.id),
          collision.collidedBallTrajectory.x2 - collision.collidedBallTrajectory.x1,
          collision.collidedBallTrajectory.y2 - collision.collidedBallTrajectory.y1,
          ballRadius,
          tableMargin,
          maxDepth,
          currentDepth + 1,
          predictedBalls
        );
        collisions.push(...subsequentCollisions);
      }
    }
  }

  return collisions;
};

// Update the main predictCollisions function to use the new system
export const predictCollisions = (
  ball: PoolBall,
  otherBalls: PoolBall[],
  angle: number,
  velocity: number,
  ballRadius: number,
  tableMargin: number
): PredictedCollision[] => {
  const angleRad = (angle * Math.PI) / 180;
  const vx = Math.cos(angleRad) * velocity;
  const vy = Math.sin(angleRad) * velocity;

  return predictSubsequentCollisions(ball, otherBalls, vx, vy, ballRadius, tableMargin);
};

// Calculate positions for a standard 8-ball rack
export function calculateRackPositions(
  tableMargin: number,
  ballRadius: number
): { x: number; y: number }[] {
  // The rack is positioned at 75% of the table length (from the left)
  // and centered vertically
  const rackCenterX = 75;
  const rackCenterY = 50;

  // The distance between ball centers (1.25 * radius for an even tighter rack)
  const ballSpacing = ballRadius * 1.25;

  // The positions for all 15 balls in a triangle formation
  const positions: { x: number; y: number }[] = [];

  // First row (1 ball)
  positions.push({ x: rackCenterX, y: rackCenterY });

  // Second row (2 balls)
  positions.push({ x: rackCenterX + ballSpacing, y: rackCenterY - ballSpacing * 0.866 });
  positions.push({ x: rackCenterX + ballSpacing, y: rackCenterY + ballSpacing * 0.866 });

  // Third row (3 balls)
  positions.push({ x: rackCenterX + ballSpacing * 2, y: rackCenterY - ballSpacing * 1.732 });
  positions.push({ x: rackCenterX + ballSpacing * 2, y: rackCenterY });
  positions.push({ x: rackCenterX + ballSpacing * 2, y: rackCenterY + ballSpacing * 1.732 });

  // Fourth row (4 balls)
  positions.push({ x: rackCenterX + ballSpacing * 3, y: rackCenterY - ballSpacing * 2.598 });
  positions.push({ x: rackCenterX + ballSpacing * 3, y: rackCenterY - ballSpacing * 0.866 });
  positions.push({ x: rackCenterX + ballSpacing * 3, y: rackCenterY + ballSpacing * 0.866 });
  positions.push({ x: rackCenterX + ballSpacing * 3, y: rackCenterY + ballSpacing * 2.598 });

  // Fifth row (5 balls)
  positions.push({ x: rackCenterX + ballSpacing * 4, y: rackCenterY - ballSpacing * 3.464 });
  positions.push({ x: rackCenterX + ballSpacing * 4, y: rackCenterY - ballSpacing * 1.732 });
  positions.push({ x: rackCenterX + ballSpacing * 4, y: rackCenterY });
  positions.push({ x: rackCenterX + ballSpacing * 4, y: rackCenterY + ballSpacing * 1.732 });
  positions.push({ x: rackCenterX + ballSpacing * 4, y: rackCenterY + ballSpacing * 3.464 });

  return positions;
}
