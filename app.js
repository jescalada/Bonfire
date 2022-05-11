if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config() //Loads in all the environment variables
}

const express = require('express')
const path = require('path')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const initializePassport = require('./passport-config')
const bodyParser = require('body-parser')

// Initialize the passport
initializePassport(
  passport, // Passport object
  getUserByEmail, // A function that gets the user by email (unique identifier for user)
  getUserById // A function that gets the user by id (HIDDEN unique identifier)
)

const app = express()
const port = 3000

// Tells our app that we want to use ejs as a view engine
app.set('view engine', 'ejs');

// Tells our app to take the forms and access them from the request object
app.use(express.urlencoded({
  extended: false
}))

app.use(bodyParser.json());

// Tells our app to use flash and session (these are helper modules for authentication) 
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

// Tells our app to use some authentication functions
app.use(passport.initialize())
app.use(passport.session())

// Tells our app to override some methods, so we can execute delete requests as POST instead from the HTML
app.use(methodOverride('_method'))

// Tells our app to keep in mind the folder called "public", where we have various assets
app.use(express.static(__dirname + '/public'));

// Connection info should be obtained using a .env
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'bonfire-1.cdrbnm7ck3cj.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Rocco123',
  database: 'bonfire'
})

// Connects to the database and adds a new user entry
function addNewUser(username, email, encrypted_password, isAdmin) {
  var sql = `INSERT INTO users (username, email, upvotes_received, upvotes_given, encrypted_password, is_admin) values
  ('${username}', '${email}','0', '0', '${encrypted_password}', ${isAdmin});`;
  pool.query(sql);
}

// // Connects to the database and adds a new post entry
// // var sql = `CREATE TABLE posts (post_id BIGINT NOT NULL AUTO_INCREMENT, poster_id BIGINT, upvotes_received BIGINT, post_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id), FOREIGN KEY (poster_id) REFERENCES users(user_id))`;
function addNewPost(posterId, postTitle, postContent) {
  // Adds escape characters to ' in order to make SQL queries work properly with apostrophes
  postTitle = postTitle.replaceAll("'", "''")
  postContent = postContent.replaceAll("'", "''")
  var sql = `INSERT INTO posts (poster_id, upvotes_received, post_title, post_content) values
  ('${posterId}', '0','${postTitle}', '${postContent}');`;
  pool.query(sql);
}

// Checks if an email is in the database
// Returns an object representing a user, or null
async function getUserByEmail(email) {
  var sql = `SELECT * FROM users WHERE email='${email}'`;
  let [rows, fields] = await pool.execute(sql, [1, 1]);
  let row = rows[0]
  if (row) {
    return {
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      upvotes_received: row.upvotes_received,
      upvotes_given: row.upvotes_given,
      encrypted_password: row.encrypted_password,
      is_admin: row.is_admin,
    }
  } else {
    return null
  }
}

// Checks if an id is in the database
// Returns an object representing a user or null
async function getUserById(id) {
  var sql = `SELECT * FROM users WHERE user_id='${id}'`;
  let [rows, fields] = await pool.execute(sql, [1, 1]);
  let row = rows[0]
  if (row) {
    return {
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      upvotes_received: row.upvotes_received,
      upvotes_given: row.upvotes_given,
      encrypted_password: row.encrypted_password,
      is_admin: row.is_admin,
    }
  } else {
    return null
  }
}

// Deletes the user with then given id from the database
async function deleteUserById(id) {
  var sql = `DELETE FROM users WHERE user_id='${id}'`;
  await pool.execute(sql, [1, 1]);
}

