import * as Knex from 'knex'

export async function up(knex: Knex): Promise<any> {
  await knex.schema.table('lists', t => {
    t.text('description')
    t.boolean('listed').notNullable().defaultTo(true)
    t.text('illustration')
    t.text('background_color')
    t.text('text_color')
  })
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.table('lists', t => {
    t.dropColumn('description')
    t.dropColumn('listed')
    t.dropColumn('illustration')
    t.dropColumn('background_color')
    t.dropColumn('text_color')
  })
}
