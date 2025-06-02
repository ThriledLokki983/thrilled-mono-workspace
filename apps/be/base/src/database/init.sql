-- If Exists Table Drop
DROP TABLE IF EXISTS users cascade;
-- ================
--   TABLE [users]
-- ================
-- create users table
CREATE TABLE users(
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "role" VARCHAR(50) DEFAULT 'user',
    "language_preference" VARCHAR(10) DEFAULT 'en',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT(NOW() AT TIME ZONE 'utc'),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT(NOW() AT TIME ZONE 'utc'),
    "deleted_at" TIMESTAMP WITHOUT TIME ZONE
);
