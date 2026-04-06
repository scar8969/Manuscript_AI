const { exec } = require('child_process');
const path = require('path');
const fileManager = require('../utils/fileManager');

function compileLatex(latexCode) {
  return new Promise((resolve, reject) => {
    const filename = fileManager.generateFilename('resume');
    const texPath = fileManager.saveTexFile(filename, latexCode);
    const pdfPath = fileManager.getPdfPath(filename);
    const texDir = path.dirname(texPath);

    const command = 'pdflatex -interaction=nonstopmode -no-shell-escape -output-directory=. "' + filename + '.tex" 2>&1';

    exec(command, { timeout: 30000, cwd: texDir }, (error, stdout, stderr) => {
      if (error) {
        const logOutput = stdout + stderr;
        reject({
          type: 'LATEX_ERROR',
          message: 'LaTeX compilation failed',
          log: logOutput
        });
        return;
      }

      if (!fileManager.fileExists(pdfPath)) {
        reject({
          type: 'PDF_NOT_GENERATED',
          message: 'PDF was not generated'
        });
        return;
      }

      resolve({ pdfPath, filename });
    });
  });
}

module.exports = { compileLatex };
