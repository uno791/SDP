import * as fs from 'fs';
import * as path from 'path';

describe('Tests Directory Structure', () => {
  const testsDir = path.join(__dirname);
  const keepFile = path.join(testsDir, '.keep');

  it('should have the tests directory accessible', () => {
    expect(fs.existsSync(testsDir)).toBe(true);
    expect(fs.statSync(testsDir).isDirectory()).toBe(true);
  });

  it('should contain the .keep file to maintain directory in version control', () => {
    expect(fs.existsSync(keepFile)).toBe(true);
    expect(fs.statSync(keepFile).isFile()).toBe(true);
  });

  it('should have .keep file be empty as expected', () => {
    const keepFileContent = fs.readFileSync(keepFile, 'utf8');
    expect(keepFileContent).toBe('');
  });

  it('should have proper directory permissions for test file creation', () => {
    const stats = fs.statSync(testsDir);
    expect(stats.mode & parseInt('777', 8)).toBeGreaterThan(0);
  });
});
