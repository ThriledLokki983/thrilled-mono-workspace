/**
 * Generic SQL template helper for common database operations
 * Provides standardized SQL query templates with consistent patterns
 */
export class SqlTemplateHelper {
  /**
   * Generate SELECT query template for an entity
   * @param table Table name
   * @param fields Array of field names to select
   * @param options Query options
   */
  public static getSelectQuery(
    table: string,
    fields: string[],
    options: {
      includeDeleted?: boolean;
      activeOnly?: boolean;
      additionalFields?: string[];
    } = {}
  ): string {
    const allFields = options.additionalFields
      ? [...fields, ...options.additionalFields]
      : fields;

    let whereClause = '';
    const conditions: string[] = [];

    if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (options.activeOnly) {
      conditions.push('is_active = true');
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    return `
      SELECT
        ${allFields.join(',\n        ')}
      FROM ${table}
      ${whereClause}
    `;
  }

  /**
   * Generate SELECT by ID query template
   * @param table Table name
   * @param fields Array of field names to select
   * @param options Query options
   */
  public static getSelectByIdQuery(
    table: string,
    fields: string[],
    options: {
      includeDeleted?: boolean;
      activeOnly?: boolean;
      additionalFields?: string[];
    } = {}
  ): string {
    const allFields = options.additionalFields
      ? [...fields, ...options.additionalFields]
      : fields;

    const conditions: string[] = ['id = $1'];

    if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (options.activeOnly) {
      conditions.push('is_active = true');
    }

    return `
      SELECT
        ${allFields.join(',\n        ')}
      FROM ${table}
      WHERE ${conditions.join(' AND ')}
    `;
  }

  /**
   * Generate SELECT by field query template
   * @param table Table name
   * @param fields Array of field names to select
   * @param searchField Field to search by
   * @param options Query options
   */
  public static getSelectByFieldQuery(
    table: string,
    fields: string[],
    searchField: string,
    options: {
      includeDeleted?: boolean;
      activeOnly?: boolean;
      additionalFields?: string[];
      limit?: boolean;
    } = {}
  ): string {
    const allFields = options.additionalFields
      ? [...fields, ...options.additionalFields]
      : fields;

    const conditions: string[] = [`${searchField} = $1`];

    if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (options.activeOnly) {
      conditions.push('is_active = true');
    }

    const limitClause = options.limit ? 'LIMIT 1' : '';

    return `
      SELECT
        ${allFields.join(',\n        ')}
      FROM ${table}
      WHERE ${conditions.join(' AND ')}
      ${limitClause}
    `;
  }

  /**
   * Generate INSERT query template
   * @param table Table name
   * @param fields Array of field names to insert
   * @param options Query options
   */
  public static getInsertQuery(
    table: string,
    fields: string[],
    options: {
      returningFields?: string[];
      onConflict?: {
        field: string;
        action: 'DO NOTHING' | 'DO UPDATE';
      };
    } = {}
  ): string {
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const returningClause = options.returningFields
      ? `RETURNING ${options.returningFields.join(', ')}`
      : '';

    let conflictClause = '';
    if (options.onConflict) {
      conflictClause = `ON CONFLICT (${options.onConflict.field}) ${options.onConflict.action}`;
    }

    return `
      INSERT INTO ${table} (
        ${fields.join(',\n        ')}
      )
      VALUES (${placeholders})
      ${conflictClause}
      ${returningClause}
    `;
  }

  /**
   * Generate UPDATE query template
   * @param table Table name
   * @param fields Array of field names to update
   * @param options Query options
   */
  public static getUpdateQuery(
    table: string,
    fields: string[],
    options: {
      returningFields?: string[];
      includeDeleted?: boolean;
      additionalSetters?: string[];
    } = {}
  ): string {
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(',\n        ');

    const additionalSetters = options.additionalSetters || [];
    const allSetters = [setClause, ...additionalSetters];

    const conditions: string[] = ['id = $1'];

    if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    const returningClause = options.returningFields
      ? `RETURNING ${options.returningFields.join(', ')}`
      : '';

    return `
      UPDATE ${table}
      SET
        ${allSetters.join(',\n        ')},
        updated_at = CURRENT_TIMESTAMP
      WHERE ${conditions.join(' AND ')}
      ${returningClause}
    `;
  }

  /**
   * Generate soft delete query template
   * @param table Table name
   * @param options Query options
   */
  public static getSoftDeleteQuery(
    table: string,
    options: {
      returningFields?: string[];
    } = {}
  ): string {
    const returningClause = options.returningFields
      ? `RETURNING ${options.returningFields.join(', ')}`
      : '';

    return `
      UPDATE ${table}
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      ${returningClause}
    `;
  }

  /**
   * Generate hard delete query template
   * @param table Table name
   * @param options Query options
   */
  public static getDeleteQuery(
    table: string,
    options: {
      returningFields?: string[];
      additionalConditions?: string[];
    } = {}
  ): string {
    const conditions: string[] = ['id = $1'];

    if (options.additionalConditions) {
      conditions.push(...options.additionalConditions);
    }

    const returningClause = options.returningFields
      ? `RETURNING ${options.returningFields.join(', ')}`
      : '';

    return `
      DELETE FROM ${table}
      WHERE ${conditions.join(' AND ')}
      ${returningClause}
    `;
  }
}

/**
 * Entity-specific SQL helpers for common business entities
 */
export class EntitySqlHelpers {
  /**
   * User entity SQL helpers
   */
  public static readonly User = {
    TABLE: 'users',
    STANDARD_FIELDS: [
      'id',
      'email',
      'name',
      'first_name',
      'last_name',
      'phone',
      'address',
      'role',
      'language_preference',
      'created_at',
      'updated_at',
      'is_active'
    ],

    getAllQuery(): string {
      return SqlTemplateHelper.getSelectQuery(this.TABLE, this.STANDARD_FIELDS);
    },

    getByIdQuery(includePassword = false): string {
      return SqlTemplateHelper.getSelectByIdQuery(
        this.TABLE,
        this.STANDARD_FIELDS,
        {
          additionalFields: includePassword ? ['password'] : [],
        }
      );
    },

    getByEmailQuery(includePassword = false, activeOnly = true): string {
      return SqlTemplateHelper.getSelectByFieldQuery(
        this.TABLE,
        this.STANDARD_FIELDS,
        'email',
        {
          additionalFields: includePassword ? ['password'] : [],
          activeOnly,
          limit: true,
        }
      );
    },

    getInsertQuery(returningPassword = false): string {
      const fields = [
        'email',
        'password',
        'name',
        'first_name',
        'last_name',
        'phone',
        'address',
        'role',
        'language_preference',
        'is_active'
      ];

      return SqlTemplateHelper.getInsertQuery(this.TABLE, fields, {
        returningFields: returningPassword
          ? [...this.STANDARD_FIELDS, 'password']
          : this.STANDARD_FIELDS,
      });
    },

    getUpdateQuery(): string {
      const fields = [
        'email',
        'name',
        'first_name',
        'last_name',
        'phone',
        'address',
        'role',
        'language_preference',
        'password',
        'is_active'
      ];

      return SqlTemplateHelper.getUpdateQuery(this.TABLE, fields, {
        returningFields: this.STANDARD_FIELDS,
      });
    },

    getSoftDeleteQuery(): string {
      return SqlTemplateHelper.getSoftDeleteQuery(this.TABLE, {
        returningFields: this.STANDARD_FIELDS,
      });
    },
  };

