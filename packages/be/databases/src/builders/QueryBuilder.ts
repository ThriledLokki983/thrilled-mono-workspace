import { Pool } from 'pg';
import {
  QueryResult,
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
} from '@thrilled/be-types';
import { Logger } from '@mono/be-core';

export class QueryBuilder {
  constructor(private pool: Pool, private logger: Logger) {}

  /**
   * Create a SELECT query builder
   */
  select(columns?: string | string[]): SelectQueryBuilder {
    return new SelectQueryBuilder(this.pool, this.logger, columns);
  }

  /**
   * Create an INSERT query builder
   */
  insert(): InsertQueryBuilder {
    return new InsertQueryBuilder(this.pool, this.logger);
  }

  /**
   * Create an UPDATE query builder
   */
  update(): UpdateQueryBuilder {
    return new UpdateQueryBuilder(this.pool, this.logger);
  }

  /**
   * Create a DELETE query builder
   */
  delete(): DeleteQueryBuilder {
    return new DeleteQueryBuilder(this.pool, this.logger);
  }

  /**
   * Execute raw SQL
   */
  async raw<T = any>(
    text: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    try {
      this.logger.debug('Executing raw query:', { text, params });
      const result = await this.pool.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command,
      };
    } catch (error) {
      this.logger.error('Raw query failed:', { text, params, error });
      throw error;
    }
  }
}

class SelectQueryBuilder implements SelectQuery {
  private selectedColumns: string[] = ['*'];
  private fromTable?: string;
  private whereClauses: Array<{ condition: string; params: any[] }> = [];
  private joinClauses: string[] = [];
  private orderByClauses: string[] = [];
  private groupByColumns: string[] = [];
  private havingClauses: Array<{ condition: string; params: any[] }> = [];
  private limitCount?: number;
  private offsetCount?: number;

  constructor(
    private pool: Pool,
    private logger: Logger,
    columns?: string | string[]
  ) {
    if (columns) {
      this.selectedColumns = Array.isArray(columns) ? columns : [columns];
    }
  }

  select(columns?: string | string[]): SelectQuery {
    if (columns) {
      this.selectedColumns = Array.isArray(columns) ? columns : [columns];
    }
    return this;
  }

  from(table: string): SelectQuery {
    this.fromTable = table;
    return this;
  }

  where(condition: string, ...params: any[]): SelectQuery {
    this.whereClauses.push({ condition, params });
    return this;
  }

