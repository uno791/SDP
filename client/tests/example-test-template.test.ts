// This file serves as a template and example for future tests in this directory

describe('Example Test Template', () => {
  beforeAll(() => {
    // Setup that runs once before all tests in this suite
  });

  beforeEach(() => {
    // Setup that runs before each individual test
  });

  afterEach(() => {
    // Cleanup that runs after each individual test
  });

  afterAll(() => {
    // Cleanup that runs once after all tests in this suite
  });

  describe('Basic Test Patterns', () => {
    it('should demonstrate a simple assertion', () => {
      const result = 1 + 1;
      expect(result).toBe(2);
    });

    it('should demonstrate async test handling', async () => {
      const promise = Promise.resolve('test');
      const result = await promise;
      expect(result).toBe('test');
    });

    it('should demonstrate error testing', () => {
      expect(() => {
        throw new Error('Test error');
      }).toThrow('Test error');
    });
  });

  describe('Testing Best Practices', () => {
    it('should have descriptive test names that explain the expected behavior', () => {
      expect(true).toBe(true);
    });
  });
});
