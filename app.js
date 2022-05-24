if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config() // Loads in all the environment variables
}

// Required imports handled by node

// Express for routing
const express = require('express')

// MySQL package for handling MySQL
const mysql = require('mysql2/promise')

// Bcrypt for hashing passwords
const bcrypt = require('bcryptjs')

// Authentication middleware
const passport = require('passport')

// Flash for making flash warnings to indicate authentication failure
const flash = require('express-flash')

// Express-session for handling sessions
const session = require('express-session')

// Allows us to override DELETE method into POST method (easier to use)
const methodOverride = require('method-override')

// Initializes our passport configuration
const initializePassport = require('./scripts/passport-config')

// Allows us to parse the body of incoming POST requests
const bodyParser = require('body-parser')

// Initialize the functions for managing data in our database
// All our database operations are in data-manager.js
// Database configuration files are in database.js
const db = require('./scripts/data-manager')

// Initializes the passport object
initializePassport(
    passport, // Passport object
    db.getUserByEmail, // A function that gets the user by email (unique identifier for user)
    db.getUserById // A function that gets the user by id (HIDDEN unique identifier)
)

// Initializes an express app at the PORT specified in the .env, or otherwise port 3000
const app = express()
const port = process.env.PORT || 3000

// Tells our app that we want to use ejs as a view engine
app.set('view engine', 'ejs');

// Tells our app to take the forms and access them from the request object
app.use(express.urlencoded({
    extended: false
}))

// Tells our app that some body requests may be in JSON format
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

// Tells our app to listen to a certain port
app.listen(port, () => {
    console.log(`Bonfire listening on port ${port}`)
})

// Gets a tag by name, returns an object representing a row in the database
async function getTag(tagName) {
    let sql = `SELECT * FROM tags WHERE tag_name='${tagName}';`
    let [rows, fields] = await pool.execute(sql, [1, 1])
    return rows[0]
}

// Adds a new tag to the database, returns a Promise that resolves to an SQL query object
async function addNewTag(tagName) {
    let sql = `INSERT INTO tags (tag_name) values ('${tagName}');`
    return await pool.query(sql)
}

// Connects to the database and adds a new post entry, returns the post id
async function addNewPost(posterId, postTitle, postContent, posterUsername, postTags) {
    // Adds escape characters to ' in order to make SQL queries work properly with apostrophes
    postTitle = postTitle.replaceAll("'", "''")
    postContent = postContent.replaceAll("'", "''")
    
    var sql = `INSERT INTO posts (poster_id, upvotes_received, post_title, post_content, poster_username) values
  ('${posterId}', '0','${postTitle}', '${postContent}', '${posterUsername}');`;
    let post = await pool.query(sql)
    let postId = post[0].insertId
    // For each tag in the post, check if the tag exists or not and adds the post_tag rows to DB
    postTags.forEach(async (tagString) => {
        tagString = tagString.replaceAll("'", "''")
        let tag = await getTag(tagString)
        var tagId;
        if (!tag) {
            tag = await addNewTag(tagString)
            tagId = tag[0].insertId
        } else {
            tagId = tag.tag_id
        }
        addTagToPost(tagId, postId)
    });
    return postId
}

// Adds a tag and post combination to the post_tags table in the database
async function addTagToPost(tagId, postId) {
    let sql = `INSERT INTO post_tags (tag_id, post_id) values ('${tagId}', '${postId}')`
    pool.query(sql)
}

// Gets all the tags for a certain post, searched by postId
// Returns all the rows that match
async function getPostTags(postId) {
    let sql = `SELECT * from post_tags LEFT JOIN tags ON tags.tag_id=post_tags.tag_id WHERE post_tags.post_id='${postId}'`
    let [rows, fields] = await pool.execute(sql, [1, 1])
    return rows
}

// Deletes the post with then given id from the database
async function deletePostById(id) {
    var unsetCheck = `SET FOREIGN_KEY_CHECKS=0`
    var sql = `DELETE FROM posts WHERE post_id='${id}'`;
    await pool.query(unsetCheck);
    await pool.execute(sql, [1, 1]);
}

// GET / route.
// Gets all the posts from the backend and displays them.
app.get('/', checkAuthenticated, (req, res) => {
    getAllPosts().then(function([rows, fields]) {
        res.render('pages/index', {
            posts: rows,
            user: req.user,
        });
    })
})

// GET /login route
// Renders the login page
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('pages/login')
})

// POST /login route
// Attempts to authenticate the current user and redirects to landing page on success
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

// GET /admin route
// Loads all the users from DB and Rrenders the admin dashboard
app.get('/admin', checkIfAdminAndAuthenticated, (req, res) => {
    getAllUsers().then(function([rows, fields]) {
        res.render('pages/admin', {
            is_admin: req.user.is_admin,
            username: req.user.username,
            users: rows
        });
    })
})

