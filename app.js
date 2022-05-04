if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config() //Loads in all the environment variables
}

const express = require('express')
const path = require('path')
const mysql = require('mysql2/promise')
const { get } = require('express/lib/response')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email =>  users.find(user => user.email === email), // findUserByEmail
  id =>  users.find(user => user.id === id) // findUserById
)

const app = express()
const port = 3000

const users = [] // We put the users in here temporarily, later we integrate it to the database

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })) // Tells our application to take the forms and access them from the request object
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// Connection info should be obtained using a .env
const pool = mysql.createPool({
  connectionLimit: 10,
  host: '35.193.183.129',
  user: 'jescalada',
  password: 'Rocco123',
  database: 'bonfire-db'
})

// function createUserTable() {
//   var sql = `CREATE TABLE users (user_id BIGINT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(31) NOT NULL, fullname VARCHAR(255), upvotes_received BIGINT, upvotes_given BIGINT, encrypted_password VARCHAR(255) NOT NULL, is_admin BOOLEAN NOT NULL)`;
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at createUserTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE users created.");
//     });
//   })
// }

function addNewUser(username, fullname, encrypted_password, isAdmin) {
  var sql = `INSERT INTO users (username, fullname, upvotes_received, upvotes_given, encrypted_password, is_admin) values
  ('${username}', '${fullname}', '0', '0', '${encrypted_password}', ${isAdmin});`;
  pool.query(sql);
}

// Should serve the landing page
app.get('/', checkAuthenticated, (req, res) => {
  getAllUsers().then(function ([rows, fields]) {
    res.render('pages/index', {
      query: rows,
      username: req.user.username
    });
  })
})

// GET login page
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('pages/login')
})

// POST login page
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

// GET registration page
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('pages/register');
})

// POST login page
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    addNewUser(req.body.username, req.body.username, hashedPassword, false)
    res.redirect('/login') // Redirect to login page on success
  } catch(err) {
    console.log(err)
    res.redirect('/register') // Return to registration page on failure
  }
  console.log(users)
})

app.delete('/logout', (req, res) => {
  req.logOut() // This function is set up by passport automatically, clears session and logs user out
  res.redirect('/login')
})

// Middleware function to check if user is authenticated
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next() //everything works, just execute the next function
  }
  res.redirect('/login')
}

// Middleware function to check if user is NOT authenticated
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/') // If authenticated, redirect them to dashboard
  }
  next() // if not authenticated, continue execution
}


async function getAllUsers() {
  let [rows, fields] = await pool.execute('SELECT * FROM users', [1, 1]);
  return [rows, fields];
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})