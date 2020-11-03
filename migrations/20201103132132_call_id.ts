import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('calls', t => {
    t.uuid('id').primary()
    t.uuid('slot_id')
      .references('time_slots.id')
      .notNullable()
      .onDelete('cascade')
    t.enum('status', ['pending', 'confirmed', 'cancelled'], {
      useNative: true,
      enumName: 'call_status',
    })
    t.uuid('mentee_id').references('users.id').notNullable().onDelete('cascade')
    t.text('message')
    t.text('location')
    t.text('gcal_user_event_id')
    t.text('gcal_upframe_event_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('calls')
}