// DELETE /admin route
// Deletes a user from the DB and redirects to the admin page (refreshes)
app.delete('/admin', (req, res) => {
    deleteUserById(req.body.delete_id).then(function() {
        res.redirect('/admin');
    })
})

// GET /registration route
// Renders the registration page
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('pages/register');
})

// GET /mission route
// Renders the mission page
app.get('/mission', (req, res) => {
  res.render('pages/mission');
})

// GET /team route
// Renders the team page
app.get('/team', (req, res) => {
  res.render('pages/team');
})

// GET /siterules route
// Renders the site rules page
app.get('/siterules', (req, res) => {
  res.render('pages/siterules');
})

// GET /contact route
// Renders the contact page
app.get('/contact', (req, res) => {
  res.render('pages/contact');
})

// POST login route
// Attempts to create a user using the included email, username and password data
// Redirects to login on success, or returns to registration page on failure
app.post('/register', checkNotAuthenticated, async(req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        let isAdmin = req.body.email.split("@")[1].includes("admin")
        db.addNewUser(req.body.username, req.body.email, hashedPassword, isAdmin)
        res.redirect('/login') // Redirect to login page on success
    } catch (err) {
        console.log(err)
        res.redirect('/register') // Return to registration page on failure
    }
})

// Logout route. Can be hit using a POST thanks to method override
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

// DELETE /post route
// Attempts to delete a post from the database
app.delete('/post', checkAuthenticated, async(req, res) => {
    deletePostById(req.body.postId).then((result) => {
        res.json({
            success: true
        })    
    })
})

// Renders the single post page with "GET" method 
app.get('/post/:postid', checkAuthenticated, async(req, res) => {
    let post = await getPostById(req.params.postid)
    let poster = await db.getUserById(post.poster_id)
    let rows = await getCommentsByPostId(req.params.postid)
    let isLiked = await checkLikedPost(req.user.user_id, req.params.postid)
    let likedComments = await getLikedCommentsByPostId(req.params.postid, req.user.user_id)
    let tags = await getPostTags(req.params.postid)
    res.render('pages/post', {
        row: post,
        poster: poster,
        poster_id: post.poster_id,
        comments: rows,
        is_liked: isLiked,
        liked_comments: likedComments,
        user_id: req.user.user_id,
        tags: tags
    })
})

// POST comment and re-direct to the single post page
app.post('/comment/:postid', checkAuthenticated, async(req, res) => {
    addNewComment(req.params.postid, req.user.user_id, req.body.commentContent, req.user.username)
    res.redirect(`/post/${req.params.postid}`) // Redirect to the same page on success
})

// Gets all the comments under a postID
// Returns rows representing comments or null
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

// Gets all the comments under a postID
// Returns rows representing comments or null
async function getLikedCommentsByPostId(id, userId) {
    var sql = `SELECT * FROM comments LEFT JOIN liked_comments ON comments.comment_id=liked_comments.comment_id WHERE post_id='${id}' AND liker_id='${userId}'`;
    let [rows, fields] = await pool.execute(sql, [1, 1]);
    if (rows) {
        return rows
    } else {
        return null
    }
}

// Connects to the database and adds a new comment entry
function addNewComment(post_id, commenter_id, commentContent, commenterUsername) {
    // Adds escape characters to ' in order to make SQL queries work properly with apostrophes
    commentContent = commentContent.replaceAll("'", "''")
    var sql = `INSERT INTO comments (commenter_id, post_id, upvotes_received, comment_content, commenter_username) values
  ('${commenter_id}','${post_id}', '0', '${commentContent}', '${commenterUsername}');`;
    pool.query(sql);
}

// POST /post route
// Attempts to create a new post with the given body parameters.
// Returns a json containing the postId if successful
app.post('/post', checkAuthenticated, async(req, res) => {
    let postId = await addNewPost(req.user.user_id, req.body.postTitle, req.body.postContent, req.user.username, req.body.postTags)
    if (!postId) {
        res.json({
            postId: null,
            success: false
        })
    } else {
        res.json({
          postId: postId,
          success: true
        })
    }
})

// POST /likepost route
// A route that toggles a post like. Likes a post if it is not liked, unlikes it otherwise.
// Returns a JSON response containing the status of the liked post
app.post('/likepost', checkAuthenticated, async(req, res) => {
    try {
        await toggleLikePost(req.user.user_id, req.body.post_id).then((liked) => {
            // ON SUCCESS, it sends a JSON with the current liked status of the post/user pair
            res.json({
                liked: liked,
                error: null
            })
        })
    } catch (err) {
        res.json({
            liked: null,
            error: err
        })
    }
})

