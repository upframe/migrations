import * as Knex from 'knex'
import readline from 'readline'
import axios from 'axios'
import faker from 'faker'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = async (txt: string): Promise<string> =>
  await new Promise(res =>
    rl.question(txt.includes('\n') ? txt : `${txt}: `, res)
  )

export async function seed(knex: Knex): Promise<any> {
  let input: string
  const answer = () => {
    let v = parseFloat(input.trim())
    if (v === 1) return 'users'
    if (v === 2) return 'mentors'
    console.error('invalid input')
  }
  do {
    input = await ask(`
Do you want to fetch all users or just the mentors listed on the landing page?
Fetching all users will require you to sign in as an admin.

(1): all users
(2): just mentors

`)
  } while (!answer())

  await reset(knex)

  if (answer() === 'users') {
    console.log('\nPlease login as an admin:\n')
    await createUsers(
      knex,
      true,
      await login(await ask('email'), await ask('password'))
    )
  } else await createUsers(knex, false, undefined)

  await createLists(knex)
}

async function reset(knex: Knex) {
  await knex.raw(
    ['users', 'lists', 'tags']
      .map(table => `TRUNCATE ${table} CASCADE;`)
      .join('\n')
  )
}

async function createLists(knex: Knex) {
  const lists = await fetchLists()
  const publicLists = await publicListIds()
  console.log(
    `create ${lists.length} lists: ${lists
      .map(({ name }) => `'${name}'`)
      .join(', ')}`
  )
  await knex('lists').insert(
    lists.map(({ illustration, ...list }) => ({
      ...Object.fromEntries(
        Object.entries(list)
          .filter(([k]) => k !== 'users')
          .map(([k, v]) => [
            k.replace(/([A-Z])/g, c => `_${c.toLowerCase()}`),
            v,
          ])
      ),
      public: publicLists.includes(list.id),
      illustration: illustration && illustration.split('/').pop(),
    }))
  )
  await knex('user_lists').insert(
    lists.flatMap(({ id: list_id, users }) =>
      users.map(({ id: user_id }) => ({ list_id, user_id }))
    )
  )
}

const existing = new Map()
existing.set(faker.internet.email, [])

const unique = <T, K extends () => T>(func: K) => {
  let v: T
  let it = 0
  do {
    if (it > 100) throw Error("can't generate unique")
    v = func()
    it++
  } while (existing.get(func).includes(v))
  existing.get(func).push(v)
  return v
}

async function createUsers(knex: Knex, allUsers: boolean, authCookie: string) {
  const users = await fetchUsers(allUsers, authCookie)
  const mentors = users.filter(({ role }) => role !== 'USER')

  console.log(`create ${users.length} users (${mentors.length} mentors)`)

  await knex('users').insert(
    users.map(({ id, handle, name, location, biography, headline, role }) => ({
      id,
      handle,
      name,
      location,
      biography,
      headline,
      role: role.toLowerCase(),
      searchable: true,
      allow_emails: false,
      msg_emails: false,
      email: unique(faker.internet.email),
    }))
  )

  await knex('mentors').insert(
    mentors.map(({ id, company, visibility }) => ({
      id,
      company,
      listed: visibility === 'LISTED',
    }))
  )

  await knex('profile_pictures').insert(
    users.flatMap(({ id: user_id, profilePictures: photos }) =>
      photos
        .filter(({ url }) => !url.endsWith('default.png'))
        .map(({ url, size, type }) => ({
          user_id,
          url,
          size,
          type,
        }))
    )
  )

  const tags = Object.entries(
    users
      .flatMap(({ tags }) => tags)
      .filter(Boolean)
      .reduce((a, { id, name }) => ({ ...a, [id]: name }), {})
  ).map(([id, name]) => ({ id: parseInt(id), name }))

  console.log(`create ${tags.length} tags`)

  await knex('tags').insert(tags)
  await knex('user_tags').insert(
    users
      .filter(({ tags }) => tags)
      .flatMap(({ id: user_id, tags }) =>
        tags.map(({ id: tag_id }) => ({ user_id, tag_id }))
      )
  )
}

const API_URL = 'https://dev.graphapi.upframe.io'

async function login(email: string, password: string) {
  try {
    const { data, headers } = await axios.post(
      API_URL,
      JSON.stringify({
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(input: { email: $email, password: $password }) {
              name
            }
          }`,
        variables: { email, password },
      })
    )
    if (data.errors) throw { response: { data } }
    return headers['set-cookie'][0].split(';')[0]
  } catch (e) {
    for (const { message } of e.response.data.errors || []) {
      console.error(message)
    }
    throw Error("couldn't login")
  }
}

async function fetchLists() {
  console.log('fetching lists...')
  const { data } = await axios.post(
    API_URL,
    JSON.stringify({
      query: `
        query {
          lists(includeUnlisted: true) {
            id
            name
            description
            illustration
            backgroundColor
            textColor
            sortPos
            users {
              id
            }
          }
        }`,
    })
  )
  return data.data.lists
}

async function publicListIds() {
  const { data } = await axios.post(
    API_URL,
    JSON.stringify({
      query: `
        query {
          lists(includeUnlisted: false) {
            id
          }
        }`,
    })
  )
  return data.data.lists.map(({ id }) => id)
}

async function fetchUsers(allUsers: boolean, cookie?: string) {
  console.log(`fetching ${allUsers ? 'users' : 'mentors'}...`)
  try {
    const { data } = await axios.post(
      API_URL,
      JSON.stringify({
        query: allUsers ? USER_QUERY : MENTOR_QUERY,
      }),
      cookie && { headers: { cookie } }
    )
    if (data.errors) throw { response: { data } }
    if (!allUsers) return data.data.mentors
    return data.data.userList.edges.map(({ node }) => node)
  } catch (e) {
    for (const { message } of e.response.data.errors || []) {
      console.error(message)
    }
    throw Error("couldn't fetch users")
  }
}

const USER_INFO = `
  id
  role
  name
  handle
  headline
  location
  biography
  website
  social {
    id
    name
    url
    handle
  }
  tags {
    id
    name
  }
  profilePictures {
    size
    type
    url
  }
  ...on Mentor {
    visibility
    company
  }
`

const USER_QUERY = `query FetchUsers {
  userList(limit: 10000) {
    edges {
      node {
        ${USER_INFO}
      }
    }
  }
}`

const MENTOR_QUERY = `query FetchMentors {
  mentors {
    ${USER_INFO}
  }
}`
