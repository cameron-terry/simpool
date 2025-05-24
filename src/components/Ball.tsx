import React from 'react';

interface BallProps {
  number: number;
  color: string;
  x: number;
  y: number;
}

export function Ball({ number, color, x, y }: BallProps) {
  return (
    <div
      className="ball"
      style={{
        backgroundColor: color,
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      <span className="ball-number">{number}</span>
    </div>
  );
}
