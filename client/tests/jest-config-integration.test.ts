import * as fs from 'fs';
import * as path from 'path';

describe('Jest Configuration Integration', () => {
  const clientDir = path.join(__dirname, '..');
  const jestConfigPath = path.join(clientDir, 'jest.config.js');
  const testsDir = path.join(__dirname);

  it('should have jest configuration file present', () => {
    expect(fs.existsSync(jestConfigPath)).toBe(true);
  });

  it('should be able to locate test files in the tests directory', () => {
    // This test verifies that Jest can discover test files in the /tests directory
    const testFiles = fs.readdirSync(testsDir).filter(file => 
      file.endsWith('.test.ts') || file.endsWith('.test.js') || 
      file.endsWith('.spec.ts') || file.endsWith('.spec.js')
    );
    
    expect(testFiles.length).toBeGreaterThan(0);
    expect(testFiles).toContain('directory-structure.test.ts');
  });

  it('should have proper test environment setup for this directory', () => {
    // Verify that the test environment is properly configured
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });
});
