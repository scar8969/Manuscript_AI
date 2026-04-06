const { scrapeJob } = require('../../services/scraperService');

jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

const { spawn } = require('child_process');

describe('scraperService', () => {
  beforeEach(() => {
    spawn.mockReset();
  });

  function createMockChild(stdout, stderr, code) {
    const child = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };

    child.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') cb(Buffer.from(stdout));
    });
    child.stderr.on.mockImplementation((event, cb) => {
      if (event === 'data') cb(Buffer.from(stderr));
    });
    child.on.mockImplementation((event, cb) => {
      if (event === 'close') {
        setTimeout(() => cb(code), 10);
      }
      if (event === 'error') {
        // not triggering error by default
      }
    });

    return child;
  }

  it('spawns python3 with main.py and url argument', async () => {
    const mockChild = createMockChild('{"job": {"title": "Engineer"}}', '', 0);
    spawn.mockReturnValue(mockChild);

    await scrapeJob('https://example.com/jobs/123');

    expect(spawn).toHaveBeenCalledWith(
      'python3',
      expect.arrayContaining([expect.stringContaining('main.py'), 'https://example.com/jobs/123'])
    );
  });

  it('resolves with parsed JSON on success', async () => {
    const result = { job: { title: 'Senior Engineer', company: 'Acme' } };
    const mockChild = createMockChild(JSON.stringify(result), '', 0);
    spawn.mockReturnValue(mockChild);

    const data = await scrapeJob('https://example.com/job');

    expect(data).toEqual(result);
  });

  it('rejects with SCRAPE_FAILED when scraper exits non-zero', async () => {
    const mockChild = createMockChild('', 'Traceback error', 1);
    spawn.mockReturnValue(mockChild);

    await expect(scrapeJob('https://bad.com')).rejects.toEqual(
      expect.objectContaining({
        type: 'SCRAPE_FAILED',
        message: 'Scraper failed'
      })
    );
  });

  it('rejects with SCRAPE_FAILED when output is not valid JSON', async () => {
    const mockChild = createMockChild('not json at all', '', 0);
    spawn.mockReturnValue(mockChild);

    await expect(scrapeJob('https://example.com')).rejects.toEqual(
      expect.objectContaining({
        type: 'SCRAPE_FAILED',
        message: 'Failed to parse scraper output'
      })
    );
  });

  it('rejects with SCRAPE_FAILED when python3 fails to start', async () => {
    const child = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, cb) => {
        if (event === 'error') {
          setTimeout(() => cb(new Error('python3 not found')), 10);
        }
      }),
      kill: jest.fn()
    };
    child.stdout.on.mockImplementation(() => {});
    child.stderr.on.mockImplementation(() => {});
    spawn.mockReturnValue(child);

    await expect(scrapeJob('https://example.com')).rejects.toEqual(
      expect.objectContaining({
        type: 'SCRAPE_FAILED',
        message: 'Failed to start scraper'
      })
    );
  });

  it('times out after 30 seconds', async () => {
    // Create a child that never closes
    const child = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(() => {}),
      kill: jest.fn()
    };
    child.stdout.on.mockImplementation(() => {});
    child.stderr.on.mockImplementation(() => {});
    spawn.mockReturnValue(child);

    jest.useFakeTimers();
    const promise = scrapeJob('https://slow.com');

    jest.advanceTimersByTime(30000);

    await expect(promise).rejects.toEqual(
      expect.objectContaining({
        type: 'SCRAPE_FAILED',
        message: 'Scraper timed out after 30 seconds'
      })
    );
    expect(child.kill).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
