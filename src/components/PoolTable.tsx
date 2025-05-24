import React, { useState } from 'react';
import '../styles/PoolTable.css';

interface Pocket {
  id: number;
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

  const handlePocketClick = (pocketId: number) => {
    setSelectedPocket(pocketId === selectedPocket ? null : pocketId);
  };

  return (
    <div className="pool-table-container">
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
      </div>
    </div>
  );
}
