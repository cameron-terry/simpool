import React from 'react';
import type { PhysicsState, ShotState, BallCreationState } from '../types/pool';
import { POOL_BALL_COLORS } from '../config/pool';

interface ControlPanelProps {
  physics: PhysicsState;
  shot: ShotState;
  ballCreation: BallCreationState;
  onPhysicsChange: (key: keyof PhysicsState, value: number) => void;
  onShotChange: (key: keyof ShotState, value: number) => void;
  onBallCreationChange: (key: keyof BallCreationState, value: number | string) => void;
  onAddCustomBall: () => void;
  onAddRandomBall: () => void;
  onLaunch: () => void;
  draggingEnabled: boolean;
  onDraggingToggle: (enabled: boolean) => void;
}

export function ControlPanel({
  physics,
  shot,
  ballCreation,
  onPhysicsChange,
  onShotChange,
  onBallCreationChange,
  onAddCustomBall,
  onAddRandomBall,
  onLaunch,
  draggingEnabled,
  onDraggingToggle,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      <div className="ball-creation-controls">
        <h3>Add Ball</h3>
        <div className="control-group">
          <label>Number:</label>
          <input
            type="number"
            value={ballCreation.newBallNumber}
            onChange={(e) => onBallCreationChange('newBallNumber', Number(e.target.value))}
            min="1"
          />
        </div>
        <div className="control-group">
          <label>Color:</label>
          <div className="color-picker-container">
            <input
              type="color"
              value={ballCreation.newBallColor}
              onChange={(e) => onBallCreationChange('newBallColor', e.target.value)}
            />
            <select
              value={ballCreation.newBallColor}
              onChange={(e) => onBallCreationChange('newBallColor', e.target.value)}
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
        <button onClick={onAddCustomBall}>Add Stationary Ball</button>
        <button onClick={onAddRandomBall}>Add Random Ball</button>
      </div>

      <div className="control-group">
        <label>Ball Radius: {physics.ballRadius.toFixed(1)}%</label>
        <input
          type="range"
          min="1"
          max="5"
          step="0.1"
          value={physics.ballRadius}
          onChange={(e) => onPhysicsChange('ballRadius', Number(e.target.value))}
        />
      </div>
      <div className="control-group">
        <label>Friction: {physics.friction.toFixed(3)}</label>
        <input
          type="range"
          min="0.95"
          max="0.999"
          step="0.001"
          value={physics.friction}
          onChange={(e) => onPhysicsChange('friction', Number(e.target.value))}
        />
      </div>
      <div className="control-group">
        <label>Ball Speed: {physics.ballSpeed.toFixed(2)}</label>
        <input
          type="range"
          min="0.3"
          max="2.0"
          step="0.01"
          value={physics.ballSpeed}
          onChange={(e) => onPhysicsChange('ballSpeed', Number(e.target.value))}
        />
      </div>

      <div className="shot-controls">
        <h3>Shot Controls</h3>
        <div className="control-group">
          <label>Angle: {shot.shotAngle}°</label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={shot.shotAngle}
            onChange={(e) => onShotChange('shotAngle', Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Velocity: {shot.shotVelocity.toFixed(2)}</label>
          <input
            type="range"
            min="0.3"
            max="2.0"
            step="0.01"
            value={shot.shotVelocity}
            onChange={(e) => onShotChange('shotVelocity', Number(e.target.value))}
          />
        </div>
        <button
          onClick={onLaunch}
          disabled={shot.selectedBall === null}
          className={shot.selectedBall === null ? 'disabled' : ''}
        >
          Launch Ball
        </button>
      </div>

      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={draggingEnabled}
            onChange={(e) => onDraggingToggle(e.target.checked)}
          />
          Enable Dragging
        </label>
      </div>
    </div>
  );
}
