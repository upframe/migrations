import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('spaces', t => {
    t.specificType('space_imgs', 'text[]')
    t.specificType('cover_imgs', 'text[]')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('spaces', t => {
    t.dropColumns('space_imgs', 'cover_imgs')
  })
}
