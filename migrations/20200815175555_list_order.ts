import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('lists', t => {
    t.specificType('sort_pos', 'SERIAL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('lists', t => {
    t.dropColumn('sort_pos')
  })
}
