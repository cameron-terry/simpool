import React, { useState, useEffect, useRef } from 'react';
import { Ball } from './Ball';
import '../styles/PoolTable.css';

interface Pocket {
  id: number;
  x: number;
  y: number;
}

interface PoolBall {
  id: number;
  number: number;
  color: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  radius: number; // ball radius in percentage
}

interface TrajectoryLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const pockets: Pocket[] = [
  { id: 1, x: 0, y: 0 }, // Top left
  { id: 2, x: 50, y: 0 }, // Top middle
  { id: 3, x: 100, y: 0 }, // Top right
  { id: 4, x: 0, y: 100 }, // Bottom left
  { id: 5, x: 50, y: 100 }, // Bottom middle
  { id: 6, x: 100, y: 100 }, // Bottom right
];

const POOL_BALL_COLORS = [
  { type: 'solid', color: '#FFFFFF', label: 'White (Cue)' },
  { type: 'solid', color: '#FFFF00', label: 'Solid 1 (Yellow)' },
  { type: 'solid', color: '#0000FF', label: 'Solid 2 (Blue)' },
  { type: 'solid', color: '#FF0000', label: 'Solid 3 (Red)' },
  { type: 'solid', color: '#800080', label: 'Solid 4 (Purple)' },
  { type: 'solid', color: '#FFA500', label: 'Solid 5 (Orange)' },
  { type: 'solid', color: '#008000', label: 'Solid 6 (Green)' },
  { type: 'solid', color: '#8B4513', label: 'Solid 7 (Brown)' },
  { type: 'solid', color: '#000000', label: 'Solid 8 (Black)' },
  { type: 'stripe', color: '#FFFF80', label: 'Stripe 9 (Yellow)' },
  { type: 'stripe', color: '#4040FF', label: 'Stripe 10 (Blue)' },
  { type: 'stripe', color: '#FF4040', label: 'Stripe 11 (Red)' },
  { type: 'stripe', color: '#C080C0', label: 'Stripe 12 (Purple)' },
  { type: 'stripe', color: '#FFC040', label: 'Stripe 13 (Orange)' },
  { type: 'stripe', color: '#40C040', label: 'Stripe 14 (Green)' },
  { type: 'stripe', color: '#C08040', label: 'Stripe 15 (Brown)' },
];

