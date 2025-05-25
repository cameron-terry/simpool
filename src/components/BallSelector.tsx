import type { BallColor } from '../types/pool';

interface BallSelectorProps {
  balls: BallColor[];
  selectedBall: number;
  onSelectBall: (index: number) => void;
}

export function BallSelector({ balls, selectedBall, onSelectBall }: BallSelectorProps) {
  return (
    <div className="ball-selector-grid">
      {balls.map((ball, index) => (
        <div
          key={`${ball.type}-${ball.color}`}
          className={`ball-selector-item ${selectedBall === index ? 'selected' : ''}`}
          onClick={() => onSelectBall(index)}
          style={{
            backgroundColor: ball.color,
            position: 'relative',
          }}
        >
          {index !== 0 && <span className="ball-selector-number">{index}</span>}
          {ball.type === 'stripe' && <div className="ball-stripe" />}
        </div>
      ))}
    </div>
  );
}
