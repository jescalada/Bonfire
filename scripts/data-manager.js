// Obtain connection info from database.js
const pool = require('./database')

// Connects to the database and adds a new user entry
function addNewUser(username, email, encrypted_password, isAdmin) {
    var sql = `INSERT INTO users (username, email, upvotes_received, upvotes_given, encrypted_password, is_admin) values
  ('${username}', '${email}','0', '0', '${encrypted_password}', ${isAdmin});`
    pool.query(sql)
}

// Checks if an email is in the database
// Returns an object representing a user, or null
async function getUserByEmail(email) {
    var sql = `SELECT * FROM users WHERE email='${email}'`
    let [rows, fields] = await pool.execute(sql, [1, 1])
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


module.exports = { addNewUser, getUserByEmail, getUserById, deleteUserById }