export function PoolTable() {
  const [selectedPocket, setSelectedPocket] = useState<number | null>(null);
  const [balls, setBalls] = useState<PoolBall[]>([]);
  const [newBallNumber, setNewBallNumber] = useState<number>(1);
  const [newBallColor, setNewBallColor] = useState<string>(POOL_BALL_COLORS[0].color);
  const [nextBallId, setNextBallId] = useState<number>(1);
  const [draggingEnabled, setDraggingEnabled] = useState<boolean>(true);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Physics parameters as state
  const [ballRadius, setBallRadius] = useState<number>(3.2);
  const [friction, setFriction] = useState<number>(0.991);
  const tableMargin = 0; // Fixed at 0 since we're using the wooden border for visual boundaries
  const [ballSpeed, setBallSpeed] = useState<number>(2.0);

  // Shot control state
  const [selectedBall, setSelectedBall] = useState<number | null>(null);
  const [shotAngle, setShotAngle] = useState<number>(0); // in degrees
  const [shotVelocity, setShotVelocity] = useState<number>(0.8);
  const [trajectoryLine, setTrajectoryLine] = useState<TrajectoryLine | null>(null);

  // Physics update loop
  useEffect(() => {
    const updatePhysics = () => {
      setBalls((currentBalls) => {
        let newBalls = [...currentBalls];

        // Update positions based on velocity
        newBalls = newBalls.map((ball) => ({
          ...ball,
          x: ball.x + ball.vx,
          y: ball.y + ball.vy,
          vx: ball.vx * friction,
          vy: ball.vy * friction,
        }));

        // Handle wall collisions
        newBalls = newBalls.map((ball) => {
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

        // Handle ball-to-ball collisions
        for (let i = 0; i < newBalls.length; i++) {
          for (let j = i + 1; j < newBalls.length; j++) {
            const b1 = newBalls[i];
            const b2 = newBalls[j];

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = ballRadius * 2;
            const collisionThreshold = minDist * 0.99; // Only detect collision when balls are very close

            // Check for collision
            if (dist < collisionThreshold) {
              // Normalize collision vector
              const nx = dx / dist;
              const ny = dy / dist;

              // Calculate relative velocity
              const dvx = b2.vx - b1.vx;
              const dvy = b2.vy - b1.vy;
              const relativeVelocity = dvx * nx + dvy * ny;

              // Handle velocity changes if balls are moving toward each other
              if (relativeVelocity < 0) {
                // Calculate impulse (assuming equal mass)
                const impulse = -relativeVelocity;

                // Update velocities using impulse
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

            // Handle overlap correction separately
            if (dist < minDist) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = (minDist - dist) / 2;
              const separationX = nx * overlap;
              const separationY = ny * overlap;

              // Move balls apart along collision normal
              newBalls[i].x -= separationX;
              newBalls[i].y -= separationY;
              newBalls[j].x += separationX;
              newBalls[j].y += separationY;
            }
          }
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
  }, [friction, tableMargin, ballRadius]);

  // Trajectory line update effect
  useEffect(() => {
    if (selectedBall !== null) {
      const ball = balls.find((b) => b.id === selectedBall);
      if (ball) {
        const angleRad = (shotAngle * Math.PI) / 180;
        const lineLength = 20; // percentage of table width
        setTrajectoryLine({
          x1: ball.x,
          y1: ball.y,
          x2: ball.x + Math.cos(angleRad) * lineLength,
          y2: ball.y + Math.sin(angleRad) * lineLength,
        });
      }
    } else {
      setTrajectoryLine(null);
    }
  }, [selectedBall, shotAngle, balls]);

  const handlePocketClick = (pocketId: number) => {
    setSelectedPocket(pocketId === selectedPocket ? null : pocketId);
  };

  const getRandomPosition = () => {
    const margin = tableMargin + ballRadius;
    const x = margin + Math.random() * (100 - 2 * margin);
    const y = margin + Math.random() * (100 - 2 * margin);
    return { x, y };
  };

  const getRandomVelocity = () => {
    const angle = Math.random() * Math.PI * 2;
    return {
      vx: Math.cos(angle) * ballSpeed,
      vy: Math.sin(angle) * ballSpeed,
    };
  };

  const getRandomColor = () => {
    const ballColor = POOL_BALL_COLORS[Math.floor(Math.random() * POOL_BALL_COLORS.length)];
    return ballColor.color;
  };

  const handleAddCustomBall = () => {
    const { x, y } = getRandomPosition();
    const newBall: PoolBall = {
      id: nextBallId,
      number: newBallNumber,
      color: newBallColor,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: ballRadius,
    };
    setBalls([...balls, newBall]);
    setNextBallId(nextBallId + 1);
    setNewBallNumber(newBallNumber + 1);
  };

  const handleAddRandomBall = () => {
    const { x, y } = getRandomPosition();
    const { vx, vy } = getRandomVelocity();
    const newBall: PoolBall = {
      id: nextBallId,
      number: newBallNumber,
      color: getRandomColor(),
      x,
      y,
      vx,
      vy,
      radius: ballRadius,
    };
    setBalls([...balls, newBall]);
    setNextBallId(nextBallId + 1);
    setNewBallNumber(newBallNumber + 1);
  };

  const handleBallDrag = (ballId: number, newX: number, newY: number) => {
    // Keep balls within table boundaries (with margin)
    const margin = 5; // percentage from edges
    const constrainedX = Math.max(margin, Math.min(100 - margin, newX));
    const constrainedY = Math.max(margin, Math.min(100 - margin, newY));

    setBalls(
      balls.map((ball) =>
        ball.id === ballId ? { ...ball, x: constrainedX, y: constrainedY } : ball
      )
    );
  };

  const handleBallClick = (ballId: number) => {
    setSelectedBall(ballId === selectedBall ? null : ballId);
  };

  const handleLaunch = () => {
    if (selectedBall === null) return;

    setBalls((currentBalls) =>
      currentBalls.map((ball) => {
        if (ball.id === selectedBall) {
          const angleRad = (shotAngle * Math.PI) / 180;
          return {
            ...ball,
            vx: Math.cos(angleRad) * shotVelocity,
            vy: Math.sin(angleRad) * shotVelocity,
          };
        }
        return ball;
      })
    );
    setSelectedBall(null);
  };

  const handleColorChange = (color: string) => {
    setNewBallColor(color);
    // Find the corresponding ball number based on the color
    const ballColor = POOL_BALL_COLORS.find((bc) => bc.color === color);
    if (ballColor) {
      const ballNumber = ballColor.label.match(/\d+/)?.[0];
      if (ballNumber) {
        setNewBallNumber(parseInt(ballNumber));
      }
    }
  };

  return (
    <div className="pool-table-container">
      <div className="control-panel">
        <div className="ball-creation-controls">
          <h3>Add Ball</h3>
          <div className="control-group">
            <label>Number:</label>
            <input
              type="number"
              value={newBallNumber}
              onChange={(e) => setNewBallNumber(Number(e.target.value))}
              min="1"
            />
          </div>
          <div className="control-group">
            <label>Color:</label>
            <div className="color-picker-container">
              <input
                type="color"
                value={newBallColor}
                onChange={(e) => handleColorChange(e.target.value)}
              />
              <select
                value={newBallColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="color-select"
              >
                {POOL_BALL_COLORS.map((ballColor) => (
                  <option key={`${ballColor.type}-${ballColor.color}`} value={ballColor.color}>
                    {ballColor.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleAddCustomBall}>Add Stationary Ball</button>
          <button onClick={handleAddRandomBall}>Add Random Ball</button>
        </div>

        <div className="control-group">
          <label>Ball Radius: {ballRadius.toFixed(1)}%</label>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={ballRadius}
            onChange={(e) => setBallRadius(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Friction: {friction.toFixed(3)}</label>
          <input
            type="range"
            min="0.95"
            max="0.999"
            step="0.001"
            value={friction}
            onChange={(e) => setFriction(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Ball Speed: {ballSpeed.toFixed(2)}</label>
          <input
            type="range"
            min="0.3"
            max="2.0"
            step="0.01"
            value={ballSpeed}
            onChange={(e) => setBallSpeed(Number(e.target.value))}
          />
        </div>

        {/* Shot controls */}
        <div className="shot-controls">
          <h3>Shot Controls</h3>
          <div className="control-group">
            <label>Angle: {shotAngle}°</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={shotAngle}
              onChange={(e) => setShotAngle(Number(e.target.value))}
            />
          </div>
          <div className="control-group">
            <label>Velocity: {shotVelocity.toFixed(2)}</label>
            <input
              type="range"
              min="0.3"
              max="2.0"
              step="0.01"
              value={shotVelocity}
              onChange={(e) => setShotVelocity(Number(e.target.value))}
            />
          </div>
          <button
            onClick={handleLaunch}
            disabled={selectedBall === null}
            className={selectedBall === null ? 'disabled' : ''}
          >
            Launch Ball
          </button>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={draggingEnabled}
              onChange={(e) => setDraggingEnabled(e.target.checked)}
            />
            Enable Dragging
          </label>
        </div>
      </div>
      <div className="pool-table">
        {pockets.map((pocket) => (
          <div
            key={pocket.id}
            className={`pocket ${selectedPocket === pocket.id ? 'selected' : ''}`}
            style={{
              left: `${pocket.x}%`,
              top: `${pocket.y}%`,
            }}
            onClick={() => handlePocketClick(pocket.id)}
          />
        ))}
        {trajectoryLine && (
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
              x1={`${trajectoryLine.x1}%`}
              y1={`${trajectoryLine.y1}%`}
              x2={`${trajectoryLine.x2}%`}
              y2={`${trajectoryLine.y2}%`}
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
            isSelected={ball.id === selectedBall}
          />
        ))}
      </div>
    </div>
  );
}