  /**
   * Create custom entity helpers
   * @param table Table name
   * @param standardFields Standard fields for the entity
   */
  public static createEntityHelper(table: string, standardFields: string[]) {
    return {
      TABLE: table,
      STANDARD_FIELDS: standardFields,

      getAllQuery(): string {
        return SqlTemplateHelper.getSelectQuery(table, standardFields);
      },

      getByIdQuery(additionalFields: string[] = []): string {
        return SqlTemplateHelper.getSelectByIdQuery(table, standardFields, {
          additionalFields,
        });
      },

      getByFieldQuery(field: string, additionalFields: string[] = []): string {
        return SqlTemplateHelper.getSelectByFieldQuery(table, standardFields, field, {
          additionalFields,
          limit: true,
        });
      },

      getInsertQuery(insertFields: string[], returningFields?: string[]): string {
        return SqlTemplateHelper.getInsertQuery(table, insertFields, {
          returningFields: returningFields || standardFields,
        });
      },

      getUpdateQuery(updateFields: string[], returningFields?: string[]): string {
        return SqlTemplateHelper.getUpdateQuery(table, updateFields, {
          returningFields: returningFields || standardFields,
        });
      },

      getSoftDeleteQuery(returningFields?: string[]): string {
        return SqlTemplateHelper.getSoftDeleteQuery(table, {
          returningFields: returningFields || standardFields,
        });
      },
    };
  }
}
