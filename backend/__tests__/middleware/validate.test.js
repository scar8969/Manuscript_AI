const validate = require('../../middleware/validate');

describe('validateBody middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('calls next() when all required fields are present', () => {
    req.body = { email: 'a@b.com', password: '12345678', name: 'Test' };
    const middleware = validate(['email', 'password', 'name']);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 when a required field is missing', () => {
    req.body = { email: 'a@b.com' };
    const middleware = validate(['email', 'password', 'name']);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: password, name'
      }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when a required field is null', () => {
    req.body = { email: null, password: 'pass', name: 'Test' };
    const middleware = validate(['email', 'password', 'name']);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when a required field is empty string', () => {
    req.body = { email: 'a@b.com', password: '', name: 'Test' };
    const middleware = validate(['email', 'password', 'name']);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes validation when field is 0 (falsy but not null/undefined/empty)', () => {
    req.body = { count: 0, name: 'Test' };
    const middleware = validate(['count', 'name']);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('passes validation when field is false (falsy but not null/undefined/empty)', () => {
    req.body = { active: false, name: 'Test' };
    const middleware = validate(['active', 'name']);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
