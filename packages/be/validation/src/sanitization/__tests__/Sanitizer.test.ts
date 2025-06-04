import { Sanitizer } from '../Sanitizer.js';

describe('Sanitizer', () => {
  describe('sanitizeHTML', () => {
    it('should sanitize malicious script tags', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = Sanitizer.sanitizeHTML(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should preserve allowed tags', () => {
      const input = '<p>Paragraph</p><span>Span</span><script>alert("bad")</script>';
      const result = Sanitizer.sanitizeHTML(input, {
        allowedTags: ['p', 'span']
      });
      
      expect(result).toContain('<p>Paragraph</p>');
      expect(result).toContain('<span>Span</span>');
      expect(result).not.toContain('<script>');
    });

    it('should handle empty input', () => {
      expect(Sanitizer.sanitizeHTML('')).toBe('');
      expect(Sanitizer.sanitizeHTML(null as unknown as string)).toBe('');
      expect(Sanitizer.sanitizeHTML(undefined as unknown as string)).toBe('');
    });

    it('should strip all tags when stripTags is true', () => {
      const input = '<p>Content</p><div>More content</div>';
      const result = Sanitizer.sanitizeHTML(input, { stripTags: true });
      
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<div>');
      expect(result).toContain('Content');
      expect(result).toContain('More content');
    });
  });

  describe('sanitizeXSS', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Safe content';
      const result = Sanitizer.sanitizeXSS(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    it('should encode HTML entities', () => {
      const input = '<div onload="alert()">Content</div>';
      const result = Sanitizer.sanitizeXSS(input, {
        encodeHtml: true
      });
      
      expect(result).not.toContain('onload');
    });

    it('should preserve safe attributes', () => {
      const input = '<p class="safe" onclick="bad()">Content</p>';
      const result = Sanitizer.sanitizeXSS(input, {
        allowSafeAttributes: ['class'],
        encodeHtml: false
      });
      
      expect(result).toContain('class="safe"');
      expect(result).not.toContain('onclick');
    });
  });

  describe('sanitizeSQL', () => {
    it('should escape single quotes', () => {
      const input = "SELECT * FROM users WHERE name = 'John'; DROP TABLE users;";
      const result = Sanitizer.sanitizeSQL(input);
      
      expect(result).toContain("\\'; DROP");
      expect(result).toContain("\\'John\\'");
    });

    it('should remove SQL keywords when configured', () => {
      const input = "username'; DROP TABLE users; --";
      const result = Sanitizer.sanitizeSQL(input, {
        removeSqlKeywords: true
      });
      
      expect(result.toLowerCase()).not.toContain('drop');
      expect(result.toLowerCase()).not.toContain('table');
    });

    it('should handle empty input', () => {
      expect(Sanitizer.sanitizeSQL('')).toBe('');
      expect(Sanitizer.sanitizeSQL(null as unknown as string)).toBe('');
    });
  });

  describe('sanitizeGeneral', () => {
    it('should trim whitespace', () => {
      const input = '  content with spaces  ';
      const result = Sanitizer.sanitizeGeneral(input, { trim: true });
      
      expect(result).toBe('content with spaces');
    });

    it('should convert to lowercase', () => {
      const input = 'UPPERCASE Content';
      const result = Sanitizer.sanitizeGeneral(input, { toLowerCase: true });
      
      expect(result).toBe('uppercase content');
    });

    it('should remove null characters', () => {
      const input = 'content\x00with\x00nulls';
      const result = Sanitizer.sanitizeGeneral(input, { removeNullChars: true });
      
      expect(result).toBe('contentwithnulls');
    });

    it('should apply multiple transformations', () => {
      const input = '  CONTENT\x00WITH  ISSUES  ';
      const result = Sanitizer.sanitizeGeneral(input, {
        trim: true,
        toLowerCase: true,
        removeNullChars: true
      });
      
      expect(result).toBe('contentwith  issues');
    });
  });

  describe('sanitizeComprehensive', () => {
    it('should apply all sanitization methods', () => {
      const input = '<script>alert("xss")</script>  CONTENT\x00  ';
      const result = Sanitizer.sanitizeComprehensive(input, {
        html: { stripTags: true },
        xss: { removeScriptTags: true, encodeHtml: false },
        general: { trim: true, toLowerCase: true, removeNullChars: true }
      });
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert("xss")'); // Script content should be removed for security
      expect(result).toContain('content');
      expect(result).toBe('content');
    });

    it('should handle object input', () => {
      const input = { key: 'value' };
      const result = Sanitizer.sanitizeComprehensive(input);
      
      expect(result).toBe('[object Object]');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize object properties recursively', () => {
      const input = {
        name: '  John  ',
        profile: {
          bio: '<script>alert("xss")</script>Safe bio',
          age: 30
        },
        tags: ['<span>tag1</span>', 'tag2']
      };

      const result = Sanitizer.sanitizeObject(input, {
        html: { stripTags: true },
        xss: { encodeHtml: false },
        general: { trim: true }
      });

      expect(result.name).toBe('John');
      expect(result.profile.bio).toBe('Safe bio');
      expect(result.profile.age).toBe(30);
      expect(result.tags[0]).toBe('tag1');
    });

    it('should handle null and undefined values', () => {
      const input = {
        name: null,
        age: undefined,
        valid: 'data'
      };

      const result = Sanitizer.sanitizeObject(input);

      expect(result.name).toBeNull();
      expect(result.age).toBeUndefined();
      expect(result.valid).toBe('data');
    });

    it('should handle empty objects', () => {
      expect(Sanitizer.sanitizeObject({})).toEqual({});
      expect(Sanitizer.sanitizeObject(null as unknown as Record<string, unknown>)).toEqual({});
      expect(Sanitizer.sanitizeObject(undefined as unknown as Record<string, unknown>)).toEqual({});
    });
  });

  describe('sanitizeArray', () => {
    it('should sanitize array elements', () => {
      const input = [
        '<script>alert("xss")</script>content1',
        '  content2  ',
        'CONTENT3'
      ];

      const result = Sanitizer.sanitizeArray(input, {
        html: { stripTags: true },
        general: { trim: true, toLowerCase: true }
      });

      expect(result[0]).toContain('content1');
      expect(result[1]).toBe('content2');
      expect(result[2]).toBe('content3');
    });

    it('should handle mixed array types', () => {
      const input = ['string', 123, null, undefined, { key: 'value' }];
      const result = Sanitizer.sanitizeArray(input);

      expect(result[0]).toBe('string');
      expect(result[1]).toBe('123');
      expect(result[2]).toBe('null');
      expect(result[3]).toBe('undefined');
      expect(result[4]).toBe('[object Object]');
    });

    it('should handle empty arrays', () => {
      expect(Sanitizer.sanitizeArray([])).toEqual([]);
      expect(Sanitizer.sanitizeArray(null as unknown as string[])).toEqual([]);
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize email input', () => {
      const result = Sanitizer.sanitizeEmail('  Test@EXAMPLE.COM  ');
      expect(result).toBe('test@example.com');
    });

    it('should handle invalid email', () => {
      const result = Sanitizer.sanitizeEmail('invalid-email');
      expect(result).toBe('');
    });

    it('should handle empty input', () => {
      expect(Sanitizer.sanitizeEmail('')).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('should clean phone number', () => {
      const result = Sanitizer.sanitizePhone('(555) 123-4567 ext abc');
      expect(result).toBe('(555) 123-4567');
    });

    it('should preserve valid characters', () => {
      const result = Sanitizer.sanitizePhone('+1-555-123-4567');
      expect(result).toBe('+1-555-123-4567');
    });

    it('should handle empty input', () => {
      expect(Sanitizer.sanitizePhone('')).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    it('should validate https URLs', () => {
      const result = Sanitizer.sanitizeURL('https://example.com');
      expect(result).toBe('https://example.com/');
    });

    it('should validate http URLs', () => {
      const result = Sanitizer.sanitizeURL('http://example.com');
      expect(result).toBe('http://example.com/');
    });

    it('should reject javascript protocol', () => {
      const result = Sanitizer.sanitizeURL('javascript:alert("xss")');
      expect(result).toBe('');
    });

    it('should handle invalid URLs', () => {
      const result = Sanitizer.sanitizeURL('not-a-url');
      expect(result).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      const result = Sanitizer.sanitizeFilename('test<>:"/\\|?*file.txt');
      expect(result).toBe('testfile.txt');
    });

    it('should replace spaces with underscores', () => {
      const result = Sanitizer.sanitizeFilename('my test file.txt');
      expect(result).toBe('my_test_file.txt');
    });

    it('should remove leading/trailing dots', () => {
      const result = Sanitizer.sanitizeFilename('...test...file...');
      expect(result).toBe('test...file');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(300);
      const result = Sanitizer.sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('sanitizeComprehensive', () => {
    it('should apply all sanitization methods', () => {
      const input = '<script>alert("xss")</script>  ';
      const result = Sanitizer.sanitizeComprehensive(input, {
        html: { allowedTags: ['p'] },
        xss: { removeScriptTags: true },
        general: { trim: true }
      });
      
      expect(result).not.toContain('<script>');
      expect(result.trim()).toBe(result);
    });

    it('should handle empty options', () => {
      const input = 'test content';
      const result = Sanitizer.sanitizeComprehensive(input);
      expect(result).toBe('test content');
    });
  });
});
