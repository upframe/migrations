import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('spaces', t => {
    t.uuid('id').primary()
    t.text('name').notNullable()
    t.text('handle').notNullable()
    t.timestamp('created').defaultTo(knex.raw('now()'))
    t.text('description')
    t.text('sidebar')
  })

  await knex.raw(
    'CREATE UNIQUE INDEX unique_handle_on_spaces ON spaces (UPPER(handle))'
  )

  await knex.schema.createTable('user_spaces', t => {
    t.uuid('user_id').references('users.id').onDelete('CASCADE').notNullable()
    t.uuid('space_id').references('spaces.id').onDelete('CASCADE').notNullable()
    t.boolean('is_mentor').notNullable().defaultTo(false)
    t.boolean('is_moderator').notNullable().defaultTo(false)

    t.primary(['user_id', 'space_id'])
  })

  await knex.raw(
    `ALTER TABLE users ALTER COLUMN joined SET DEFAULT CURRENT_TIMESTAMP`
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX unique_handle_on_spaces')
  await knex.schema.dropTable('user_spaces')
  await knex.schema.dropTable('spaces')
  await knex.raw(`ALTER TABLE users ALTER COLUMN joined SET DEFAULT NOW();`)
}
