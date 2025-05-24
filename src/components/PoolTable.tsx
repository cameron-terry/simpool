import React, { useState, useEffect, useRef } from 'react';
import { Ball } from './Ball';
import { ControlPanel } from './ControlPanel';
import type { PoolBall, PhysicsState, ShotState, BallCreationState } from '../types/pool';
import { POCKETS, DEFAULT_PHYSICS, DEFAULT_SHOT, POOL_BALL_COLORS } from '../config/pool';
import {
  updateBallPositions,
  handleWallCollisions,
  handleBallCollisions,
  calculateTrajectoryLine,
  getRandomPosition,
  getRandomVelocity,
} from '../utils/physics';
import '../styles/PoolTable.css';

export function PoolTable() {
  // State management
  const [balls, setBalls] = useState<PoolBall[]>([]);
  const [draggingEnabled, setDraggingEnabled] = useState<boolean>(true);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Physics state
  const [physics, setPhysics] = useState<PhysicsState>(DEFAULT_PHYSICS);

  // Shot state
  const [shot, setShot] = useState<ShotState>({
    ...DEFAULT_SHOT,
    selectedBall: null,
    trajectoryLine: null,
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
        let newBalls = updateBallPositions(currentBalls, physics.friction);
        newBalls = handleWallCollisions(newBalls, physics.tableMargin, physics.ballRadius);
        newBalls = handleBallCollisions(newBalls, physics.ballRadius);
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
  }, [physics.friction, physics.tableMargin, physics.ballRadius]);

  // Trajectory line update
  useEffect(() => {
    if (shot.selectedBall !== null) {
      const ball = balls.find((b) => b.id === shot.selectedBall);
      if (ball) {
        setShot((prev) => ({
          ...prev,
          trajectoryLine: calculateTrajectoryLine(ball, shot.shotAngle, 20),
        }));
      }
    } else {
      setShot((prev) => ({ ...prev, trajectoryLine: null }));
    }
  }, [shot.selectedBall, shot.shotAngle, balls]);

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

  const handleAddCustomBall = () => {
    const { x, y } = getRandomPosition(physics.tableMargin, physics.ballRadius);
    const newBall: PoolBall = {
      id: ballCreation.nextBallId,
      number: ballCreation.newBallNumber,
      color: ballCreation.newBallColor,
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
    const newBall: PoolBall = {
      id: ballCreation.nextBallId,
      number: ballCreation.newBallNumber,
      color: randomColor.color,
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
      newBallNumber: prev.newBallNumber + 1,
    }));
  };

  const handleBallDrag = (ballId: number, newX: number, newY: number) => {
    const margin = 5;
    const constrainedX = Math.max(margin, Math.min(100 - margin, newX));
    const constrainedY = Math.max(margin, Math.min(100 - margin, newY));

    setBalls((prev) =>
      prev.map((ball) =>
        ball.id === ballId ? { ...ball, x: constrainedX, y: constrainedY } : ball
      )
    );
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

  return (
    <div className="pool-table-container">
      <ControlPanel
        physics={physics}
        shot={shot}
        ballCreation={ballCreation}
        onPhysicsChange={handlePhysicsChange}
        onShotChange={handleShotChange}
        onBallCreationChange={handleBallCreationChange}
        onAddCustomBall={handleAddCustomBall}
        onAddRandomBall={handleAddRandomBall}
        onLaunch={handleLaunch}
        draggingEnabled={draggingEnabled}
        onDraggingToggle={setDraggingEnabled}
      />
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
        {shot.trajectoryLine && (
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
            <line
              x1={`${shot.trajectoryLine.x1}%`}
              y1={`${shot.trajectoryLine.y1}%`}
              x2={`${shot.trajectoryLine.x2}%`}
              y2={`${shot.trajectoryLine.y2}%`}
              stroke="black"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
        )}
        {balls.map((ball) => (
          <Ball
            key={ball.id}
            number={ball.number}
            color={ball.color}
            x={ball.x}
            y={ball.y}
            radius={ball.radius}
            onDrag={(x, y) => handleBallDrag(ball.id, x, y)}
            draggingEnabled={draggingEnabled}
            onClick={() => handleBallClick(ball.id)}
            isSelected={ball.id === shot.selectedBall}
          />
        ))}
      </div>
    </div>
  );
}
