const { compileLatex } = require('../../services/latexService');
const fileManager = require('../../utils/fileManager');
const path = require('path');
const fs = require('fs');

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

const { exec } = require('child_process');

describe('latexService', () => {
  const tempDir = fileManager.TEMP_DIR;

  afterEach(() => {
    exec.mockReset();
    // Cleanup any test files
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(f => {
        if (f.startsWith('resume_')) {
          const p = path.join(tempDir, f);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }
      });
    } catch {}
  });

  it('resolves with pdfPath when compilation succeeds', async () => {
    const texContent = '\\documentclass{article}\n\\begin{document}\nHello\n\\end{document}';

    exec.mockImplementation((cmd, opts, callback) => {
      // Create the expected PDF file
      const match = cmd.match(/"(\w+_\d+_\w+)\.tex"/);
      if (match) {
        const pdfPath = path.join(opts.cwd, `${match[1]}.pdf`);
        fs.writeFileSync(pdfPath, 'fake-pdf-content');
      }
      callback(null, 'Output written on test.pdf', '');
    });

    const result = await compileLatex(texContent);

    expect(result.pdfPath).toBeDefined();
    expect(result.pdfPath).toMatch(/\.pdf$/);
    expect(fs.existsSync(result.pdfPath)).toBe(true);
    expect(result.filename).toBeDefined();
  });

  it('rejects with LATEX_ERROR when pdflatex exits with error', async () => {
    exec.mockImplementation((cmd, opts, callback) => {
      callback({ code: 1 }, '! Undefined control sequence.\nl.42 \\badcommand\n', '');
    });

    await expect(compileLatex('\\badcommand')).rejects.toEqual(
      expect.objectContaining({
        type: 'LATEX_ERROR',
        message: 'LaTeX compilation failed'
      })
    );
  });

  it('rejects with PDF_NOT_GENERATED when no PDF file created', async () => {
    exec.mockImplementation((cmd, opts, callback) => {
      // Don't create any PDF file
      callback(null, 'No output', '');
    });

    await expect(compileLatex('\\documentclass{article}')).rejects.toEqual(
      expect.objectContaining({
        type: 'PDF_NOT_GENERATED',
        message: 'PDF was not generated'
      })
    );
  });

  it('includes log output in error when compilation fails', async () => {
    const logOutput = '! LaTeX Error: File `nonexistent.sty` not found.\nl.5 \\usepackage{nonexistent}';
    exec.mockImplementation((cmd, opts, callback) => {
      callback({ code: 1 }, logOutput, '');
    });

    await expect(compileLatex('bad latex')).rejects.toEqual(
      expect.objectContaining({
        type: 'LATEX_ERROR',
        log: logOutput
      })
    );
  });

  it('saves .tex file to temp directory', async () => {
    exec.mockImplementation((cmd, opts, callback) => {
      const match = cmd.match(/"(\w+_\d+_\w+)\.tex"/);
      if (match) {
        // Verify the tex file exists in cwd
        const texPath = path.join(opts.cwd, `${match[1]}.tex`);
        expect(fs.existsSync(texPath)).toBe(true);
        fs.writeFileSync(path.join(opts.cwd, `${match[1]}.pdf`), 'pdf');
      }
      callback(null, '', '');
    });

    await compileLatex('\\documentclass{article}');
  });

  it('rejects when exec times out', async () => {
    exec.mockImplementation((cmd, opts, callback) => {
      const error = new Error('Command timed out');
      error.killed = true;
      callback(error, '', 'Timeout');
    });

    await expect(compileLatex('latex')).rejects.toBeDefined();
  });
});
