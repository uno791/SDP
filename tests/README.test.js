const fs = require('fs');
const path = require('path');

describe('README.md', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  });

  describe('Coverage badge', () => {
    test('should contain codecov badge with "Coverage:" prefix', () => {
      const expectedBadgePattern = /Coverage: \[\!\[codecov\]\(https:\/\/codecov\.io\/gh\/uno791\/SDP\/branch\/main\/graph\/badge\.svg\)\]\(https:\/\/codecov\.io\/gh\/uno791\/SDP\)/;
      expect(readmeContent).toMatch(expectedBadgePattern);
    });

    test('should contain the exact codecov badge URL', () => {
      expect(readmeContent).toContain('https://codecov.io/gh/uno791/SDP/branch/main/graph/badge.svg');
    });

    test('should contain the exact codecov link URL', () => {
      expect(readmeContent).toContain('https://codecov.io/gh/uno791/SDP');
    });

    test('should have "Coverage:" text before codecov badge', () => {
      const coverageLineRegex = /Coverage: .*codecov/;
      expect(readmeContent).toMatch(coverageLineRegex);
    });

    test('should not contain orphaned codecov badge without "Coverage:" prefix', () => {
      const orphanedBadgePattern = /^(?!.*Coverage: )\[\!\[codecov\]/m;
      expect(readmeContent).not.toMatch(orphanedBadgePattern);
    });
  });

  describe('README structure', () => {
    test('should contain Web Server link in table', () => {
      expect(readmeContent).toContain('| Web Server | [Web Server](https://sdp-webserver.onrender.com/)');
    });

    test('should contain Documentation link in table', () => {
      expect(readmeContent).toContain('| Documentation | [Document](https://kamallalloo.github.io/SDP-Documentation/)');
    });
  });
});
