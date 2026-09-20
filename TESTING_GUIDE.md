# Testing Guide

## Overview

This project uses [Vitest](https://vitest.dev/) as the testing framework, configured with Vite for fast unit testing.

## Test Files

### Unit Tests Created

1. **`src/utils/matchDetails.test.ts`** (10 tests)
   - Tests for `getMatchExtraDetails()` function
   - Validates stadium mappings, referee assignments, weather data
   - Ensures deterministic behavior based on match ID

2. **`src/data/leagueData.test.ts`** (14 tests)
   - Tests for `getLeagueStats()` function
   - Validates league standings generation
   - Tests team placement, top scorers, form data
   - Verifies points calculation accuracy

3. **`src/utils/calculations.test.ts`** (24 tests)
   - Match date parsing
   - Odds probability calculations
   - Slip combination calculations
   - Form string parsing
   - Match result determination
   - Jackpot bonus tier calculations

**Total: 48 tests across 3 test files**

## Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage Goals

- **Current Coverage**: Core utility functions tested
- **Target**: >80% code coverage
- **Critical Paths**: 100% coverage (betting calculations, data parsing)

## Writing New Tests

### Test File Naming Convention

Test files should be named with `.test.ts` or `.test.tsx` suffix and placed alongside the source file they test:

```
src/
  utils/
    matchDetails.ts
    matchDetails.test.ts  ← Test file
  data/
    leagueData.ts
    leagueData.test.ts    ← Test file
```

### Example Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './yourModule';

describe('yourFunction', () => {
  it('should do something specific', () => {
    const result = yourFunction(input);
    expect(result).toBe(expectedValue);
  });
});
```

## Testing Best Practices

1. **Test Edge Cases**: Empty inputs, null values, boundary conditions
2. **Mock External Dependencies**: Firebase, API calls should be mocked
3. **Keep Tests Independent**: Each test should run in isolation
4. **Use Descriptive Names**: Test names should describe expected behavior
5. **Test Both Success and Failure Cases**

## Component Testing (Future)

React components can be tested using:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

Example component test:

```typescript
import { render, screen } from '@testing-library/react';
import D3BarChart from './D3BarChart';

describe('D3BarChart', () => {
  it('renders chart with correct stats', () => {
    render(<D3BarChart stats={{'1': 50, 'X': 30, '2': 20}} labels={{'1': 'Home', 'X': 'Draw', '2': 'Away'}} />);
    // Assertions...
  });
});
```

## Integration Testing (Future)

For API endpoint testing:

```typescript
import request from 'supertest';
import app from '../server';

describe('API Endpoints', () => {
  it('GET /api/matches returns matches', async () => {
    const response = await request(app).get('/api/matches');
    expect(response.status).toBe(200);
    expect(response.body.matches).toBeDefined();
  });
});
```

## Continuous Integration

Tests should pass before:
- Merging pull requests
- Deploying to production
- Releasing new versions

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Ensure imports use correct relative paths
   - Check file extensions (.ts vs .tsx)

2. **Firebase initialization errors in tests**
   - Mock Firebase modules for unit tests
   - Use environment variables for test configuration

3. **DOM-related errors**
   - Ensure jsdom environment is configured (already set in vite.config.ts)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [TypeScript Testing Best Practices](https://www.typescriptlang.org/docs/handbook/testing.html)