// GET landing page. Gets all the posts from the backend and displays them.
app.get('/', checkAuthenticated, (req, res) => {
  getAllPosts().then(function ([rows, fields]) {
    res.render('pages/index', {
      posts: rows,
      user: req.user,
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

// GET admin dashboard page
app.get('/admin', checkIfAdminAndAuthenticated, (req, res) => {
  getAllUsers().then(function ([rows, fields]) {
    res.render('pages/admin', {
      is_admin: req.user.is_admin,
      username: req.user.username,
      users: rows
    });
  })
})

app.delete('/admin', (req, res) => {
  deleteUserById(req.body.delete_id).then(function () {
    res.redirect('/admin');
  })
})

// GET registration page
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('pages/register');
})

// POST login page
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    let isAdmin = req.body.email.split("@")[1].includes("admin")
    addNewUser(req.body.username, req.body.email, hashedPassword, isAdmin)
    res.redirect('/login') // Redirect to login page on success
  } catch (err) {
    console.log(err)
    res.redirect('/register') // Return to registration page on failure
  }
})

// Logout route. Can be hit using a POST
app.delete('/logout', (req, res) => {
  req.logOut() // This function is set up by passport automatically, clears session and logs user out
  res.redirect('/login')
})

// Checks if a postID is in the database
// Returns an object representing a specific post or null
async function getPostById(id) {
  var sql = `SELECT * FROM posts WHERE post_id='${id}'`;
  let [rows, fields] = await pool.execute(sql, [1, 1]);
  let row = rows[0];
  if (row) {
    return {
      post_id: row.post_id,
      poster_id: row.poster_id,
      upvotes_received: row.upvotes_received,
      post_timestamp: row.post_timestamp,
      post_title: row.post_title,
      post_content: row.post_content
    }
  } else {
    return null
  }
}

// render the single post page with "get" method 
app.get('/post/:postid', checkAuthenticated, async (req, res) => {
  let post = await getPostById(req.params.postid)
  let rows = await getCommentsByPostId(req.params.postid)
  let isLiked = await checkLikedPost(req.user.user_id, req.params.postid)
  res.render('pages/post', {
    row: post,
    comments: rows,
    is_liked: isLiked,
    user_id: req.user.user_id,
  })
})

// POST comment and re-direct to the single post page
app.post('/comment/:postid', checkAuthenticated, async (req, res) => {
  addNewComment(req.params.postid, req.user.user_id, req.body.commentContent)
  res.redirect(`/post/${req.params.postid}`) // Redirect to the same page on success
})

// Checks if a commentID is in the database
// Returns an object representing a specific post or null
async function getCommentsByPostId(id) {
  var sql = `SELECT * FROM comments WHERE post_id='${id}'`;
  let [rows, fields] = await pool.execute(sql, [1, 1]);
  // let row = rows[0];
  if (rows) {
    return rows
  } else {
    return null
  }
}

// Connects to the database and adds a new comment entry
function addNewComment(post_id, commenter_id, commentContent) {
  // Adds escape characters to ' in order to make SQL queries work properly with apostrophes
  commentContent = commentContent.replaceAll("'", "''")
  var sql = `INSERT INTO comments (commenter_id, post_id, upvotes_received, comment_content) values
  ('${commenter_id}','${post_id}', '0', '${commentContent}');`;
  pool.query(sql);
}


// POST post page
app.post('/post', checkAuthenticated, async (req, res) => {
  addNewPost(req.user.user_id, req.body.postTitle, req.body.postContent)
  res.redirect('/') // Redirect to login page on success
})

// A route that toggles a like. Likes a post if it is not liked, unlikes it otherwise.
app.post('/likepost', checkAuthenticated, async (req, res) => {
  await toggleLike(req.user.user_id, req.body.post_id).then((liked) => {
    // ON SUCCESS, it sends a JSON with the current liked status of the post/user pair
    res.json({
      liked: liked
    })
  })
})

// Toggles the like status of a user/post combination
// Returns true if the post was liked, false if the post was unliked 
async function toggleLike(likerId, postId) {
  let isLiked = await checkLikedPost(likerId, postId)
  console.log(isLiked)
  if (!isLiked) {
    var sql = `INSERT INTO liked_posts (post_id, liker_id) values
      ('${postId}', '${likerId}');`;
    pool.query(sql);
    console.log("Just liked it.")
    return true
  } else {
    var sql = `DELETE FROM liked_posts WHERE post_id='${postId}' AND liker_id='${likerId}';`;
    pool.query(sql);
    console.log("Just unliked it.")
    return false
  }
}

async function checkLikedPost(userId, postId) {
  var sql = `SELECT * FROM liked_posts WHERE post_id='${postId}' AND liker_id='${userId}'`;
  let [rows, fields] = await pool.execute(sql, [1, 1]);
  console.log("Rows found: " + rows.length)
  let row = rows[0];
  console.log("First match" + row)
  return row != null
}

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

// Middleware function to check if user is NOT authenticated
function checkIfAdminAndAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin) {
    return next() // If authenticated, redirect them to dashboard
  }
  return res.redirect('/') // if not authenticated, continue execution
}

