# Testing Strategy for Itinerary Plus

## Overview

This document outlines the testing strategy for the Itinerary Plus application, starting with the `PlaceService` as a foundational example.

## Test Structure

### Unit Tests

- **Location**: `src/**/*.spec.ts`
- **Framework**: Jest with NestJS Testing Module
- **Pattern**: AAA (Arrange, Act, Assert)

### E2E Tests

- **Location**: `test/**/*.e2e-spec.ts`
- **Framework**: Jest with Supertest
- **Purpose**: Integration testing through HTTP endpoints

## Testing Patterns

### 1. Service Testing Pattern (Example: PlaceService)

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let repository: jest.Mocked<RepositoryName>;

  beforeEach(async () => {
    const mockRepository = {
      method1: jest.fn(),
      method2: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: RepositoryName,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    repository = module.get(RepositoryName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

### 2. Test Categories

#### Happy Path Tests

- ✅ Valid input → Expected output
- ✅ Normal operation scenarios
- ✅ Edge cases within valid ranges

#### Validation Tests

- ❌ Invalid input → Error thrown
- ❌ Boundary conditions
- ❌ Required vs optional fields

#### Error Handling Tests

- 🔄 Repository failures
- 🔄 Network errors
- 🔄 Data corruption scenarios

#### Business Logic Tests

- 🧠 Complex algorithms
- 🧠 Data transformations
- 🧠 State management

### Test Statistics

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- src/place/place.service.spec.ts

# Run with coverage
npm run test:cov

# Run with strict coverage (fails if thresholds not met)
npm run test:cov:strict

# Run in watch mode
npm run test:watch
```

### Coverage Requirements

The project enforces **80% minimum coverage** for tested files:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

**Coverage Configuration:**

- Global threshold: 0% (untested files don't fail builds)
- Per-file thresholds: 80% for actively tested services
- Excluded from coverage: modules, entities, DTOs, migrations, config files

**Current Coverage Status:**

- ✅ **PlaceService**: 96.61% statements, 85.36% branches, 100% functions, 96.49% lines
- 🔄 **Other Services**: Coverage requirements will be enforced as tests are added

### E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e test
npm run test:e2e -- test/app.e2e-spec.ts
```

## Best Practices

### 1. Mocking Strategy

- **Repositories**: Always mock for unit tests
- **External Services**: Mock HTTP calls
- **Database**: Use test database for e2e tests
- **Logging**: Consider mocking to reduce noise

### 2. Test Data Management

- **Fixtures**: Use consistent mock data
- **Factories**: Create test data builders
- **Cleanup**: Reset state between tests

### 3. Assertions

- **Specific**: Test exact values, not just truthiness
- **Descriptive**: Use clear assertion messages
- **Complete**: Test all relevant properties

### 4. Test Organization

- **Grouping**: Use `describe` blocks for logical grouping
- **Naming**: Use descriptive test names
- **Comments**: Add context for complex scenarios

## Extending Testing

### Adding Tests for New Services

1. **Create Test File**: `src/service-name/service-name.spec.ts`
2. **Follow Pattern**: Use the established testing pattern
3. **Mock Dependencies**: Mock all external dependencies
4. **Test Categories**: Include happy path, validation, and error tests
5. **Run Tests**: Ensure all tests pass

### Example: Testing a New Service

```typescript
// src/new-service/new-service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NewService } from './new-service';
import { NewRepository } from './new-repository';

describe('NewService', () => {
  let service: NewService;
  let repository: jest.Mocked<NewRepository>;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewService,
        {
          provide: NewRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NewService>(NewService);
    repository = module.get(NewRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mainMethod', () => {
    it('should handle valid input', async () => {
      // Arrange
      const input = {
        /* test data */
      };
      const expected = {
        /* expected result */
      };
      repository.find.mockResolvedValue(expected);

      // Act
      const result = await service.mainMethod(input);

      // Assert
      expect(result).toEqual(expected);
      expect(repository.find).toHaveBeenCalledWith(input);
    });

    it('should throw error for invalid input', async () => {
      // Arrange
      const invalidInput = {
        /* invalid data */
      };

      // Act & Assert
      await expect(service.mainMethod(invalidInput)).rejects.toThrow(
        'Expected error message',
      );
    });
  });
});
```

## Common Testing Scenarios

### 1. Repository Pattern Testing

```typescript
// Mock repository methods
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
};

// Test repository interactions
expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
expect(repository.save).toHaveBeenCalledWith(expectedData);
```

### 2. Validation Testing

```typescript
// Test input validation
expect(() => service.validateData(invalidData)).toThrow('Validation error');

// Test data normalization
const result = service.normalizeData(inputData);
expect(result.name).toBe('Normalized Name');
expect(result.code).toBe('UPPERCASE');
```

### 3. Error Handling Testing

```typescript
// Test repository errors
repository.find.mockRejectedValue(new Error('Database error'));
await expect(service.findData()).rejects.toThrow('User-friendly error message');
```

## Future Enhancements

### 1. Integration Tests

- Test service interactions
- Test with real database
- Test complete workflows

### 2. Performance Tests

- Load testing for sorting algorithms
- Memory usage monitoring
- Response time benchmarks

### 3. Contract Tests

- API contract validation
- Schema validation
- Version compatibility

### 4. Visual Testing

- UI component testing
- Screenshot comparison
- Accessibility testing

## Notes

- The current linter warnings about "unbound methods" are related to Jest mocking and don't affect test functionality
- Consider adding test utilities for common patterns (e.g., mock data factories)
- Future services should follow the same testing patterns established here
