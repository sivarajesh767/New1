const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()

const databasePath = path.join(__dirname, 'userData.db')
app.use(express.json())
let database = null

const initlizeDbReverse = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => console.log('Server Running http://localhost:3000/'))
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initlizeDbReverse()

const validPassword = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await database.get(selectUserQuery)
  if (databaseUser === undefined) {
    const createUserQuery = `
    INSERT INTO
    user(username, name, password, gender, location)
    VALUES
    ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`

    if (validPassword(password)) {
      await database.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
  SELECT 
  *
  FROM
  user
  WHERE
  username = '${username}';`
  const databaseUser = await database.get(selectUserQuery)
  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `
  SELECT
  *
  FROM
  user
  WHERE
  username = '${username}';`

  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser == undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      if (validPassword(password)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const updateUserQuery = `
        UPDATE
        user
        SET
        password = '${hashedPassword}'
        WHERE
        username = '${username}';`

        await database.run(updateUserQuery)
        response.send('Password updated')
      }else{
        response.status(400)
        response.send('Password is too short')
      }
    }else{
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
