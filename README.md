# SportPesa Mega Jackpot Predictor

An interactive analyzer, permutation builder, and AI-powered prediction generator for the 17-match SportPesa Mega Jackpot.

## Features

- **Interactive Match Analyzer**: View detailed statistics and analysis for each jackpot match
- **AI-Powered Predictions**: Leverages Google Gemini AI for intelligent match outcome predictions
- **Permutation Builder**: Build and manage multiple betting combinations
- **Historical Backtesting**: Analyze past performance with comprehensive backtest data
- **Odds Tracker**: Track and compare odds across different matches
- **Team Strength Heatmap**: Visual representation of team strengths
- **Head-to-Head Analysis**: Detailed H2H goal difference charts using D3.js
- **Form Sparklines**: Visual team form indicators
- **Payout Probability Estimator**: Estimate potential returns based on selections

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Express.js, Node.js
- **Styling**: Tailwind CSS 4, Motion (Framer Motion)
- **Visualization**: D3.js
- **UI Components**: Lucide React icons
- **AI Integration**: Google Generative AI (Gemini)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Google Gemini API key (for AI features)
- Firebase project configuration (optional, for data persistence)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `GEMINI_API_KEY`: Required for AI-powered predictions
- `APP_URL`: The URL where the application is hosted
- Optional fallback AI engine keys (DeepSeek, Grok, Perplexity)

## Development

Start the development server:

```bash
npm run dev
```

This will start both the Vite development server and the Express backend on port 3000.

## Building for Production

Build the application:

```bash
npm run build
```

This will:
1. Build the frontend using Vite
2. Bundle the server using esbuild

## Running in Production

Start the production server:

```bash
npm run start
```

Or clean and rebuild:

```bash
npm run clean
npm run build
npm run start
```

## Project Structure

```
├── src/
│   ├── components/       # React components
│   │   ├── AIBacktestTrendChart.tsx
│   │   ├── D3BarChart.tsx
│   │   ├── D3H2HGoalDiffChart.tsx
│   │   ├── D3LineChart.tsx
│   │   ├── FormSparkline.tsx
│   │   ├── Header.tsx
│   │   ├── JackpotTable.tsx
│   │   ├── OddsTrackerModal.tsx
│   │   ├── PasteTextModal.tsx
│   │   ├── PayoutProbabilityEstimator.tsx
│   │   ├── ScreenshotUploadModal.tsx
│   │   ├── SlipComparisonModal.tsx
│   │   ├── TeamLogo.tsx
│   │   ├── TeamNameH2HCard.tsx
│   │   └── TeamStrengthHeatmap.tsx
│   ├── data/            # Static data files
│   ├── lib/             # Utility libraries
│   ├── utils/           # Helper functions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── types.ts         # TypeScript type definitions
│   ├── mockData.ts      # Mock data for development
│   └── historicalBacktestData.ts  # Historical backtest data
├── server.ts            # Express backend server
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── firebase-applet-config.json  # Firebase configuration
├── firestore.rules      # Firestore security rules
└── package.json         # Dependencies and scripts
```

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/matches` - Retrieve current jackpot matches
- `POST /api/matches/scrape` - Scrape/refresh SportPesa Mega Jackpot data
- Additional endpoints for AI predictions and analysis

## Firebase Configuration

The project includes Firebase configuration for:
- Authentication
- Firestore database
- Storage

Configuration is stored in `firebase-applet-config.json`. Update this with your Firebase project credentials if needed.

## Security

- Firestore security rules are defined in `firestore.rules`
- Environment variables should never be committed to version control
- API keys are managed through the Secrets panel in AI Studio

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Type-check TypeScript files |

## License

SPDX-License-Identifier: Apache-2.0

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to ensure type safety
5. Submit a pull request

## Support

For issues and questions, please open an issue in the repository.
