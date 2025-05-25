import React, { useState, useEffect, useRef } from 'react';
import { Ball } from './Ball';
import { ControlPanel } from './ControlPanel';
import { TrajectoryVisualization } from './TrajectoryVisualization';
import type {
  PoolBall,
  PhysicsState,
  ShotState,
  BallCreationState,
  GameMode,
  GolfGameState,
} from '../types/pool';
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

// Update these constants before the PoolTable component
const POCKET_RADIUS = 8; // Single radius for all pockets

// Update the PredictedCollision type to make collidedBallTrajectory required
type PredictedCollision = {
  x: number;
  y: number;
  distance: number;
  collidedBallId: number | null;
  collidedBallTrajectory: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  isWallCollision: boolean;
};

const isBallInPocket = (ball: PoolBall, pocket: { x: number; y: number }): boolean => {
  const dx = ball.x - pocket.x;
  const dy = ball.y - pocket.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < POCKET_RADIUS;
};

// Add function to predict collisions
const predictCollisions = (
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

  // Calculate wall collisions
  const wallCollisions: PredictedCollision[] = [];

  // Check horizontal walls (top and bottom)
  if (vy !== 0) {
    const timeToTopWall = (tableMargin - ball.y + ballRadius) / vy;
    const timeToBottomWall = (100 - tableMargin - ball.y - ballRadius) / vy;

    if (timeToTopWall > 0) {
      const collisionX = ball.x + vx * timeToTopWall;
      if (collisionX >= tableMargin && collisionX <= 100 - tableMargin) {
        wallCollisions.push({
          x: collisionX,
          y: tableMargin - ballRadius,
          distance: timeToTopWall * velocity,
          collidedBallId: null,
          collidedBallTrajectory: {
            x1: collisionX,
            y1: tableMargin - ballRadius,
            x2: collisionX + (vx * 20) / velocity,
            y2: tableMargin - ballRadius - (vy * 20) / velocity,
          },
          isWallCollision: true,
        });
      }
    }

    if (timeToBottomWall > 0) {
      const collisionX = ball.x + vx * timeToBottomWall;
      if (collisionX >= tableMargin && collisionX <= 100 - tableMargin) {
        wallCollisions.push({
          x: collisionX,
          y: 100 - tableMargin + ballRadius,
          distance: timeToBottomWall * velocity,
          collidedBallId: null,
          collidedBallTrajectory: {
            x1: collisionX,
            y1: 100 - tableMargin + ballRadius,
            x2: collisionX + (vx * 20) / velocity,
            y2: 100 - tableMargin + ballRadius - (vy * 20) / velocity,
          },
          isWallCollision: true,
        });
      }
    }
  }

  // Check vertical walls (left and right)
  if (vx !== 0) {
    const timeToLeftWall = (tableMargin - ball.x + ballRadius) / vx;
    const timeToRightWall = (100 - tableMargin - ball.x - ballRadius) / vx;

    if (timeToLeftWall > 0) {
      const collisionY = ball.y + vy * timeToLeftWall;
      if (collisionY >= tableMargin && collisionY <= 100 - tableMargin) {
        wallCollisions.push({
          x: tableMargin - ballRadius,
          y: collisionY,
          distance: timeToLeftWall * velocity,
          collidedBallId: null,
          collidedBallTrajectory: {
            x1: tableMargin - ballRadius,
            y1: collisionY,
            x2: tableMargin - ballRadius - (vx * 20) / velocity,
            y2: collisionY + (vy * 20) / velocity,
          },
          isWallCollision: true,
        });
      }
    }

    if (timeToRightWall > 0) {
      const collisionY = ball.y + vy * timeToRightWall;
      if (collisionY >= tableMargin && collisionY <= 100 - tableMargin) {
        wallCollisions.push({
          x: 100 - tableMargin + ballRadius,
          y: collisionY,
          distance: timeToRightWall * velocity,
          collidedBallId: null,
          collidedBallTrajectory: {
            x1: 100 - tableMargin + ballRadius,
            y1: collisionY,
            x2: 100 - tableMargin + ballRadius - (vx * 20) / velocity,
            y2: collisionY + (vy * 20) / velocity,
          },
          isWallCollision: true,
        });
      }
    }
  }

  // Get ball collisions as before
  const ballCollisions = otherBalls
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
        isWallCollision: false,
      };

      return collision;
    })
    .filter((collision): collision is PredictedCollision => collision !== null);

  // Combine and sort all collisions by distance
  return [...wallCollisions, ...ballCollisions].sort((a, b) => a.distance - b.distance);
};

// Add constant for cue ball initial position
const CUE_BALL_INITIAL_POSITION = { x: 25, y: 50 };

