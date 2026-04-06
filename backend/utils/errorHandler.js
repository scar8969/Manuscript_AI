function handleLatexError(logOutput) {
  const lines = logOutput.split('\n');
  const errors = [];
  let currentError = null;

  lines.forEach(line => {
    if (line.includes('!')) {
      currentError = { message: '', line: null };
      errors.push(currentError);
    }
    if (currentError) {
      currentError.message += line + '\n';
    }

    const lineMatch = line.match(/l\.(\d+)/);
    if (lineMatch && currentError) {
      currentError.line = parseInt(lineMatch[1]);
    }
  });

  return errors.length > 0 ? errors : [{ message: 'Unknown LaTeX error', line: null }];
}

function apiError(res, status, code, message, details = null) {
  const error = { error: { code, message } };
  if (details) error.error.details = details;
  return res.status(status).json(error);
}

module.exports = {
  handleLatexError,
  apiError
};
