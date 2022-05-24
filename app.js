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

// GET / route.
// Gets all the posts from the backend and displays them.
app.get('/', checkAuthenticated, (req, res) => {
    db.getAllPosts().then(function([rows, fields]) {
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
    db.getAllUsers().then(function([rows, fields]) {
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
    db.deleteUserById(req.body.delete_id).then(function() {
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

// DELETE /post route
// Attempts to delete a post from the database
app.delete('/post', checkAuthenticated, async(req, res) => {
    db.deletePostById(req.body.postId).then((result) => {
        res.json({
            success: true
        })    
    })
})

// Renders the single post page with "GET" method 
app.get('/post/:postid', checkAuthenticated, async(req, res) => {
    let post = await db.getPostById(req.params.postid)
    let poster = await db.getUserById(post.poster_id)
    let rows = await db.getCommentsByPostId(req.params.postid)
    let isLiked = await db.checkLikedPost(req.user.user_id, req.params.postid)
    let likedComments = await db.getLikedCommentsByPostId(req.params.postid, req.user.user_id)
    let tags = await db.getPostTags(req.params.postid)
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
    db.addNewComment(req.params.postid, req.user.user_id, req.body.commentContent, req.user.username)
    res.redirect(`/post/${req.params.postid}`) // Redirect to the same page on success
})

// POST /post route
// Attempts to create a new post with the given body parameters.
// Returns a json containing the postId if successful
app.post('/post', checkAuthenticated, async(req, res) => {
    let postId = await db.addNewPost(req.user.user_id, req.body.postTitle, req.body.postContent, req.user.username, req.body.postTags)
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
        await db.toggleLikePost(req.user.user_id, req.body.post_id).then((liked) => {
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

// POST /likecomment route
// A route that toggles a comment like. Likes a comment if it is not liked, unlikes it otherwise.
// Returns a JSON response containing the status of the liked comment
app.post('/likecomment', checkAuthenticated, async(req, res) => {
    try {
        await db.toggleLikeComment(req.body.liker_id, req.body.comment_id).then((liked) => {
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

// GET /profile route
// Gets the current user's info and renders it to the client
app.get('/profile', checkAuthenticated, async (req, res) => {
    const user = await db.getUserById(req.user.user_id)
    const posts = await db.getAllPostsByUserID(req.user.user_id)

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
    const posts = await db.getAllPostsByUserID(req.params.id)

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

// Middleware function to check if user is authenticated
// Continues the execution of the functions if the user is authenticated, otherwise redirects to login
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next() //everything works, just execute the next function
    }
    res.redirect('/login')
}
