import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DELETE FROM users where role = 'nologin';
    ALTER TYPE user_role RENAME TO user_role_old;
    CREATE TYPE user_role AS ENUM('user', 'mentor', 'admin');
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
    ALTER TABLE invites ALTER COLUMN role TYPE user_role USING role::text::user_role;
    DROP TYPE user_role_old;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TYPE user_role RENAME TO user_role_old;
    CREATE TYPE user_role AS ENUM('user', 'mentor', 'admin', 'nologin');
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
    ALTER TABLE invites ALTER COLUMN role TYPE user_role USING role::text::user_role;
    DROP TYPE user_role_old;
  `)
}
