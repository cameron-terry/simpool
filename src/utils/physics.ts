import type { PoolBall } from '../types/pool';
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
): { x1: number; y1: number; x2: number; y2: number } {
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
