const readline = require('readline')
require('dotenv').config()

if (
  !process.env.npm_lifecycle_script.includes(':make') &&
  !['127.0.0.1', 'localhost'].includes(
    process.env.DB_HOST.replace(/^http:\/\//, '').replace(/\/$/, '')
  )
) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question(
    'You are running a script on a remote database. Are you sure you want to proceed? [y]es/[n]o\n',
    (answer) => {
      if (!['yes', 'y'].includes(answer.trim().toLowerCase()))
        throw Error('abort')
      rl.close()
    }
  )
}
