import * as Knex from 'knex'
import readline from 'readline'
import * as bcrypt from 'bcrypt'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = async (txt: string): Promise<string> =>
  await new Promise(res => rl.question(`${txt}: `, res))

export async function seed(knex: Knex): Promise<any> {
  console.log('\nWhich user do you want to create a login for?\n')

  let user: any

  do {
    const handle = await ask('handle')
    user = await knex('users').where('handle', 'ILIKE', handle).first()
    console.log(
      user
        ? `creating login for user '${user.name}' (${user.id})`
        : `there is no user with the handle '${handle}'`
    )
  } while (!user)

  let email: string

  do {
    email = await ask('email')
    if (await knex('signin_upframe').where({ email }).first()) {
      console.log(`email ${email} already used`)
      email = undefined
    }
  } while (!email)

  const password = bcrypt.hashSync(
    await ask('password'),
    bcrypt.genSaltSync(10)
  )

  if (await knex('signin_upframe').where({ user_id: user.id }).delete())
    console.log(`removed old login for ${user.name}`)

  await knex('signin_upframe').insert({
    user_id: user.id,
    email,
    password,
  })

  console.log(`successfully set new login for ${user.name}`)
}
