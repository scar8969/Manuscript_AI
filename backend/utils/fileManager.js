const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = process.env.TEMP_DIR || './temp';

function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

function generateFilename(prefix = 'document') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

function saveTexFile(filename, content) {
  ensureTempDir();
  const filepath = path.join(TEMP_DIR, `${filename}.tex`);
  fs.writeFileSync(filepath, content, 'utf8');
  return filepath;
}

function getPdfPath(filename) {
  return path.join(TEMP_DIR, `${filename}.pdf`);
}

function fileExists(filepath) {
  return fs.existsSync(filepath);
}

function readFile(filepath) {
  return fs.readFileSync(filepath);
}

function cleanupOldFiles(maxAgeMs = 3600000) {
  ensureTempDir();
  const files = fs.readdirSync(TEMP_DIR);
  const now = Date.now();

  files.forEach(file => {
    const filepath = path.join(TEMP_DIR, file);
    const stats = fs.statSync(filepath);
    if (now - stats.mtimeMs > maxAgeMs) {
      fs.unlinkSync(filepath);
    }
  });
}

module.exports = {
  ensureTempDir,
  generateFilename,
  saveTexFile,
  getPdfPath,
  fileExists,
  readFile,
  cleanupOldFiles,
  TEMP_DIR
};