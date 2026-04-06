const { handleLatexError, apiError } = require('../../utils/errorHandler');

describe('handleLatexError', () => {
  it('parses a single LaTeX error with line number', () => {
    const log = `! Undefined control sequence.
l.42 \\badcommand
?`;

    const errors = handleLatexError(log);

    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(42);
    expect(errors[0].message).toContain('! Undefined control sequence.');
  });

  it('parses multiple LaTeX errors', () => {
    const log = `! Missing $ inserted.
l.10 text
! Undefined control sequence.
l.42 \\bad
`;

    const errors = handleLatexError(log);

    expect(errors).toHaveLength(2);
    expect(errors[0].line).toBe(10);
    expect(errors[1].line).toBe(42);
  });

  it('returns "Unknown LaTeX error" when no errors found', () => {
    const log = 'This is pdflatex output with no errors.\n';

    const errors = handleLatexError(log);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Unknown LaTeX error');
    expect(errors[0].line).toBeNull();
  });

  it('handles empty log output', () => {
    const errors = handleLatexError('');

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Unknown LaTeX error');
  });

  it('extracts line number from different formats', () => {
    const log = `! Extra alignment tab has been changed to \cr.
l.105 \\item`;

    const errors = handleLatexError(log);

    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(105);
  });
});

describe('apiError', () => {
  it('returns error response with status and code/message', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    apiError(res, 400, 'VALIDATION_ERROR', 'Missing required fields');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
    });
  });

  it('includes details when provided', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    apiError(res, 422, 'LATEX_ERROR', 'Compilation failed', 'l.42 error line');

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'LATEX_ERROR',
        message: 'Compilation failed',
        details: 'l.42 error line'
      }
    });
  });

  it('omits details when not provided', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    apiError(res, 500, 'INTERNAL_ERROR', 'Server error');

    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  });
});
