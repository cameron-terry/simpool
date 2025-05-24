import React, { useState, useEffect, useRef } from 'react';
import { Ball } from './Ball';
import { ControlPanel } from './ControlPanel';
import { TrajectoryVisualization } from './TrajectoryVisualization';
import type { PoolBall, PhysicsState, ShotState, BallCreationState } from '../types/pool';
import { POCKETS, DEFAULT_PHYSICS, DEFAULT_SHOT, POOL_BALL_COLORS } from '../config/pool';
import {
  updateBallPositions,
  handleWallCollisions,
  handleBallCollisions,
  getRandomPosition,
  getRandomVelocity,
  calculateRackPositions,
} from '../utils/physics';
import '../styles/PoolTable.css';

// Add these constants before the PoolTable component
const CORNER_POCKET_RADIUS = 6; // Larger radius for corner pockets
const MIDDLE_POCKET_RADIUS = 4; // Smaller radius for middle pockets

// Update the PredictedCollision type to make collidedBallTrajectory required
type PredictedCollision = {
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

const isBallInPocket = (ball: PoolBall, pocket: { x: number; y: number }): boolean => {
  // Determine if this is a corner pocket (x and y are at 0 or 100)
  const isCornerPocket =
    (pocket.x === 0 || pocket.x === 100) && (pocket.y === 0 || pocket.y === 100);
  const pocketRadius = isCornerPocket ? CORNER_POCKET_RADIUS : MIDDLE_POCKET_RADIUS;

  const dx = ball.x - pocket.x;
  const dy = ball.y - pocket.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < pocketRadius;
};

// Add function to predict collisions
const predictCollisions = (
  ball: PoolBall,
  otherBalls: PoolBall[],
  angle: number,
  velocity: number,
  ballRadius: number
): PredictedCollision[] => {
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
};

export function PoolTable() {
  // State management
  const [balls, setBalls] = useState<PoolBall[]>([]);
  const [draggingEnabled, setDraggingEnabled] = useState<boolean>(true);
  const [draggedBallId, setDraggedBallId] = useState<number | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Physics state
  const [physics, setPhysics] = useState<PhysicsState>(DEFAULT_PHYSICS);

  // Shot state
  const [shot, setShot] = useState<ShotState>({
    ...DEFAULT_SHOT,
    selectedBall: null,
  });

  // Ball creation state
  const [ballCreation, setBallCreation] = useState<BallCreationState>({
    newBallNumber: 1,
    newBallColor: POOL_BALL_COLORS[0].color,
    nextBallId: 1,
  });

  // Physics update loop
  useEffect(() => {
    const updatePhysics = () => {
      setBalls((currentBalls) => {
        // First check for pocketed balls and remove them
        let newBalls = currentBalls.filter(
          (ball) => !POCKETS.some((pocket) => isBallInPocket(ball, pocket))
        );

        // Then update remaining balls
        newBalls = updateBallPositions(newBalls, physics.friction);
        newBalls = handleWallCollisions(newBalls, physics.tableMargin, physics.ballRadius);

        // Only handle ball collisions if no ball is being dragged
        if (draggedBallId === null) {
          // Update racked state - if a ball moves, it's no longer racked
          newBalls = newBalls.map((ball) => {
            if (ball.racked && (Math.abs(ball.vx) > 0.01 || Math.abs(ball.vy) > 0.01)) {
              return { ...ball, racked: false };
            }
            return ball;
          });

          // Only handle collisions between non-racked balls or when a racked ball is hit
          newBalls = handleBallCollisions(newBalls, physics.ballRadius);
        }

        return newBalls;
      });

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [physics.friction, physics.tableMargin, physics.ballRadius, draggedBallId]);

  // Trajectory line update
  useEffect(() => {
    if (shot.selectedBall !== null) {
      const ball = balls.find((b) => b.id === shot.selectedBall);
      if (ball) {
        // Calculate predicted collisions for visualization
        predictCollisions(ball, balls, shot.shotAngle, shot.shotVelocity, physics.ballRadius);
      }
    }
  }, [shot.selectedBall, shot.shotAngle, shot.shotVelocity, balls, physics.ballRadius]);

  // Event handlers
  const handlePhysicsChange = (key: keyof PhysicsState, value: number) => {
    setPhysics((prev) => ({ ...prev, [key]: value }));
  };

  const handleShotChange = (key: keyof ShotState, value: number) => {
    setShot((prev) => ({ ...prev, [key]: value }));
  };

  const handleBallCreationChange = (key: keyof BallCreationState, value: number | string) => {
    setBallCreation((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddPresetBall = (presetIndex: number) => {
    const { x, y } = getRandomPosition(physics.tableMargin, physics.ballRadius);
    const presetBall = POOL_BALL_COLORS[presetIndex];
    const newBall: PoolBall = {
      id: ballCreation.nextBallId,
      number: presetIndex === 0 ? 0 : presetIndex,
      color: presetBall.color,
      type: presetBall.type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: physics.ballRadius,
    };
    setBalls((prev) => [...prev, newBall]);
    setBallCreation((prev) => ({
      ...prev,
      nextBallId: prev.nextBallId + 1,
    }));
  };

  const handleAddCustomBall = () => {
    const { x, y } = getRandomPosition(physics.tableMargin, physics.ballRadius);
    const newBall: PoolBall = {
      id: ballCreation.nextBallId,
      number: ballCreation.newBallNumber,
      color: ballCreation.newBallColor,
      type: 'solid',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: physics.ballRadius,
    };
    setBalls((prev) => [...prev, newBall]);
    setBallCreation((prev) => ({
      ...prev,
      nextBallId: prev.nextBallId + 1,
      newBallNumber: prev.newBallNumber + 1,
    }));
  };

  const handleAddRandomBall = () => {
    const { x, y } = getRandomPosition(physics.tableMargin, physics.ballRadius);
    const { vx, vy } = getRandomVelocity(physics.ballSpeed);
    const randomColor = POOL_BALL_COLORS[Math.floor(Math.random() * POOL_BALL_COLORS.length)];
    const isCueBall = randomColor === POOL_BALL_COLORS[0];
    const newBall: PoolBall = {
      id: ballCreation.nextBallId,
      number: isCueBall ? 0 : ballCreation.newBallNumber,
      color: randomColor.color,
      type: randomColor.type,
      x,
      y,
      vx,
      vy,
      radius: physics.ballRadius,
    };
    setBalls((prev) => [...prev, newBall]);
    setBallCreation((prev) => ({
      ...prev,
      nextBallId: prev.nextBallId + 1,
      newBallNumber: isCueBall ? prev.newBallNumber : prev.newBallNumber + 1,
    }));
  };

  const handleBallDrag = (ballId: number, x: number, y: number) => {
    setDraggedBallId(ballId);
    setBalls((currentBalls) =>
      currentBalls.map((ball) => (ball.id === ballId ? { ...ball, x, y, vx: 0, vy: 0 } : ball))
    );
  };

  const handleBallDragEnd = () => {
    setDraggedBallId(null);
  };

  const handleBallClick = (ballId: number) => {
    setShot((prev) => ({
      ...prev,
      selectedBall: ballId === prev.selectedBall ? null : ballId,
    }));
  };

  const handleLaunch = () => {
    if (shot.selectedBall === null) return;

    setBalls((prev) =>
      prev.map((ball) => {
        if (ball.id === shot.selectedBall) {
          const angleRad = (shot.shotAngle * Math.PI) / 180;
          return {
            ...ball,
            vx: Math.cos(angleRad) * shot.shotVelocity,
            vy: Math.sin(angleRad) * shot.shotVelocity,
          };
        }
        return ball;
      })
    );
    setShot((prev) => ({ ...prev, selectedBall: null }));
  };

  const handleRack = () => {
    // Clear existing balls
    setBalls([]);

    // Get rack positions
    const rackPositions = calculateRackPositions(physics.tableMargin, physics.ballRadius);

    // Create new balls in rack formation
    const newBalls: PoolBall[] = [];

    // Add cue ball at the head of the table (25% from the left)
    newBalls.push({
      id: 0,
      number: 0,
      color: POOL_BALL_COLORS[0].color,
      type: 'solid',
      x: 25,
      y: 50,
      vx: 0,
      vy: 0,
      radius: physics.ballRadius,
      racked: false, // Cue ball is not racked
    });

    // Add racked balls
    // Shuffle the balls 1-15 (excluding 8-ball)
    const ballNumbers = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
    for (let i = ballNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ballNumbers[i], ballNumbers[j]] = [ballNumbers[j], ballNumbers[i]];
    }

    // Insert 8-ball in the middle of the rack (position 4)
    ballNumbers.splice(4, 0, 8);

    // Create balls with shuffled numbers
    ballNumbers.forEach((number, index) => {
      const ballColor = POOL_BALL_COLORS[number];
      newBalls.push({
        id: index + 1,
        number,
        color: ballColor.color,
        type: ballColor.type,
        x: rackPositions[index].x,
        y: rackPositions[index].y,
        vx: 0,
        vy: 0,
        radius: physics.ballRadius,
        racked: true, // All racked balls start as racked
      });
    });

    setBalls(newBalls);
    setBallCreation((prev) => ({ ...prev, nextBallId: newBalls.length }));
  };

  return (
    <div className="pool-table-container">
      <h1 className="pool-table-title">simpool</h1>
      <div className="pool-table-wrapper">
        <div className="pool-table">
          {POCKETS.map((pocket) => (
            <div
              key={pocket.id}
              className="pocket"
              style={{
                left: `${pocket.x}%`,
                top: `${pocket.y}%`,
              }}
            />
          ))}
          {shot.selectedBall !== null && (
            <TrajectoryVisualization
              selectedBall={balls.find((b) => b.id === shot.selectedBall) || null}
              balls={balls}
              shot={shot}
              physics={physics}
            />
          )}
          {balls.map((ball) => (
            <Ball
              key={ball.id}
              number={ball.number}
              color={ball.color}
              type={ball.type}
              x={ball.x}
              y={ball.y}
              radius={ball.radius}
              onDrag={(x, y) => handleBallDrag(ball.id, x, y)}
              onDragEnd={handleBallDragEnd}
              draggingEnabled={draggingEnabled}
              onClick={() => handleBallClick(ball.id)}
              isSelected={shot.selectedBall === ball.id}
            />
          ))}
        </div>
        <ControlPanel
          physics={physics}
          shot={shot}
          ballCreation={ballCreation}
          onPhysicsChange={handlePhysicsChange}
          onShotChange={handleShotChange}
          onBallCreationChange={handleBallCreationChange}
          onAddCustomBall={handleAddCustomBall}
          onAddPresetBall={handleAddPresetBall}
          onAddRandomBall={handleAddRandomBall}
          onLaunch={handleLaunch}
          draggingEnabled={draggingEnabled}
          onDraggingToggle={setDraggingEnabled}
          onRack={handleRack}
        />
      </div>
    </div>
  );
}
