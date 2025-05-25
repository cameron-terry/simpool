import React, { useState } from 'react';
import type {
  PhysicsState,
  ShotState,
  BallCreationState,
  GameMode,
  GolfGameState,
} from '../types/pool';
import { POOL_BALL_COLORS } from '../config/pool';
import { BallSelector } from './BallSelector';
import { GameModeIcon } from './GameModeIcon';

interface ControlPanelProps {
  physics: PhysicsState;
  shot: ShotState;
  ballCreation: BallCreationState;
  onPhysicsChange: (key: keyof PhysicsState, value: number) => void;
  onShotChange: (key: keyof ShotState, value: number) => void;
  onBallCreationChange: (key: keyof BallCreationState, value: number | string) => void;
  onAddCustomBall: () => void;
  onAddPresetBall: (presetIndex: number) => void;
  onAddRandomBall: () => void;
  onLaunch: () => void;
  draggingEnabled: boolean;
  onDraggingToggle: (enabled: boolean) => void;
  onRack: () => void;
  autoSelectCueBall: boolean;
  onAutoSelectCueBallToggle: (enabled: boolean) => void;
  gameMode: GameMode;
  onGameModeToggle: (mode: GameMode) => void;
  golfState: GolfGameState;
}

type BallCreationMode = 'preset' | 'custom';

export function ControlPanel({
  physics,
  shot,
  ballCreation,
  onPhysicsChange,
  onShotChange,
  onBallCreationChange,
  onAddCustomBall,
  onAddPresetBall,
  onAddRandomBall,
  onLaunch,
  draggingEnabled,
  onDraggingToggle,
  onRack,
  autoSelectCueBall,
  onAutoSelectCueBallToggle,
  gameMode,
  onGameModeToggle,
  golfState,
}: ControlPanelProps) {
  const [ballCreationMode, setBallCreationMode] = useState<BallCreationMode>('preset');
  const [selectedPresetBall, setSelectedPresetBall] = useState<number>(0);
  const [showSandbox, setShowSandbox] = useState(false);

  const handleAddBall = () => {
    if (ballCreationMode === 'preset') {
      onAddPresetBall(selectedPresetBall);
    } else {
      onAddCustomBall();
    }
  };

  // Filter out cue ball for custom mode
  const availableBalls =
    ballCreationMode === 'preset'
      ? POOL_BALL_COLORS
      : POOL_BALL_COLORS.filter((ball) => ball.type !== 'solid' || ball.color !== '#FFFFFF');

  return (
    <div className="control-panel">
      <div className="game-mode-controls">
        <h3>Game Mode</h3>
        <div className="control-group">
          <label className="toggle-label">
            <span className={`mode-label ${gameMode === 'normal' ? 'active' : ''}`}>
              <GameModeIcon mode="normal" className="mode-icon" />
              Normal
            </span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={gameMode === 'golf'}
                onChange={(e) => onGameModeToggle(e.target.checked ? 'golf' : 'normal')}
              />
              <span className="toggle-slider"></span>
            </div>
            <span className={`mode-label ${gameMode === 'golf' ? 'active' : ''}`}>
              <GameModeIcon mode="golf" className="mode-icon" />
              Golf
            </span>
          </label>
        </div>
      </div>

      {gameMode === 'normal' && (
        <div className="ball-creation-controls">
          <h3>Game Controls</h3>
          <button onClick={onRack} style={{ marginBottom: '10px' }}>
            Rack
          </button>
          <div className="control-group">
            <label className="toggle-label">
              <span className={ballCreationMode === 'preset' ? 'active' : ''}>Preset</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={ballCreationMode === 'custom'}
                  onChange={(e) => setBallCreationMode(e.target.checked ? 'custom' : 'preset')}
                />
                <span className="toggle-slider"></span>
              </div>
              <span className={ballCreationMode === 'custom' ? 'active' : ''}>Custom</span>
            </label>
          </div>

          {ballCreationMode === 'preset' ? (
            <div className="control-group">
              <BallSelector
                balls={availableBalls}
                selectedBall={selectedPresetBall}
                onSelectBall={setSelectedPresetBall}
              />
            </div>
          ) : (
            <div className="control-group">
              <div className="custom-ball-inputs">
                <input
                  type="number"
                  value={ballCreation.newBallNumber}
                  onChange={(e) => onBallCreationChange('newBallNumber', Number(e.target.value))}
                  min="1"
                  placeholder="Number"
                  className="ball-number-input"
                />
                <input
                  type="color"
                  value={ballCreation.newBallColor}
                  onChange={(e) => onBallCreationChange('newBallColor', e.target.value)}
                  className="ball-color-input"
                />
              </div>
            </div>
          )}
          <button onClick={handleAddBall}>
            {ballCreationMode === 'preset' ? 'Preset' : 'Custom'}
          </button>
          <button onClick={onAddRandomBall}>Random</button>
        </div>
      )}

      {gameMode === 'golf' && (
        <div className="golf-controls">
          <h3>Golf Mode</h3>
          <p>Clear all balls (except cue ball) in as few shots as possible!</p>
          <button onClick={onRack} disabled={golfState.isActive && !golfState.isComplete}>
            New Game
          </button>
        </div>
      )}

      <div className="shot-controls">
        <h3>Shot Controls</h3>
        <div className="control-group">
          <label>Angle: {shot.shotAngle.toFixed(1)}°</label>
          <input
            type="range"
            min="-360"
            max="360"
            step="0.1"
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
          className={`launch-button ${shot.selectedBall === null ? 'disabled' : ''}`}
        >
          Launch
        </button>
      </div>

      <div className="control-group">
        <label className="toggle-label">
          <span>Sandbox</span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={showSandbox}
              onChange={(e) => setShowSandbox(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </div>
        </label>
      </div>

      {showSandbox && (
        <div className="sandbox-controls">
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
          <div className="control-group">
            <label className="toggle-label">
              <span>Auto-select Cue Ball</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoSelectCueBall}
                  onChange={(e) => onAutoSelectCueBallToggle(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
          <div className="control-group sandbox-footer">
            <label className="toggle-label">
              <span>Enable Dragging</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={draggingEnabled}
                  onChange={(e) => onDraggingToggle(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
