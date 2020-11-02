import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('space_invites', t => {
    t.uuid('issuer').references('users.id')
    t.timestamp('issued').defaultTo(knex.raw('now()'))
    t.text('email')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('space_invites', t => {
    t.dropColumn('issuer')
    t.dropColumn('issued')
    t.dropColumn('email')
  })
}