// Toggles the like status of a user/post combination
// Returns true if the post was liked, false if the post was unliked 
async function toggleLikePost(likerId, postId) {
    let isLiked = await checkLikedPost(likerId, postId)
    if (!isLiked) {
        var sql = `INSERT INTO liked_posts (post_id, liker_id) values
      ('${postId}', '${likerId}');`
        pool.query(sql)

        var anotherQuery = `UPDATE posts SET upvotes_received = upvotes_received + 1 WHERE post_id = ${postId}`
        pool.query(anotherQuery)
        return true
    } else {
        var sql = `DELETE FROM liked_posts WHERE post_id='${postId}' AND liker_id='${likerId}';`;
        pool.query(sql);

        var anotherQuery = `UPDATE posts SET upvotes_received = upvotes_received - 1 WHERE post_id = ${postId}`
        pool.query(anotherQuery)
        return false
    }
}

// Queries the database to check if a post is liked or not, returns true if the post is liked
// Returns true if a post is liked
async function checkLikedPost(userId, postId) {
    var sql = `SELECT * FROM liked_posts WHERE post_id='${postId}' AND liker_id='${userId}'`;
    let [rows, fields] = await pool.execute(sql, [1, 1]);
    let row = rows[0];
    return row != null
}

// POST /likecomment route
// A route that toggles a comment like. Likes a comment if it is not liked, unlikes it otherwise.
// Returns a JSON response containing the status of the liked comment
app.post('/likecomment', checkAuthenticated, async(req, res) => {
    try {
        await toggleLikeComment(req.body.liker_id, req.body.comment_id).then((liked) => {
            // ON SUCCESS, it sends a JSON with the current liked status of the comment/user pair
            res.json({
                liked: liked,
                error: null
            })
        })
    } catch (err) {
        res.json({
            liked: null,
            error: err
        })
    }
})

// Toggles the like status of a user/comment combination
// Returns true if the comment was liked, false if the comment was unliked 
async function toggleLikeComment(likerId, commentId) {
    let isLiked = await checkLikedComment(likerId, commentId)
    if (!isLiked) {
        var sql = `INSERT INTO liked_comments (comment_id, liker_id) values
      ('${commentId}', '${likerId}');`
        pool.query(sql)

        var anotherQuery = `UPDATE comments SET upvotes_received = upvotes_received + 1 WHERE comment_id = ${commentId}`
        pool.query(anotherQuery)
        return true
    } else {
        var sql = `DELETE FROM liked_comments WHERE comment_id='${commentId}' AND liker_id='${likerId}';`;
        pool.query(sql);

        var anotherQuery = `UPDATE comments SET upvotes_received = upvotes_received - 1 WHERE comment_id = ${commentId}`
        pool.query(anotherQuery)
        return false
    }
}

// Queries the database to check if a comment is liked or not, returns true if the comment is liked
// Returns true if the comment is liked
async function checkLikedComment(userId, commentId) {
    var sql = `SELECT * FROM liked_comments WHERE comment_id='${commentId}' AND liker_id='${userId}'`;
    let [rows, fields] = await pool.execute(sql, [1, 1]);
    let row = rows[0];
    return row != null
}

// Middleware function to check if user is authenticated
// Continues the execution of the functions if the user is authenticated, otherwise redirects to login
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next() //everything works, just execute the next function
    }
    res.redirect('/login')
}


// GET /profile route
// Gets the current user's info and renders it to the client
app.get('/profile', checkAuthenticated, async (req, res) => {
    const user = await db.getUserById(req.user.user_id)
    const posts = await getAllPostsByUserID(req.user.user_id)

    res.render('pages/profile', {
        username: user.username,
        email: user.email,
        upvotes_received: user.upvotes_received,
        is_admin: user.is_admin? 'Yes' : 'No',
        posts: posts,
    });
})

// GET /profile route
// Gets a user's info by userId and renders it to the client
app.get('/profile/:id', checkAuthenticated, async (req, res) => {
    const user = await db.getUserById(req.params.id)
    const posts = await getAllPostsByUserID(req.params.id)

    res.render('pages/profile', {
        username: user.username,
        email: user.email,
        upvotes_received: user.upvotes_received,
        is_admin: user.is_admin? 'Yes' : 'No',
        posts: posts,
    });
})

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

// Gets all the users from the database
// Returns an SQL object containing rows and fields
async function getAllUsers() {
    let [rows, fields] = await pool.execute('SELECT * FROM users', [1, 1]);
    return [rows, fields];
}

// Gets all the posts from the database
// Returns an SQL object containing rows and fields
async function getAllPosts() {
    let [rows, fields] = await pool.execute('SELECT * FROM posts', [1, 1]);
    return [rows, fields];
}

// Gets all the posts from a particular user.
// Returns an SQL object containing rows and fields
async function getAllPostsByUserID(user_id) {
    let [rows, fields] = await pool.execute(`SELECT * FROM posts WHERE poster_id='${user_id}'`, [1, 1]);
    return rows; 
}