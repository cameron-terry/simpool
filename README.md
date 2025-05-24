# SimPool - Web-Based Billiards Simulator

A lightweight web-based billiards (pool) simulator built with TypeScript and HTML Canvas. This project implements basic 2D physics for ball movement and collisions, focusing on a clean, simple implementation without spin mechanics.

## Features

- 🎱 Realistic ball physics with elastic collisions
- 🎯 Click-and-drag cue aiming system
- 🎨 Clean, modern UI with HTML Canvas rendering
- 📊 Basic scoring and shot tracking
- 🎮 Simple controls for an intuitive gaming experience

## Tech Stack

- **Frontend**: TypeScript + HTML Canvas
- **Build Tool**: Vite
- **Physics**: Custom 2D vector math implementation
- **Framework**: Vanilla TypeScript (no framework dependencies)

## Core Implementation

The simulator implements the following key components:

1. **Ball Physics**

   - Position and velocity vectors
   - Elastic collisions between balls
   - Wall boundary collisions
   - Friction/damping simulation

2. **Game Mechanics**

   - Cue ball control with power-based shooting
   - Pocket detection
   - Basic scoring system

3. **Rendering**
   - Canvas-based graphics
   - Smooth animation using requestAnimationFrame
   - Visual feedback for aiming and power

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/simpool.git
   cd simpool
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
simpool/
├── src/
│   ├── components/     # Game components (Ball, Table, etc.)
│   ├── physics/       # Physics calculations and collision detection
│   ├── utils/         # Utility functions and helpers
│   ├── types/         # TypeScript type definitions
│   ├── main.ts        # Entry point
│   └── style.css      # Global styles
├── public/            # Static assets
├── index.html         # Main HTML file
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Project dependencies and scripts
```

## Future Enhancements

- [ ] Sound effects for collisions and pocket drops
- [ ] Shot trajectory preview
- [ ] Multiplayer support
- [ ] Additional game modes (8-ball, 9-ball)
- [ ] Advanced physics (spin, english)
- [ ] Score tracking and statistics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.
