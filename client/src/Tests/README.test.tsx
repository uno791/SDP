// src/Tests/README.test.tsx
import { readFileSync } from 'fs';
import { join } from 'path';

describe('README.md content validation', () => {
  let readmeContent: string;

  beforeAll(() => {
    // Read the README.md file from the project root
    try {
      readmeContent = readFileSync(join(__dirname, '../../../README.md'), 'utf8');
    } catch (error) {
      // Fallback to reading from current directory structure
      readmeContent = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    }
  });

  test('README contains coverage badge with "Coverage:" prefix', () => {
    expect(readmeContent).toContain('Coverage: [![codecov]');
  });

  test('README contains codecov badge with correct URL structure', () => {
    const codecovBadgeRegex = /Coverage:\s*\[!\[codecov\]\(https:\/\/codecov\.io\/gh\/uno791\/SDP\/branch\/main\/graph\/badge\.svg\)\]\(https:\/\/codecov\.io\/gh\/uno791\/SDP\)/;
    expect(readmeContent).toMatch(codecovBadgeRegex);
  });

  test('README contains all required sections', () => {
    // Test that main sections exist
    expect(readmeContent).toContain('Web Server');
    expect(readmeContent).toContain('Documentation');
    expect(readmeContent).toContain('Local Setup');
    expect(readmeContent).toContain('Client');
  });

  test('README contains valid links', () => {
    // Test that the links are present and properly formatted
    expect(readmeContent).toContain('[Web Server](https://sdp-webserver.onrender.com/)');
    expect(readmeContent).toContain('[Document](https://kamallalloo.github.io/SDP-Documentation/)');
  });

  test('README does not contain old codecov badge format without prefix', () => {
    // Ensure we don't have the old format without "Coverage:" prefix
    const oldFormatRegex = /^[![codecov]/m;
    expect(readmeContent).not.toMatch(oldFormatRegex);
  });

  test('README coverage section formatting is correct', () => {
    // Test that the coverage line is properly formatted
    const lines = readmeContent.split('\n');
    const coverageLine = lines.find(line => line.includes('Coverage:'));
    
    expect(coverageLine).toBeDefined();
    expect(coverageLine).toMatch(/^Coverage:\s*\[!\[codecov\]/);
  });

  test('README coverage badge links to correct codecov page', () => {
    // Verify the codecov link points to the right repository
    expect(readmeContent).toContain('(https://codecov.io/gh/uno791/SDP)');
  });

  test('README is not empty and has meaningful content', () => {
    expect(readmeContent.trim().length).toBeGreaterThan(0);
    expect(readmeContent.split('\n').length).toBeGreaterThan(5);
  });
});