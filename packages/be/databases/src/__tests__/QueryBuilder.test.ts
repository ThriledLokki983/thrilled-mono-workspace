import { QueryBuilder } from '../builders/QueryBuilder';
import { Pool } from 'pg';

// Mock pg Pool
const mockPool = {
  query: jest.fn(),
} as any as Pool;

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder;

  beforeEach(() => {
    queryBuilder = new QueryBuilder(mockPool);
    jest.clearAllMocks();
  });

  describe('SELECT queries', () => {
    it('should build basic select query', () => {
      const query = queryBuilder.select().from('users').toSQL();

      expect(query.text).toBe('SELECT * FROM users');
      expect(query.values).toEqual([]);
    });

    it('should build select with specific columns', () => {
      const query = queryBuilder
        .select(['id', 'name', 'email'])
        .from('users')
        .toSQL();

      expect(query.text).toBe('SELECT id, name, email FROM users');
    });

    it('should build select with where clause', () => {
      const query = queryBuilder
        .select()
        .from('users')
        .where('age > ?', 18)
        .toSQL();

      expect(query.text).toBe('SELECT * FROM users WHERE age > $1');
      expect(query.values).toEqual([18]);
    });

    it('should build complex select query', () => {
      const query = queryBuilder
        .select(['u.id', 'u.name', 'p.title'])
        .from('users u')
        .join('posts p', 'u.id = p.user_id')
        .where('u.active = ?', true)
        .orderBy('u.name', 'ASC')
        .limit(10)
        .toSQL();

      expect(query.text).toBe(
        'SELECT u.id, u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id WHERE u.active = $1 ORDER BY u.name ASC LIMIT 10'
      );
      expect(query.values).toEqual([true]);
    });
  });

  describe('INSERT queries', () => {
    it('should build basic insert query', () => {
      const query = queryBuilder
        .insert()
        .into('users')
        .values({ name: 'John', email: 'john@example.com' })
        .toSQL();

      expect(query.text).toBe(
        'INSERT INTO users (name, email) VALUES ($1, $2)'
      );
      expect(query.values).toEqual(['John', 'john@example.com']);
    });

    it('should build insert with returning clause', () => {
      const query = queryBuilder
        .insert()
        .into('users')
        .values({ name: 'John' })
        .returning(['id', 'created_at'])
        .toSQL();

      expect(query.text).toBe(
        'INSERT INTO users (name) VALUES ($1) RETURNING id, created_at'
      );
      expect(query.values).toEqual(['John']);
    });
  });

  describe('UPDATE queries', () => {
    it('should build basic update query', () => {
      const query = queryBuilder
        .update()
        .table('users')
        .set({ name: 'Jane', email: 'jane@example.com' })
        .where('id = ?', 1)
        .toSQL();

      expect(query.text).toBe(
        'UPDATE users SET name = $1, email = $2 WHERE id = $3'
      );
      expect(query.values).toEqual(['Jane', 'jane@example.com', 1]);
    });
  });

  describe('DELETE queries', () => {
    it('should build basic delete query', () => {
      const query = queryBuilder
        .delete()
        .from('users')
        .where('id = ?', 1)
        .toSQL();

      expect(query.text).toBe('DELETE FROM users WHERE id = $1');
      expect(query.values).toEqual([1]);
    });
  });
});
