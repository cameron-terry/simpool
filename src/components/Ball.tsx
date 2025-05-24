import React, { useRef } from 'react';

interface BallProps {
  number: number;
  color: string;
  x: number;
  y: number;
  radius: number;
  onDrag: (x: number, y: number) => void;
  draggingEnabled: boolean;
  onClick: () => void;
  isSelected: boolean;
}

export function Ball({
  number,
  color,
  x,
  y,
  radius,
  onDrag,
  draggingEnabled,
  onClick,
  isSelected,
}: BallProps) {
  const emptyImage = useRef<HTMLImageElement | null>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  // Create an empty image element once
  React.useEffect(() => {
    emptyImage.current = new Image();
    emptyImage.current.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }, []);

  // Calculate actual pixel size based on table height
  React.useEffect(() => {
    if (ballRef.current) {
      const table = ballRef.current.parentElement;
      if (table) {
        const tableHeight = table.clientHeight;
        const ballSize = (tableHeight * radius * 2) / 100; // Convert percentage to pixels
        ballRef.current.style.width = `${ballSize}px`;
        ballRef.current.style.height = `${ballSize}px`;
      }
    }
  }, [radius]);

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
      ref={ballRef}
      className={`ball ${isSelected ? 'selected' : ''}`}
      draggable={draggingEnabled}
      onDragStart={draggingEnabled ? handleDragStart : undefined}
      onDrag={draggingEnabled ? handleDrag : undefined}
      onDragOver={draggingEnabled ? handleDragOver : undefined}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: color,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        cursor: draggingEnabled ? 'move' : 'pointer',
        userSelect: 'none',
        boxShadow: isSelected
          ? 'inset -2px -2px 4px rgba(0,0,0,0.2), 0 0 0 2px white, 0 0 0 4px #4CAF50'
          : 'inset -2px -2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <span
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1em',
          textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}
      >
        {number}
      </span>
    </div>
  );
}
