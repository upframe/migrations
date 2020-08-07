import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', t => {
    t.boolean('msg_emails').defaultTo(true).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', t => {
    t.dropColumn('msg_emails')
  })
}
