import React, { useState } from 'react';
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
}

const pockets: Pocket[] = [
  { id: 1, x: 0, y: 0 }, // Top left
  { id: 2, x: 50, y: 0 }, // Top middle
  { id: 3, x: 100, y: 0 }, // Top right
  { id: 4, x: 0, y: 100 }, // Bottom left
  { id: 5, x: 50, y: 100 }, // Bottom middle
  { id: 6, x: 100, y: 100 }, // Bottom right
];

export function PoolTable() {
  const [selectedPocket, setSelectedPocket] = useState<number | null>(null);
  const [balls, setBalls] = useState<PoolBall[]>([]);
  const [newBallNumber, setNewBallNumber] = useState<number>(1);
  const [newBallColor, setNewBallColor] = useState<string>('#ff0000');
  const [nextBallId, setNextBallId] = useState<number>(1);

  const handlePocketClick = (pocketId: number) => {
    setSelectedPocket(pocketId === selectedPocket ? null : pocketId);
  };

  const getRandomPosition = () => {
    // Keep balls away from the edges and pockets
    const margin = 10; // percentage from edges
    const x = margin + Math.random() * (100 - 2 * margin);
    const y = margin + Math.random() * (100 - 2 * margin);
    return { x, y };
  };

  const handleAddBall = () => {
    const { x, y } = getRandomPosition();
    const newBall: PoolBall = {
      id: nextBallId,
      number: newBallNumber,
      color: newBallColor,
      x,
      y,
    };
    setBalls([...balls, newBall]);
    setNextBallId(nextBallId + 1);
    setNewBallNumber(newBallNumber + 1);
  };

  return (
    <div className="pool-table-container">
      <div className="control-panel">
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
          <input
            type="color"
            value={newBallColor}
            onChange={(e) => setNewBallColor(e.target.value)}
          />
        </div>
        <button onClick={handleAddBall}>Add Ball</button>
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
        {balls.map((ball) => (
          <Ball key={ball.id} number={ball.number} color={ball.color} x={ball.x} y={ball.y} />
        ))}
      </div>
    </div>
  );
}
