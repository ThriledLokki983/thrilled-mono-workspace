import { Request, Response, NextFunction } from 'express';
import { SQLInjectionProtection } from '../SQLInjectionProtection.js';

const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  } as Request);

const createMockResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    locals: {},
  } as unknown as Response;
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

describe('SQLInjectionProtection', () => {
  describe('scanForSQLInjection', () => {
    test('should detect union-based injection', () => {
      const result = SQLInjectionProtection.scanForSQLInjection(
        '1 UNION SELECT * FROM users'
      );
      expect(result.hasSQLInjection).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.risk).toContain('Union-based injection');
    });

    test('should detect boolean-based blind injection', () => {
      const result = SQLInjectionProtection.scanForSQLInjection('1 AND 1=1');
      expect(result.hasSQLInjection).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.risk).toContain('Boolean-based blind');
    });

    test('should detect time-based blind injection', () => {
      const result = SQLInjectionProtection.scanForSQLInjection(
        "1; WAITFOR DELAY '00:00:05'"
      );
      expect(result.hasSQLInjection).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.risk).toContain('Time-based blind');
    });

    test('should detect stacked queries', () => {
      const result = SQLInjectionProtection.scanForSQLInjection(
        '1; DROP TABLE users'
      );
      expect(result.hasSQLInjection).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.risk).toContain('Stacked queries');
    });

    test('should detect comment injection', () => {
      const result = SQLInjectionProtection.scanForSQLInjection("admin'--");
      expect(result.hasSQLInjection).toBe(true);
      expect(result.severity).toBe('medium');
      expect(result.risk).toContain('Comment injection');
    });

    test('should detect information schema access', () => {
      const result = SQLInjectionProtection.scanForSQLInjection(
        'SELECT * FROM information_schema.tables'
      );
      expect(result.hasSQLInjection).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.risk).toContain('Information schema access');
    });

    test('should return false for safe input', () => {
      const result =
        SQLInjectionProtection.scanForSQLInjection('normal search text');
      expect(result.hasSQLInjection).toBe(false);
      expect(result.severity).toBe('low');
    });

    test('should handle empty input', () => {
      const result = SQLInjectionProtection.scanForSQLInjection('');
      expect(result.hasSQLInjection).toBe(false);
    });
  });

  describe('escapeString', () => {
    test('should escape single quotes', () => {
      const result = SQLInjectionProtection.escapeString(
        "Robert'; DROP TABLE students;--"
      );
      expect(result).toBe("Robert''; DROP TABLE students;--");
    });

    test('should escape double quotes', () => {
      const result = SQLInjectionProtection.escapeString(
        'SELECT * FROM users WHERE name="admin"'
      );
      expect(result).toBe('SELECT * FROM users WHERE name=""admin""');
    });

    test('should escape backslashes', () => {
      const result = SQLInjectionProtection.escapeString('path\\to\\file');
      expect(result).toBe('path\\\\to\\\\file');
    });

    test('should handle null bytes', () => {
      const result = SQLInjectionProtection.escapeString('test\x00null');
      expect(result).toBe('test\\0null');
    });

    test('should handle empty input', () => {
      const result = SQLInjectionProtection.escapeString('');
      expect(result).toBe('');
    });
  });

  describe('validateIdentifier', () => {
    test('should accept valid identifiers', () => {
      expect(SQLInjectionProtection.validateIdentifier('user_name')).toBe(true);
      expect(SQLInjectionProtection.validateIdentifier('table1')).toBe(true);
      expect(SQLInjectionProtection.validateIdentifier('_column')).toBe(true);
    });

    test('should reject identifiers starting with numbers', () => {
      expect(SQLInjectionProtection.validateIdentifier('1user')).toBe(false);
    });

    test('should reject reserved keywords', () => {
      expect(SQLInjectionProtection.validateIdentifier('SELECT')).toBe(false);
      expect(SQLInjectionProtection.validateIdentifier('select')).toBe(false);
      expect(SQLInjectionProtection.validateIdentifier('DROP')).toBe(false);
    });

    test('should reject identifiers with special characters', () => {
      expect(SQLInjectionProtection.validateIdentifier('user-name')).toBe(
        false
      );
      expect(SQLInjectionProtection.validateIdentifier('user@domain')).toBe(
        false
      );
    });

    test('should handle empty input', () => {
      expect(SQLInjectionProtection.validateIdentifier('')).toBe(false);
    });
  });

  describe('prepareValue', () => {
    test('should prepare string values', () => {
      const result = SQLInjectionProtection.prepareValue("test'value");
      expect(result).toBe("test''value");
    });

    test('should prepare number values', () => {
      expect(SQLInjectionProtection.prepareValue(123)).toBe(123);
      expect(SQLInjectionProtection.prepareValue(NaN)).toBe(null);
    });

    test('should prepare boolean values', () => {
      expect(SQLInjectionProtection.prepareValue(true)).toBe(true);
      expect(SQLInjectionProtection.prepareValue(false)).toBe(false);
    });

    test('should prepare date values', () => {
      const date = new Date('2023-01-01');
      const result = SQLInjectionProtection.prepareValue(date);
      expect(result).toBe(date.toISOString());
    });

    test('should prepare array values', () => {
      const result = SQLInjectionProtection.prepareValue(['a', 'b', 'c']);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('should handle null/undefined', () => {
      expect(SQLInjectionProtection.prepareValue(null)).toBe(null);
      expect(SQLInjectionProtection.prepareValue(undefined)).toBe(null);
    });
  });

  describe('sanitizeOrderBy', () => {
    test('should allow valid order by clauses', () => {
      const result =
        SQLInjectionProtection.sanitizeOrderBy('name ASC, age DESC');
      expect(result).toBe('name ASC, age DESC');
    });

    test('should filter invalid columns', () => {
      const result = SQLInjectionProtection.sanitizeOrderBy(
        'name ASC, DROP DESC',
        ['name']
      );
      expect(result).toBe('name ASC');
    });

    test('should default to ASC when direction not specified', () => {
      const result = SQLInjectionProtection.sanitizeOrderBy('name');
      expect(result).toBe('name ASC');
    });

    test('should handle empty input', () => {
      const result = SQLInjectionProtection.sanitizeOrderBy('');
      expect(result).toBe('');
    });
  });

  describe('isSafe', () => {
    test('should accept safe content', () => {
      const result = SQLInjectionProtection.isSafe('normal search term');
      expect(result).toBe(true);
    });

    test('should reject high-risk SQL injection', () => {
      const result = SQLInjectionProtection.isSafe(
        '1 UNION SELECT * FROM users'
      );
      expect(result).toBe(false);
    });

    test('should accept low-risk content', () => {
      const result = SQLInjectionProtection.isSafe('0x123456'); // Hex values are low risk
      expect(result).toBe(true);
    });
  });

  describe('createPlaceholder', () => {
    test('should create MySQL placeholders', () => {
      expect(SQLInjectionProtection.createPlaceholder(1, 'mysql')).toBe('?');
      expect(SQLInjectionProtection.createPlaceholder(2, 'mysql')).toBe('?');
    });

    test('should create PostgreSQL placeholders', () => {
      expect(SQLInjectionProtection.createPlaceholder(1, 'postgresql')).toBe(
        '$1'
      );
      expect(SQLInjectionProtection.createPlaceholder(2, 'postgresql')).toBe(
        '$2'
      );
    });

    test('should create SQLite placeholders', () => {
      expect(SQLInjectionProtection.createPlaceholder(1, 'sqlite')).toBe('?');
    });

    test('should default to MySQL style', () => {
      expect(SQLInjectionProtection.createPlaceholder(1)).toBe('?');
    });
  });

  describe('buildWhereClause', () => {
    test('should build simple WHERE clause', () => {
      const result = SQLInjectionProtection.buildWhereClause({
        name: 'John',
        age: 25,
      });
      expect(result.clause).toBe('WHERE name = ? AND age = ?');
      expect(result.values).toEqual(['John', 25]);
    });

    test('should handle null values', () => {
      const result = SQLInjectionProtection.buildWhereClause({
        name: 'John',
        deleted: null,
      });
      expect(result.clause).toBe('WHERE name = ? AND deleted IS NULL');
      expect(result.values).toEqual(['John']);
    });

    test('should handle array values (IN clause)', () => {
      const result = SQLInjectionProtection.buildWhereClause({ id: [1, 2, 3] });
      expect(result.clause).toBe('WHERE id IN (?, ?, ?)');
      expect(result.values).toEqual([1, 2, 3]);
    });

    test('should skip invalid identifiers', () => {
      const result = SQLInjectionProtection.buildWhereClause({
        valid_name: 'John',
        'invalid-name': 'value',
        SELECT: 'bad',
      });
      expect(result.clause).toBe('WHERE valid_name = ?');
      expect(result.values).toEqual(['John']);
    });

    test('should handle empty conditions', () => {
      const result = SQLInjectionProtection.buildWhereClause({});
      expect(result.clause).toBe('');
      expect(result.values).toEqual([]);
    });
  });

  describe('middleware', () => {
    test('should sanitize request body', () => {
      const middleware = SQLInjectionProtection.middleware();
      const req = createMockRequest({
        body: { query: "'; DROP TABLE users; --" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.query).toBe("\\'; DROP TABLE users; --");
    });

    test('should sanitize query parameters', () => {
      const middleware = SQLInjectionProtection.middleware();
      const req = createMockRequest({
        query: { search: "'; DROP TABLE users; --" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.search).toBe("\\'; DROP TABLE users; --");
    });

    test('should sanitize URL parameters', () => {
      const middleware = SQLInjectionProtection.middleware();
      const req = createMockRequest({
        params: { id: "'; DROP TABLE users; --" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.params.id).toBe("\\'; DROP TABLE users; --");
    });

    test('should handle nested objects', () => {
      const middleware = SQLInjectionProtection.middleware();
      const req = createMockRequest({
        body: {
          user: {
            name: "'; DROP TABLE users; --",
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.user.name).toBe("\\'; DROP TABLE users; --");
    });

    test('should handle arrays', () => {
      const middleware = SQLInjectionProtection.middleware();
      const req = createMockRequest({
        body: {
          queries: ['safe', "'; DROP TABLE users; --", 'also safe'],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.queries[1]).toBe("\\'; DROP TABLE users; --");
    });

    test('should handle errors gracefully', () => {
      const middleware = SQLInjectionProtection.middleware();
      const req = createMockRequest({
        body: null,
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should work with custom options', () => {
      const middleware = SQLInjectionProtection.middleware({
        escapeQuotes: true,
        removeSqlKeywords: true,
      });
      const req = createMockRequest({
        body: { query: "SELECT * FROM users WHERE name = 'admin'" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.query).not.toContain('SELECT');
    });
  });
});
