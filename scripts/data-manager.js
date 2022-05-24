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

// Gets all the users from the database
// Returns an SQL object containing rows and fields
async function getAllUsers() {
    let [rows, fields] = await pool.execute('SELECT * FROM users', [1, 1]);
    return [rows, fields];
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

// Deletes the post with then given id from the database
async function deletePostById(id) {
    var unsetCheck = `SET FOREIGN_KEY_CHECKS=0`
    var sql = `DELETE FROM posts WHERE post_id='${id}'`;
    await pool.query(unsetCheck);
    await pool.execute(sql, [1, 1]);
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

// Connects to the database and adds a new comment entry
function addNewComment(post_id, commenter_id, commentContent, commenterUsername) {
    // Adds escape characters to ' in order to make SQL queries work properly with apostrophes
    commentContent = commentContent.replaceAll("'", "''")
    var sql = `INSERT INTO comments (commenter_id, post_id, upvotes_received, comment_content, commenter_username) values
  ('${commenter_id}','${post_id}', '0', '${commentContent}', '${commenterUsername}');`;
    pool.query(sql);
}

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

module.exports = {
    // User functions
    addNewUser,
    getUserByEmail,
    getUserById,
    deleteUserById,
    getAllUsers,
    // Post functions
    addNewPost,
    getPostById,
    deletePostById,
    getAllPosts,
    getAllPostsByUserID,
    // Tag functions
    getTag,
    addNewTag,
    addTagToPost,
    getPostTags,
    // Comment functions
    addNewComment,
    getCommentsByPostId,
    // Comment Like functions
    getLikedCommentsByPostId,
    
}