export function PoolTable() {
  // State management
  const [balls, setBalls] = useState<PoolBall[]>([]);
  const [draggingEnabled, setDraggingEnabled] = useState<boolean>(true);
  const [draggedBallId, setDraggedBallId] = useState<number | null>(null);
  const [autoSelectCueBall, setAutoSelectCueBall] = useState<boolean>(true);
  const [flashingPocketId, setFlashingPocketId] = useState<number | null>(null);
  const [isCueBallPocketed, setIsCueBallPocketed] = useState<boolean>(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [golfState, setGolfState] = useState<GolfGameState>({
    isActive: false,
    startTime: null,
    endTime: null,
    shots: 0,
    isComplete: false,
  });

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
        const pocketedBalls = currentBalls.filter((ball) =>
          POCKETS.some((pocket) => isBallInPocket(ball, pocket))
        );

        // If any balls were pocketed, trigger the flash animation
        if (pocketedBalls.length > 0) {
          // Find the pocket that the ball entered
          const pocketedBall = pocketedBalls[0];
          const pocket = POCKETS.find((p) => isBallInPocket(pocketedBall, p));
          if (pocket) {
            setFlashingPocketId(pocket.id);
            const isCueBall = pocketedBall.number === 0;
            setIsCueBallPocketed(isCueBall);

            // If it's the cue ball, reset it to initial position
            if (isCueBall) {
              // Remove the pocketed cue ball and add a new one at the initial position
              const remainingBalls = currentBalls.filter((ball) => ball.number !== 0);
              const resetCueBall: PoolBall = {
                ...pocketedBall,
                x: CUE_BALL_INITIAL_POSITION.x,
                y: CUE_BALL_INITIAL_POSITION.y,
                vx: 0,
                vy: 0,
              };
              return [...remainingBalls, resetCueBall];
            }

            // Reset the flashing state after animation
            setTimeout(() => {
              setFlashingPocketId(null);
              setIsCueBallPocketed(false);
            }, 300);
          }
        }

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
        predictCollisions(
          ball,
          balls,
          shot.shotAngle,
          shot.shotVelocity,
          physics.ballRadius,
          physics.tableMargin
        );
      }
    }
  }, [
    shot.selectedBall,
    shot.shotAngle,
    shot.shotVelocity,
    balls,
    physics.ballRadius,
    physics.tableMargin,
  ]);

  // Add effect to auto-select cue ball
  useEffect(() => {
    if (autoSelectCueBall && !shot.selectedBall) {
      const cueBall = balls.find((ball) => ball.number === 0);
      if (cueBall) {
        setShot((prev) => ({ ...prev, selectedBall: cueBall.id }));
      }
    }
  }, [autoSelectCueBall, balls, shot.selectedBall]);

  // Effect to handle golf mode game completion
  useEffect(() => {
    if (gameMode === 'golf' && golfState.isActive && !golfState.isComplete) {
      const nonCueBalls = balls.filter((ball) => ball.number !== 0);
      if (nonCueBalls.length === 0) {
        setGolfState((prev) => ({
          ...prev,
          isComplete: true,
          endTime: Date.now(),
        }));
      }
    }
  }, [balls, gameMode, golfState.isActive, golfState.isComplete]);

  // Effect to start golf mode timer
  useEffect(() => {
    if (gameMode === 'golf' && golfState.isActive && !golfState.startTime) {
      setGolfState((prev) => ({
        ...prev,
        startTime: Date.now(),
      }));
    }
  }, [gameMode, golfState.isActive, golfState.startTime]);

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

    if (gameMode === 'golf' && golfState.isActive) {
      setGolfState((prev) => ({
        ...prev,
        shots: prev.shots + 1,
      }));
    }

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
      racked: false,
    });

    // Add racked balls
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
        racked: true,
      });
    });

    setBalls(newBalls);
    setBallCreation((prev) => ({ ...prev, nextBallId: newBalls.length }));

    // Reset golf state if in golf mode
    if (gameMode === 'golf') {
      setGolfState({
        isActive: true,
        startTime: null,
        endTime: null,
        shots: 0,
        isComplete: false,
      });
    }
  };

  // Add function to toggle game mode
  const handleGameModeToggle = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'golf') {
      setGolfState({
        isActive: true,
        startTime: null,
        endTime: null,
        shots: 0,
        isComplete: false,
      });
      handleRack(); // Automatically rack balls when entering golf mode
    } else {
      setGolfState({
        isActive: false,
        startTime: null,
        endTime: null,
        shots: 0,
        isComplete: false,
      });
    }
  };

  return (
    <div className="pool-table-container">
      <h1 className="pool-table-title">simpool</h1>
      <div
        className={`golf-stats ${gameMode === 'golf' && golfState.isActive ? 'visible' : 'hidden'} ${
          golfState.isComplete ? 'complete' : ''
        }`}
      >
        <div className="golf-stat">
          <span>Time: </span>
          <span>
            {golfState.startTime && !golfState.isComplete
              ? Math.floor((Date.now() - golfState.startTime) / 1000)
              : golfState.endTime && golfState.startTime
                ? Math.floor((golfState.endTime - golfState.startTime) / 1000)
                : 0}
            s
          </span>
        </div>
        <div className="golf-stat">
          <span>Shots: </span>
          <span>{golfState.shots}</span>
        </div>
      </div>
      <div className="pool-table-wrapper">
        <div className="pool-table">
          <div className="head-string" />
          {POCKETS.map((pocket) => (
            <div
              key={pocket.id}
              className={`pocket ${
                flashingPocketId === pocket.id
                  ? isCueBallPocketed
                    ? 'flashing-cue'
                    : 'flashing'
                  : ''
              }`}
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
          autoSelectCueBall={autoSelectCueBall}
          onAutoSelectCueBallToggle={setAutoSelectCueBall}
          gameMode={gameMode}
          onGameModeToggle={handleGameModeToggle}
          golfState={golfState}
        />
      </div>
    </div>
  );
}
