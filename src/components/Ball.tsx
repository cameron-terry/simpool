import React, { useRef } from 'react';

interface BallProps {
  number: number;
  color: string;
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
}

export function Ball({ number, color, x, y, onDrag }: BallProps) {
  const emptyImage = useRef<HTMLImageElement | null>(null);

  // Create an empty image element once
  React.useEffect(() => {
    emptyImage.current = new Image();
    emptyImage.current.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (emptyImage.current) {
      e.dataTransfer.setDragImage(emptyImage.current, 0, 0);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.clientX === 0 && e.clientY === 0) return;

    const table = e.currentTarget.parentElement;
    if (!table) return;

    const rect = table.getBoundingClientRect();
    const newX = ((e.clientX - rect.left) / rect.width) * 100;
    const newY = ((e.clientY - rect.top) / rect.height) * 100;

    onDrag(newX, newY);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      className="ball"
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragOver={handleDragOver}
      style={{
        backgroundColor: color,
        left: `${x}%`,
        top: `${y}%`,
        cursor: 'move',
        userSelect: 'none',
      }}
    >
      <span className="ball-number">{number}</span>
    </div>
  );
}