// Gets all the users from the database. Returns a weird SQL object thingy.
async function getAllUsers() {
  let [rows, fields] = await pool.execute('SELECT * FROM users', [1, 1]);
  return [rows, fields];
}

// Gets all the posts from the database. Returns a weird SQL object thingy.
async function getAllPosts() {
  let [rows, fields] = await pool.execute('SELECT * FROM posts', [1, 1]);
  return [rows, fields];
}

// Tells our app to listen to a certain port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Connects to the database (service) and creates a database
// This function is commented out, because it CANNOT be used with mysql connection pools
// function createDatabase() {
//   var sql = `CREATE DATABASE bonfire;`;
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at createDB.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("Database bonfire created.");
//     });
//   })
// }

// Connects to the database and creates a user table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function createUserTable() {
//   var sql = `CREATE TABLE users (user_id BIGINT NOT NULL AUTO_INCREMENT, username VARCHAR(31) NOT NULL, email VARCHAR(255), upvotes_received BIGINT, upvotes_given BIGINT, encrypted_password VARCHAR(255) NOT NULL, is_admin BOOLEAN NOT NULL, PRIMARY KEY (user_id))`;
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at createUserTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE users created.");
//     });
//   })
// }

// Connects to the database and creates a post table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function createPostTable() {
//   var sql = `CREATE TABLE posts (post_id BIGINT NOT NULL AUTO_INCREMENT, poster_id BIGINT, upvotes_received BIGINT, post_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id), FOREIGN KEY (poster_id) REFERENCES users(user_id))`;
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at createPostTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE posts created.");
//     });
//   })
// }

// Connects to the database and creates a comment table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function createCommentTable() {
//   var sql = `CREATE TABLE comments (comment_id BIGINT NOT NULL AUTO_INCREMENT, commenter_id BIGINT, post_id BIGINT, upvotes_received BIGINT, post_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (comment_id), FOREIGN KEY (commenter_id) REFERENCES users(user_id), FOREIGN KEY (post_id) REFERENCES posts(post_id))`;
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at createCommentTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE comments created.");
//     });
//   })
// }

// Connects to the database and creates a like_post table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function createLikePostTable() {
//   var sql = `CREATE TABLE liked_posts (post_like_id BIGINT NOT NULL AUTO_INCREMENT, post_id BIGINT, liker_id BIGINT, PRIMARY KEY (post_like_id), FOREIGN KEY (post_id) REFERENCES posts(post_id), FOREIGN KEY (liker_id) REFERENCES users(user_id))`;
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at createLikedPostTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE liked_posts created.");
//     });
//   })
// }

// Connects to the database and creates a like_comment table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function createLikeCommentTable() {
//   var sql = `CREATE TABLE liked_comments (comment_like_id BIGINT NOT NULL AUTO_INCREMENT, comment_id BIGINT, liker_id BIGINT, PRIMARY KEY (comment_like_id), FOREIGN KEY (comment_id) REFERENCES comments(comment_id), FOREIGN KEY (liker_id) REFERENCES users(user_id))`;
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at createLikedCommentTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE liked_comments created.");
//     });
//   })
// }

// Connects to the database and drops a table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function dropTable() {
//   var sql = `DROP TABLE posts`
//     connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at dropTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE dropped.");
//     });
//   })
// }

// Connects to the database and modifies a table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function modifyTable() {
//   var sql = `ALTER TABLE posts
//   DROP comment_content;`
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at modifyTable.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE modified.");
//     });
//   })
// }

// Connects to the database and modifies a table
// This function is commented out, because it CANNOT be used with mysql connection pools
// function deleteAllEntries() {
//   var sql = `DELETE FROM posts`
//   connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected at deleteAllEntries.");
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("TABLE emptied.");
//     });
//   })
// }