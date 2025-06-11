import { CustomValidators } from '../CustomValidators';

describe('CustomValidators', () => {
  describe('email validation', () => {
    it('should validate valid email addresses', async () => {
      const result = await CustomValidators.email('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('test@example.com');
    });

    it('should reject invalid email addresses', async () => {
      const result = await CustomValidators.email('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('email');
    });

    it('should reject empty email', async () => {
      const result = await CustomValidators.email('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('phone validation', () => {
    it('should validate US phone numbers', async () => {
      const result = await CustomValidators.phone('+1234567890');
      expect(result.isValid).toBe(true);
    });

    it('should validate international phone numbers', async () => {
      const result = await CustomValidators.phone('+447911123456');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid phone numbers', async () => {
      const result = await CustomValidators.phone('123');
      expect(result.isValid).toBe(false);
    });
  });

  describe('URL validation', () => {
    it('should validate HTTP URLs', async () => {
      const result = await CustomValidators.url('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should validate HTTPS URLs', async () => {
      const result = await CustomValidators.url('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid URLs', async () => {
      const result = await CustomValidators.url('not-a-url');
      expect(result.isValid).toBe(false);
    });
  });

  describe('password validation', () => {
    it('should validate strong passwords', async () => {
      const result = await CustomValidators.password('MyStr0ngP@ssw0rd!');
      expect(result.isValid).toBe(true);
    });

    it('should reject weak passwords', async () => {
      const result = await CustomValidators.password('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('requirements');
    });

    it('should reject short passwords', async () => {
      const result = await CustomValidators.password('1234567');
      expect(result.isValid).toBe(false);
    });
  });

  describe('UUID validation', () => {
    it('should validate valid UUIDs', async () => {
      const result = await CustomValidators.uuid(
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid UUIDs', async () => {
      const result = await CustomValidators.uuid('not-a-uuid');
      expect(result.isValid).toBe(false);
    });
  });

  describe('credit card validation', () => {
    it('should validate valid credit card numbers', async () => {
      const result = await CustomValidators.creditCard('4111111111111111'); // Visa test number
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid credit card numbers', async () => {
      const result = await CustomValidators.creditCard('1234567890123456');
      expect(result.isValid).toBe(false);
    });
  });

  describe('date validation', () => {
    it('should validate ISO date strings', async () => {
      const result = await CustomValidators.date('2023-12-31');
      expect(result.isValid).toBe(true);
    });

    it('should validate Date objects', async () => {
      const result = await CustomValidators.date(new Date());
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid dates', async () => {
      const result = await CustomValidators.date('not-a-date');
      expect(result.isValid).toBe(false);
    });
  });

  describe('IP address validation', () => {
    it('should validate IPv4 addresses', async () => {
      const result = await CustomValidators.ipAddress('192.168.1.1');
      expect(result.isValid).toBe(true);
    });

    it('should validate IPv6 addresses', async () => {
      const result = await CustomValidators.ipAddress(
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid IP addresses', async () => {
      const result = await CustomValidators.ipAddress('999.999.999.999');
      expect(result.isValid).toBe(false);
    });
  });

  describe('JSON validation', () => {
    it('should validate valid JSON strings', async () => {
      const result = await CustomValidators.json('{"key": "value"}');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid JSON strings', async () => {
      const result = await CustomValidators.json('{invalid json}');
      expect(result.isValid).toBe(false);
    });
  });

  describe('slug validation', () => {
    it('should validate valid slugs', async () => {
      const result = await CustomValidators.slug('my-awesome-slug');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid slugs', async () => {
      const result = await CustomValidators.slug('My Invalid Slug!');
      expect(result.isValid).toBe(false);
    });
  });

  describe('hexColor validation', () => {
    it('should validate hex colors with hash', async () => {
      const result = await CustomValidators.hexColor('#FF5733');
      expect(result.isValid).toBe(true);
    });

    it('should validate hex colors without hash', async () => {
      const result = await CustomValidators.hexColor('FF5733');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid hex colors', async () => {
      const result = await CustomValidators.hexColor('not-hex');
      expect(result.isValid).toBe(false);
    });
  });

  describe('domain validation', () => {
    it('should validate valid domains', async () => {
      const result = await CustomValidators.domain('example.com');
      expect(result.isValid).toBe(true);
    });

    it('should validate subdomains', async () => {
      const result = await CustomValidators.domain('sub.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid domains', async () => {
      const result = await CustomValidators.domain('invalid..domain');
      expect(result.isValid).toBe(false);
    });
  });

  describe('file validation', () => {
    it('should validate files with allowed extensions', async () => {
      const mockFile = {
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
      };

      const result = await CustomValidators.file(mockFile, {
        allowedExtensions: ['.pdf', '.doc'],
        maxSize: 2048,
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject files with disallowed extensions', async () => {
      const mockFile = {
        name: 'script.exe',
        size: 1024,
        type: 'application/octet-stream',
      };

      const result = await CustomValidators.file(mockFile, {
        allowedExtensions: ['.pdf', '.doc'],
        maxSize: 2048,
      });

      expect(result.isValid).toBe(false);
    });

    it('should reject files that are too large', async () => {
      const mockFile = {
        name: 'document.pdf',
        size: 3072,
        type: 'application/pdf',
      };

      const result = await CustomValidators.file(mockFile, {
        allowedExtensions: ['.pdf', '.doc'],
        maxSize: 2048,
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('range validation', () => {
    it('should validate numbers within range', async () => {
      const result = await CustomValidators.range(5, { min: 1, max: 10 });
      expect(result.isValid).toBe(true);
    });

    it('should reject numbers outside range', async () => {
      const result = await CustomValidators.range(15, { min: 1, max: 10 });
      expect(result.isValid).toBe(false);
    });
  });

  describe('length validation', () => {
    it('should validate strings within length range', async () => {
      const result = await CustomValidators.validateLength('hello', {
        min: 3,
        max: 10,
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject strings outside length range', async () => {
      const result = await CustomValidators.validateLength('hi', { min: 3, max: 10 });
      expect(result.isValid).toBe(false);
    });

    it('should validate arrays within length range', async () => {
      const result = await CustomValidators.validateLength([1, 2, 3], {
        min: 2,
        max: 5,
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('pattern validation', () => {
    it('should validate strings matching pattern', async () => {
      const result = await CustomValidators.pattern('abc123', /^[a-z]+\d+$/);
      expect(result.isValid).toBe(true);
    });

    it('should reject strings not matching pattern', async () => {
      const result = await CustomValidators.pattern('ABC123', /^[a-z]+\d+$/);
      expect(result.isValid).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should validate values in enum', async () => {
      const result = await CustomValidators.enum('red', [
        'red',
        'green',
        'blue',
      ]);
      expect(result.isValid).toBe(true);
    });

    it('should reject values not in enum', async () => {
      const result = await CustomValidators.enum('yellow', [
        'red',
        'green',
        'blue',
      ]);
      expect(result.isValid).toBe(false);
    });
  });
});
