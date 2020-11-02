import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex('space_invites').delete()

  await knex.schema.table('space_invites', t => {
    t.dropColumns('issuer', 'issued', 'email')
  })

  await knex.schema.raw(`
    ALTER TABLE space_invites ADD CONSTRAINT space_invites_id_foreign FOREIGN KEY (id) REFERENCES invites (id) ON DELETE CASCADE;
    ALTER TABLE invites ALTER COLUMN email DROP NOT NULL;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('space_invites', t => {
    t.uuid('issuer').references('users.id')
    t.timestamp('issued').defaultTo(knex.raw('now()'))
    t.text('email')
  })

  await knex.schema.raw(`
    ALTER TABLE space_invites DROP CONSTRAINT space_invites_id_foreign;
    ALTER TABLE invites ALTER COLUMN email SET NOT NULL;
  `)
}
