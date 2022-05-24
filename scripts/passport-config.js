// Script containing configuration for passport.js

// Initialize a Local Strategy for authentication (in this case, using our own email and userId to auth)
const LocalStrategy = require('passport-local').Strategy

// Uses a password hashing library
const bcrypt = require('bcryptjs')

// Initializes the passport object with various functionalities for authenticating
// Takes a passport object, a function that allows getting a user by email, and a function that allows getting a user by ID
// Returns an initialized passport object with various authentication functions
function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        let user = await getUserByEmail(email)
        if (!user) {
            return done(null, false, {message: 'No user with that email'}) // First parameter should be err
        }

        try {
            // Password matched
            const comparison = await bcrypt.compare(password, user.encrypted_password)
            if (comparison) {
                return done(null, user)
                // Password did not match
            } else { 
                return done(null, false, { message: 'Password incorrect' })
            }
        } catch (e) {
            return done(e)
        }
    }
    // Uses the email field as the UNIQUE identifier for authentication
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    // Provides user serialization and deserialization functions
    passport.serializeUser((user, done) => {
        done(null, user.user_id)
    })
    passport.deserializeUser(async (id, done) => {
        done(null, await getUserById(id))
    })
}

//exports the initialize function
module.exports = initialize