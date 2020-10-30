import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable('email_events')
  await knex.schema.raw('DROP TYPE email_event')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_events', t => {
    t.text('id').references('emails.id').notNullable().onDelete('cascade')
    t.enum(
      'event',
      [
        'queued',
        'clicked',
        'complained',
        'delivered',
        'opened',
        'permanent_fail',
        'temporary_fail',
        'unsubscribed',
      ],
      {
        useNative: true,
        enumName: 'email_event',
      }
    ).notNullable()
    t.timestamp('time').defaultTo(knex.raw('now()')).notNullable()
  })
}
