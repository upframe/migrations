import * as Knex from 'knex'
import readline from 'readline'
import axios from 'axios'
import faker from 'faker'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = async (txt: string): Promise<string> =>
  await new Promise(res => rl.question(`${txt}: `, res))

export async function seed(knex: Knex): Promise<any> {
  console.log('\nPlease login as an admin:\n')

  const authCookie = await login(await ask('email'), await ask('password'))

  await reset(knex)
  await createUsers(knex, authCookie)
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

async function createUsers(knex: Knex, authCookie: string) {
  const users = await fetchUsers(authCookie)
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

async function fetchUsers(cookie: string) {
  console.log('fetching users...')
  try {
    const { data } = await axios.post(
      API_URL,
      JSON.stringify({
        query: `query FetchUsers {
          userList(limit: 10000) {
            edges {
              node {
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
              }
            }
          }
        }`,
      }),
      { headers: { cookie } }
    )
    if (data.errors) throw { response: { data } }
    return data.data.userList.edges.map(({ node }) => node)
  } catch (e) {
    for (const { message } of e.response.data.errors || []) {
      console.error(message)
    }
    throw Error("couldn't fetch users")
  }
}
