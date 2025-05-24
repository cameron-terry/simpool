import type { PoolBall } from '../types/pool';
import type { PredictedCollision, TrajectoryLine } from '../types/physics';
import { COLLISION_THRESHOLD } from '../config/pool';

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
  const collisionDist = minDist * COLLISION_THRESHOLD;

  for (let i = 0; i < newBalls.length; i++) {
    for (let j = i + 1; j < newBalls.length; j++) {
      const b1 = newBalls[i];
      const b2 = newBalls[j];

      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Handle collision response
      if (dist < collisionDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        const dvx = b2.vx - b1.vx;
        const dvy = b2.vy - b1.vy;
        const relativeVelocity = dvx * nx + dvy * ny;

        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity;

          newBalls[i] = {
            ...b1,
            vx: b1.vx - impulse * nx,
            vy: b1.vy - impulse * ny,
          };

          newBalls[j] = {
            ...b2,
            vx: b2.vx + impulse * nx,
            vy: b2.vy + impulse * ny,
          };
        }
      }

      // Handle overlap correction
      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (minDist - dist) / 2;
        const separationX = nx * overlap;
        const separationY = ny * overlap;

        newBalls[i].x -= separationX;
        newBalls[i].y -= separationY;
        newBalls[j].x += separationX;
        newBalls[j].y += separationY;
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

export function predictCollisions(
  ball: PoolBall,
  otherBalls: PoolBall[],
  angle: number,
  velocity: number,
  ballRadius: number
): PredictedCollision[] {
  const angleRad = (angle * Math.PI) / 180;
  const vx = Math.cos(angleRad) * velocity;
  const vy = Math.sin(angleRad) * velocity;

  const collisions = otherBalls
    .filter((other) => other.id !== ball.id)
    .map((other) => {
      // Calculate time until collision using quadratic formula
      const dx = other.x - ball.x;
      const dy = other.y - ball.y;

      // Calculate the relative position vector
      const relativeX = dx;
      const relativeY = dy;

      // Calculate the dot product of velocity and relative position
      const dotProduct = vx * relativeX + vy * relativeY;

      // If dot product is negative, the ball is moving away from the other ball
      if (dotProduct <= 0) return null;

      // Calculate the closest approach distance
      const relativeSpeedSquared = vx * vx + vy * vy;
      const closestApproachDistance = Math.abs(
        (relativeX * vy - relativeY * vx) / Math.sqrt(relativeSpeedSquared)
      );

      // If closest approach is greater than 2 * ballRadius, no collision will occur
      if (closestApproachDistance > ballRadius * 2) return null;

      // Calculate the time until collision
      const distanceSquared = dx * dx + dy * dy;
      const collisionDistanceSquared = ballRadius * 2 * (ballRadius * 2);

      // Calculate the time using the quadratic formula
      const a = relativeSpeedSquared;
      const b = -2 * dotProduct;
      const c = distanceSquared - collisionDistanceSquared;

      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) return null;

      const t = (-b - Math.sqrt(discriminant)) / (2 * a);
      if (t < 0) return null;

      // Calculate the collision point
      const collisionX = ball.x + vx * t;
      const collisionY = ball.y + vy * t;

      // Verify the collision point is in the correct direction
      const collisionDx = collisionX - ball.x;
      const collisionDy = collisionY - ball.y;
      const collisionDotProduct = vx * collisionDx + vy * collisionDy;

      if (collisionDotProduct <= 0) return null;

      // Calculate the collided ball's trajectory
      const normalX = (collisionX - other.x) / (ballRadius * 2);
      const normalY = (collisionY - other.y) / (ballRadius * 2);

      // Calculate the velocity transfer using elastic collision
      const relativeVelocityX = vx;
      const relativeVelocityY = vy;
      const normalVelocity = relativeVelocityX * normalX + relativeVelocityY * normalY;

      // Calculate the new velocity for the collided ball
      const newVx = normalVelocity * normalX;
      const newVy = normalVelocity * normalY;

      // Calculate the trajectory line for the collided ball
      const trajectoryLength = 20; // Same as the original trajectory line
      const collidedBallTrajectory = {
        x1: collisionX,
        y1: collisionY,
        x2: collisionX + (newVx * trajectoryLength) / velocity,
        y2: collisionY + (newVy * trajectoryLength) / velocity,
      };

      const collision: PredictedCollision = {
        x: collisionX,
        y: collisionY,
        distance: t * velocity,
        collidedBallId: other.id,
        collidedBallTrajectory,
      };

      return collision;
    })
    .filter((collision): collision is PredictedCollision => collision !== null);

  return collisions.sort((a, b) => a.distance - b.distance);
}
