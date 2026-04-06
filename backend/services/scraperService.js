const { spawn } = require('child_process');
const path = require('path');

function scrapeJob(url) {
  return new Promise((resolve, reject) => {
    const scraperPath = path.join(__dirname, '..', 'scraper', 'main.py');

    const child = spawn('python3', [scraperPath, url]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject({
          type: 'SCRAPE_FAILED',
          message: 'Scraper failed',
          details: stderr
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject({
          type: 'SCRAPE_FAILED',
          message: 'Failed to parse scraper output',
          details: e.message
        });
      }
    });

    child.on('error', (err) => {
      reject({
        type: 'SCRAPE_FAILED',
        message: 'Failed to start scraper',
        details: err.message
      });
    });

    setTimeout(() => {
      child.kill();
      reject({
        type: 'SCRAPE_FAILED',
        message: 'Scraper timed out after 30 seconds'
      });
    }, 30000);
  });
}

module.exports = {
  scrapeJob
};