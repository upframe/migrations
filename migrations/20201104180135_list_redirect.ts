import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('lists', t => {
    t.uuid('space').references('spaces.id').onDelete('SET NULL')
  })

  await knex.schema.table('spaces', t => {
    t.boolean('hidden').notNullable().defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('spaces', t => {
    t.dropColumn('hidden')
  })

  await knex.schema.table('lists', t => {
    t.dropColumn('space')
  })
}
