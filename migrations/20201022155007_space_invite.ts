import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('space_invites', t => {
    t.text('id').primary()
    t.uuid('space').references('spaces.id').notNullable().onDelete('cascade')
    t.boolean('mentor').notNullable().defaultTo(false)
    t.boolean('owner').notNullable().defaultTo(false)
  })

  await knex.schema.table('spaces', t => {
    t.text('founder_invite').references('space_invites.id').onDelete('SET NULL')
    t.text('mentor_invite').references('space_invites.id').onDelete('SET NULL')
    t.text('owner_invite').references('space_invites.id').onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('spaces', t => {
    t.dropColumns('founder_invite', 'mentor_invite', 'owner_invite')
  })

  await knex.schema.dropTable('space_invites')
}
