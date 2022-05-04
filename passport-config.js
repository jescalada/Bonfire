const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

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

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => {
        done(null, user.user_id)
    })
    passport.deserializeUser(async (id, done) => {
        done(null, await getUserById(id))
    })
}

module.exports = initialize //exports the initialize function