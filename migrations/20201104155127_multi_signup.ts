import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

  await knex.schema.table('signup', t => {
    t.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).notNullable()
  })

  await knex.schema.raw(`
    ALTER TABLE signup DROP CONSTRAINT signup_pkey;
    ALTER TABLE signup ALTER COLUMN token SET NOT NULL;
    ALTER TABLE signup ADD PRIMARY KEY (id);
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE signup DROP CONSTRAINT signup_pkey;
    ALTER TABLE signup ADD PRIMARY KEY (token);
  `)

  await knex.schema.table('signup', t => {
    t.dropColumn('id')
  })

  await knex.schema.raw('DROP EXTENSION "uuid-ossp";')
}
