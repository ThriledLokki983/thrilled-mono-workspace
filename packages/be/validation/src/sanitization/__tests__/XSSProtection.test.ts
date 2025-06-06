import { Request, Response, NextFunction } from 'express';
import { XSSProtection } from '../XSSProtection.js';

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
    setHeader: jest.fn().mockReturnThis(),
    locals: {},
  } as unknown as Response;
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

describe('XSSProtection', () => {
  describe('scanForXSS', () => {
    test('should detect script tags', () => {
      const result = XSSProtection.scanForXSS('<script>alert("xss")</script>');
      expect(result.hasXSS).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.patterns).toContain('<script>alert("xss")</script>');
    });

    test('should detect event handlers', () => {
      const result = XSSProtection.scanForXSS(
        '<img onerror="alert(1)" src="x">'
      );
      expect(result.hasXSS).toBe(true);
      expect(result.severity).toBe('high');
    });

    test('should detect javascript protocol', () => {
      const result = XSSProtection.scanForXSS(
        '<a href="javascript:alert(1)">click</a>'
      );
      expect(result.hasXSS).toBe(true);
      expect(result.severity).toBe('high');
    });

    test('should detect data URIs with scripts', () => {
      const result = XSSProtection.scanForXSS(
        'data:text/html,<script>alert()</script>'
      );
      expect(result.hasXSS).toBe(true);
      expect(result.severity).toBe('high');
    });

    test('should detect expression functions', () => {
      const result = XSSProtection.scanForXSS('expression(alert(1))');
      expect(result.hasXSS).toBe(true);
      expect(result.severity).toBe('medium');
    });

    test('should return false for safe content', () => {
      const result = XSSProtection.scanForXSS('<p>This is safe content</p>');
      expect(result.hasXSS).toBe(false);
      expect(result.severity).toBe('low');
    });

    test('should handle empty input', () => {
      const result = XSSProtection.scanForXSS('');
      expect(result.hasXSS).toBe(false);
    });

    test('should handle null/undefined input', () => {
      const result1 = XSSProtection.scanForXSS(null as unknown as string);
      const result2 = XSSProtection.scanForXSS(undefined as unknown as string);
      expect(result1.hasXSS).toBe(false);
      expect(result2.hasXSS).toBe(false);
    });
  });

  describe('cleanHTML', () => {
    test('should clean HTML content', () => {
      const result = XSSProtection.cleanHTML(
        '<p>Hello</p><script>alert("xss")</script>'
      );
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    test('should preserve allowed tags', () => {
      const result = XSSProtection.cleanHTML(
        '<p>This is <strong>safe</strong> content</p>'
      );
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    test('should handle custom options', () => {
      const result = XSSProtection.cleanHTML('<div><p>Hello</p></div>', {
        allowedTags: ['div', 'p'],
      });
      expect(result).toContain('<p>');
    });

    test('should handle empty input', () => {
      const result = XSSProtection.cleanHTML('');
      expect(result).toBe('');
    });
  });

  describe('createCSPHeader', () => {
    test('should generate default CSP headers', () => {
      const csp = XSSProtection.createCSPHeader();
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
    });

    test('should accept custom options', () => {
      const csp = XSSProtection.createCSPHeader({
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      });
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' https://fonts.googleapis.com");
    });

    test('should include all required directives', () => {
      const csp = XSSProtection.createCSPHeader();
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
      expect(csp).toContain('connect-src');
      expect(csp).toContain('font-src');
      expect(csp).toContain('object-src');
      expect(csp).toContain('media-src');
      expect(csp).toContain('frame-src');
    });
  });

  describe('isSafe', () => {
    test('should validate safe content', () => {
      const result = XSSProtection.isSafe('<p>Safe content</p>');
      expect(result).toBe(true);
    });

    test('should invalidate dangerous content', () => {
      const result = XSSProtection.isSafe('<script>alert("xss")</script>');
      expect(result).toBe(false);
    });

    test('should validate empty content', () => {
      const result = XSSProtection.isSafe('');
      expect(result).toBe(true);
    });
  });

  describe('encode', () => {
    test('should encode HTML entities', () => {
      const result = XSSProtection.encode('<script>alert("test")</script>');
      expect(result).toBe(
        '&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;'
      );
    });

    test('should handle special characters', () => {
      const result = XSSProtection.encode('& < > " \' /');
      expect(result).toBe('&amp; &lt; &gt; &quot; &#x27; &#x2F;');
    });

    test('should handle empty input', () => {
      const result = XSSProtection.encode('');
      expect(result).toBe('');
    });
  });

  describe('decode', () => {
    test('should decode HTML entities', () => {
      const result = XSSProtection.decode(
        '&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;'
      );
      expect(result).toBe('<script>alert("test")</script>');
    });

    test('should handle ampersands', () => {
      const result = XSSProtection.decode(
        '&amp; &lt; &gt; &quot; &#x27; &#x2F;'
      );
      expect(result).toBe('& < > " \' /');
    });

    test('should handle empty input', () => {
      const result = XSSProtection.decode('');
      expect(result).toBe('');
    });
  });

  describe('middleware', () => {
    test('should sanitize request body', () => {
      const middleware = XSSProtection.middleware();
      const req = createMockRequest({
        body: { content: '<script>alert("xss")</script>Hello' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.content).not.toContain('<script>');
      expect(req.body.content).toContain('Hello');
    });

    test('should sanitize query parameters', () => {
      const middleware = XSSProtection.middleware();
      const req = createMockRequest({
        query: { search: '<script>alert("xss")</script>test' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.search).not.toContain('<script>');
    });

    test('should sanitize URL parameters', () => {
      const middleware = XSSProtection.middleware();
      const req = createMockRequest({
        params: { id: '<script>alert("xss")</script>123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.params.id).not.toContain('<script>');
    });

    test('should handle nested objects', () => {
      const middleware = XSSProtection.middleware();
      const req = createMockRequest({
        body: {
          user: {
            profile: {
              bio: '<script>alert("xss")</script>Bio content',
            },
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.user.profile.bio).not.toContain('<script>');
      expect(req.body.user.profile.bio).toContain('Bio content');
    });

    test('should handle arrays', () => {
      const middleware = XSSProtection.middleware();
      const req = createMockRequest({
        body: {
          tags: ['safe', '<script>alert("xss")</script>tag', 'also safe'],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.tags[1]).not.toContain('<script>');
      expect(req.body.tags[1]).toContain('tag');
    });

    test('should handle errors gracefully', () => {
      const middleware = XSSProtection.middleware();
      const req = createMockRequest({
        body: null, // This might cause an error
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should work with custom options', () => {
      const middleware = XSSProtection.middleware({
        removeScriptTags: true,
        encodeHtml: false,
      });
      const req = createMockRequest({
        body: { content: '<script>alert("xss")</script><p>Hello</p>' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.content).not.toContain('<script>');
    });
  });
});
