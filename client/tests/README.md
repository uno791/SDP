# Client Tests Directory

This directory contains unit tests for the client application.

## Purpose

The `.keep` file in this directory ensures that the `tests/` folder is maintained in version control even when empty. This establishes a consistent location for test files separate from the existing `src/Tests/` directory.

## Directory Structure

```
client/tests/
├── .keep                           # Maintains directory in version control
├── README.md                       # This documentation file
├── directory-structure.test.ts     # Tests for directory infrastructure
├── jest-config-integration.test.ts # Tests for Jest configuration
└── example-test-template.test.ts   # Template and examples for future tests
```

## Usage Guidelines

### Test File Naming
- Use `.test.ts` or `.test.js` suffix for test files
- Use `.spec.ts` or `.spec.js` suffix for specification files
- Name files descriptively to indicate what is being tested

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain expected behavior
- Follow the Arrange-Act-Assert pattern in test implementations

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Integration with Existing Tests

This directory complements the existing `src/Tests/` directory and follows the same Jest configuration defined in `jest.config.js`.