  join(table: string, condition: string): SelectQuery {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table: string, condition: string): SelectQuery {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  rightJoin(table: string, condition: string): SelectQuery {
    this.joinClauses.push(`RIGHT JOIN ${table} ON ${condition}`);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): SelectQuery {
    this.orderByClauses.push(`${column} ${direction}`);
    return this;
  }

  groupBy(columns: string | string[]): SelectQuery {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.groupByColumns.push(...cols);
    return this;
  }

  having(condition: string, ...params: any[]): SelectQuery {
    this.havingClauses.push({ condition, params });
    return this;
  }

  limit(count: number): SelectQuery {
    this.limitCount = count;
    return this;
  }

  offset(count: number): SelectQuery {
    this.offsetCount = count;
    return this;
  }

  toSQL(): { text: string; values: any[] } {
    if (!this.fromTable) {
      throw new Error('FROM clause is required');
    }

    let query = `SELECT ${this.selectedColumns.join(', ')} FROM ${
      this.fromTable
    }`;
    let paramIndex = 1;
    const values: any[] = [];

    // Add JOINs
    if (this.joinClauses.length > 0) {
      query += ' ' + this.joinClauses.join(' ');
    }

    // Add WHERE clauses
    if (this.whereClauses.length > 0) {
      const whereConditions = this.whereClauses.map((clause) => {
        const placeholders = clause.params.map(() => `$${paramIndex++}`);
        values.push(...clause.params);
        return clause.condition.replace(
          /\?/g,
          () => placeholders.shift() || ''
        );
      });
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add GROUP BY
    if (this.groupByColumns.length > 0) {
      query += ` GROUP BY ${this.groupByColumns.join(', ')}`;
    }

    // Add HAVING
    if (this.havingClauses.length > 0) {
      const havingConditions = this.havingClauses.map((clause) => {
        const placeholders = clause.params.map(() => `$${paramIndex++}`);
        values.push(...clause.params);
        return clause.condition.replace(
          /\?/g,
          () => placeholders.shift() || ''
        );
      });
      query += ` HAVING ${havingConditions.join(' AND ')}`;
    }

    // Add ORDER BY
    if (this.orderByClauses.length > 0) {
      query += ` ORDER BY ${this.orderByClauses.join(', ')}`;
    }

    // Add LIMIT
    if (this.limitCount !== undefined) {
      query += ` LIMIT ${this.limitCount}`;
    }

    // Add OFFSET
    if (this.offsetCount !== undefined) {
      query += ` OFFSET ${this.offsetCount}`;
    }

    return { text: query, values };
  }

  async execute<T = any>(): Promise<QueryResult<T>> {
    const { text, values } = this.toSQL();

    try {
      this.logger.debug('Executing SELECT query:', { text, values });
      const result = await this.pool.query(text, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command,
      };
    } catch (error) {
      this.logger.error('SELECT query failed:', { text, values, error });
      throw error;
    }
  }
}

class InsertQueryBuilder implements InsertQuery {
  private table?: string;
  private insertData: Record<string, any>[] = [];
  private returningColumns: string[] = [];
  private onConflictColumn?: string;
  private onConflictAction?: string;

  constructor(private pool: Pool, private logger: Logger) {}

  into(table: string): InsertQuery {
    this.table = table;
    return this;
  }

  values(data: Record<string, any> | Record<string, any>[]): InsertQuery {
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  returning(columns?: string | string[]): InsertQuery {
    if (columns) {
      this.returningColumns = Array.isArray(columns) ? columns : [columns];
    } else {
      this.returningColumns = ['*'];
    }
    return this;
  }

  onConflict(
    column: string,
    action: 'DO NOTHING' | 'DO UPDATE' = 'DO NOTHING'
  ): InsertQuery {
    this.onConflictColumn = column;
    this.onConflictAction = action;
    return this;
  }

  toSQL(): { text: string; values: any[] } {
    if (!this.table || this.insertData.length === 0) {
      throw new Error('Table name and values are required');
    }

    const firstRow = this.insertData[0];
    const columns = Object.keys(firstRow);
    const values: any[] = [];

    let paramIndex = 1;
    const valuePlaceholders = this.insertData.map((row) => {
      const rowValues = columns.map((col) => {
        values.push(row[col]);
        return `$${paramIndex++}`;
      });
      return `(${rowValues.join(', ')})`;
    });

    let query = `INSERT INTO ${this.table} (${columns.join(
      ', '
    )}) VALUES ${valuePlaceholders.join(', ')}`;

    // Add ON CONFLICT clause
    if (this.onConflictColumn) {
      query += ` ON CONFLICT (${this.onConflictColumn}) ${this.onConflictAction}`;
    }

    // Add RETURNING clause
    if (this.returningColumns.length > 0) {
      query += ` RETURNING ${this.returningColumns.join(', ')}`;
    }

    return { text: query, values };
  }

  async execute<T = any>(): Promise<QueryResult<T>> {
    const { text, values } = this.toSQL();

    try {
      this.logger.debug('Executing INSERT query:', { text, values });
      const result = await this.pool.query(text, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command,
      };
    } catch (error) {
      this.logger.error('INSERT query failed:', { text, values, error });
      throw error;
    }
  }
}

class UpdateQueryBuilder implements UpdateQuery {
  private tableName?: string;
  private updateData: Record<string, any> = {};
  private whereClauses: Array<{ condition: string; params: any[] }> = [];
  private returningColumns: string[] = [];

  constructor(private pool: Pool, private logger: Logger) {}

  table(name: string): UpdateQuery {
    this.tableName = name;
    return this;
  }

  set(data: Record<string, any>): UpdateQuery {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  where(condition: string, ...params: any[]): UpdateQuery {
    this.whereClauses.push({ condition, params });
    return this;
  }

  returning(columns?: string | string[]): UpdateQuery {
    if (columns) {
      this.returningColumns = Array.isArray(columns) ? columns : [columns];
    } else {
      this.returningColumns = ['*'];
    }
    return this;
  }

  toSQL(): { text: string; values: any[] } {
    if (!this.tableName || Object.keys(this.updateData).length === 0) {
      throw new Error('Table name and SET data are required');
    }

    const values: any[] = [];
    let paramIndex = 1;

    // Build SET clause
    const setClause = Object.entries(this.updateData).map(([key, value]) => {
      values.push(value);
      return `${key} = $${paramIndex++}`;
    });

    let query = `UPDATE ${this.tableName} SET ${setClause.join(', ')}`;

    // Add WHERE clauses
    if (this.whereClauses.length > 0) {
      const whereConditions = this.whereClauses.map((clause) => {
        const placeholders = clause.params.map(() => `$${paramIndex++}`);
        values.push(...clause.params);
        return clause.condition.replace(
          /\?/g,
          () => placeholders.shift() || ''
        );
      });
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add RETURNING clause
    if (this.returningColumns.length > 0) {
      query += ` RETURNING ${this.returningColumns.join(', ')}`;
    }

    return { text: query, values };
  }

  async execute<T = any>(): Promise<QueryResult<T>> {
    const { text, values } = this.toSQL();

    try {
      this.logger.debug('Executing UPDATE query:', { text, values });
      const result = await this.pool.query(text, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command,
      };
    } catch (error) {
      this.logger.error('UPDATE query failed:', { text, values, error });
      throw error;
    }
  }
}

class DeleteQueryBuilder implements DeleteQuery {
  private tableName?: string;
  private whereClauses: Array<{ condition: string; params: any[] }> = [];
  private returningColumns: string[] = [];

  constructor(private pool: Pool, private logger: Logger) {}

  from(table: string): DeleteQuery {
    this.tableName = table;
    return this;
  }

  where(condition: string, ...params: any[]): DeleteQuery {
    this.whereClauses.push({ condition, params });
    return this;
  }

  returning(columns?: string | string[]): DeleteQuery {
    if (columns) {
      this.returningColumns = Array.isArray(columns) ? columns : [columns];
    } else {
      this.returningColumns = ['*'];
    }
    return this;
  }

  toSQL(): { text: string; values: any[] } {
    if (!this.tableName) {
      throw new Error('Table name is required');
    }

    const values: any[] = [];
    let paramIndex = 1;
    let query = `DELETE FROM ${this.tableName}`;

    // Add WHERE clauses
    if (this.whereClauses.length > 0) {
      const whereConditions = this.whereClauses.map((clause) => {
        const placeholders = clause.params.map(() => `$${paramIndex++}`);
        values.push(...clause.params);
        return clause.condition.replace(
          /\?/g,
          () => placeholders.shift() || ''
        );
      });
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add RETURNING clause
    if (this.returningColumns.length > 0) {
      query += ` RETURNING ${this.returningColumns.join(', ')}`;
    }

    return { text: query, values };
  }

  async execute<T = any>(): Promise<QueryResult<T>> {
    const { text, values } = this.toSQL();

    try {
      this.logger.debug('Executing DELETE query:', { text, values });
      const result = await this.pool.query(text, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command,
      };
    } catch (error) {
      this.logger.error('DELETE query failed:', { text, values, error });
      throw error;
    }
  }
}
