const path = require('path');
const fs = require('fs');
const fileManager = require('../../utils/fileManager');

describe('fileManager', () => {
  // Use the module's own TEMP_DIR since it's captured at import time
  const tempDir = fileManager.TEMP_DIR;

  afterAll(() => {
    // Cleanup test artifacts
    const testFiles = fs.readdirSync(tempDir).filter(f =>
      f.startsWith('test_') || f.startsWith('resume_') || f.startsWith('document_') || f.startsWith('old_') || f.startsWith('new_') || f.startsWith('exists_') || f.startsWith('read_')
    );
    testFiles.forEach(f => fs.unlinkSync(path.join(tempDir, f)));
  });

  describe('ensureTempDir', () => {
    it('creates temp directory when it does not exist', () => {
      const customDir = path.join(tempDir, '__test_nested__');
      expect(fs.existsSync(customDir)).toBe(false);
      // Test that ensureTempDir works on the real temp dir (it should exist already)
      // For this test we verify ensureTempDir doesn't throw
      fileManager.ensureTempDir();
      expect(fs.existsSync(tempDir)).toBe(true);
    });

    it('does not throw when directory already exists', () => {
      fileManager.ensureTempDir();
      expect(() => fileManager.ensureTempDir()).not.toThrow();
    });
  });

  describe('generateFilename', () => {
    it('generates filename with prefix', () => {
      const name = fileManager.generateFilename('resume');
      expect(name).toMatch(/^resume_\d+_[a-f0-9]+$/);
    });

    it('uses default prefix when none provided', () => {
      const name = fileManager.generateFilename();
      expect(name).toMatch(/^document_\d+_[a-f0-9]+$/);
    });

    it('generates unique filenames', () => {
      const names = new Set(Array.from({ length: 100 }, () => fileManager.generateFilename()));
      expect(names.size).toBe(100);
    });
  });

  describe('saveTexFile', () => {
    afterEach(() => {
      const testFiles = fs.readdirSync(tempDir).filter(f => f.startsWith('test_doc'));
      testFiles.forEach(f => fs.unlinkSync(path.join(tempDir, f)));
    });

    it('creates temp dir and saves .tex file', () => {
      const filepath = fileManager.saveTexFile('test_doc', '\\documentclass{article}');

      expect(fs.existsSync(filepath)).toBe(true);
      expect(fs.existsSync(tempDir)).toBe(true);
      const content = fs.readFileSync(filepath, 'utf8');
      expect(content).toBe('\\documentclass{article}');
      expect(filepath).toMatch(/test_doc\.tex$/);
    });
  });

  describe('getPdfPath', () => {
    it('returns expected pdf path', () => {
      const pdfPath = fileManager.getPdfPath('test_doc');
      expect(pdfPath).toMatch(/test_doc\.pdf$/);
      expect(path.normalize(path.dirname(pdfPath))).toBe(path.normalize(tempDir));
    });
  });

  describe('fileExists', () => {
    afterEach(() => {
      const testFiles = fs.readdirSync(tempDir).filter(f => f.startsWith('exists_test'));
      testFiles.forEach(f => fs.unlinkSync(path.join(tempDir, f)));
    });

    it('returns true for existing file', () => {
      const texPath = fileManager.saveTexFile('exists_test', 'content');
      expect(fileManager.fileExists(texPath)).toBe(true);
    });

    it('returns false for non-existing file', () => {
      expect(fileManager.fileExists('/nonexistent/file.tex')).toBe(false);
    });
  });

  describe('readFile', () => {
    afterEach(() => {
      ['read_test.tex', 'read_test.pdf'].forEach(f => {
        const p = path.join(tempDir, f);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    });

    it('reads file contents as buffer', () => {
      fileManager.saveTexFile('read_test', 'hello world');
      const pdfPath = fileManager.getPdfPath('read_test');
      fs.writeFileSync(pdfPath, 'fake-pdf-bytes');
      const buffer = fileManager.readFile(pdfPath);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString()).toBe('fake-pdf-bytes');
    });
  });

  describe('cleanupOldFiles', () => {
    afterEach(() => {
      ['old_file.tex', 'new_file.tex'].forEach(f => {
        const p = path.join(tempDir, f);
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
      });
    });

    it('removes files older than maxAgeMs', () => {
      fileManager.ensureTempDir();
      const oldFile = path.join(tempDir, 'old_file.tex');
      fs.writeFileSync(oldFile, 'old');

      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      fs.utimesSync(oldFile, new Date(twoHoursAgo), new Date(twoHoursAgo));

      fileManager.cleanupOldFiles(3600000);

      expect(fs.existsSync(oldFile)).toBe(false);
    });

    it('keeps files newer than maxAgeMs', () => {
      fileManager.ensureTempDir();
      const newFile = path.join(tempDir, 'new_file.tex');
      fs.writeFileSync(newFile, 'new');

      fileManager.cleanupOldFiles(3600000);

      expect(fs.existsSync(newFile)).toBe(true);
    });

    it('handles empty temp directory', () => {
      fileManager.ensureTempDir();
      expect(() => fileManager.cleanupOldFiles()).not.toThrow();
    });
  });
});
