if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config() // Loads in all the environment variables
}

// Required imports handled by node

// Express for routing
const express = require('express')

// MySQL package for handling MySQL
const mysql = require('mysql2/promise')

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

app.use(require("./scripts/router"));

// POST /login route
// Attempts to authenticate the current user and redirects to landing page on success
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

// Middleware function to check if user is NOT authenticated
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/') // If authenticated, redirect them to dashboard
    }
    next() // if not authenticated, continue execution
}