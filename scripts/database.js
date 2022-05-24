// This file contains functions for modifying the database structure
// ONLY pool is exported, and being used 

const mysql = require('mysql2/promise')

// Connection info (normally added through .env)
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'bonfire-1.cdrbnm7ck3cj.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: 'Rocco123',
    database: 'bonfire'
})

// Connects to the database (service) and creates a database
function createDatabase() {
    var sql = `CREATE DATABASE bonfire;`;
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at createDB.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Database bonfire created.");
      });
    })
   }
  
  // Connects to the database and creates a user table
  function createUserTable() {
    var sql = `CREATE TABLE users (user_id BIGINT NOT NULL AUTO_INCREMENT, username VARCHAR(31) NOT NULL, email VARCHAR(255), upvotes_received BIGINT, upvotes_given BIGINT, encrypted_password VARCHAR(255) NOT NULL, is_admin BOOLEAN NOT NULL, PRIMARY KEY (user_id))`;
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at createUserTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE users created.");
      });
    })
   }
  
  // Connects to the database and creates a post table
  function createPostTable() {
    var sql = `CREATE TABLE posts (post_id BIGINT NOT NULL AUTO_INCREMENT, poster_id BIGINT, upvotes_received BIGINT, post_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id), FOREIGN KEY (poster_id) REFERENCES users(user_id))`;
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at createPostTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE posts created.");
      });
    })
  }
  
  // Connects to the database and creates a comment table
  function createCommentTable() {
    var sql = `CREATE TABLE comments (comment_id BIGINT NOT NULL AUTO_INCREMENT, commenter_id BIGINT, post_id BIGINT, upvotes_received BIGINT, post_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (comment_id), FOREIGN KEY (commenter_id) REFERENCES users(user_id), FOREIGN KEY (post_id) REFERENCES posts(post_id))`;
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at createCommentTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE comments created.");
      });
    })
  }
  
  // Connects to the database and creates a like_post table
  function createLikePostTable() {
    var sql = `CREATE TABLE liked_posts (post_like_id BIGINT NOT NULL AUTO_INCREMENT, post_id BIGINT, liker_id BIGINT, PRIMARY KEY (post_like_id), FOREIGN KEY (post_id) REFERENCES posts(post_id), FOREIGN KEY (liker_id) REFERENCES users(user_id))`;
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at createLikedPostTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE liked_posts created.");
      });
    })
  }
  
  // Connects to the database and creates a tags table
  function createTagsTable() {
      var sql = `CREATE TABLE tags (tag_id BIGINT NOT NULL AUTO_INCREMENT, tag_name VARCHAR(255), PRIMARY KEY (tag_id))`;
      connection.connect(function(err) {
        if (err) throw err;
        console.log("Connected at createTagsTable.");
        connection.query(sql, function (err, result) {
          if (err) throw err;
          console.log("TABLE tags created.");
        });
      })
    }
  
  // Connects to the database and creates a like_comment table
  function createPostTagsTable() {
    var sql = `CREATE TABLE post_tags (post_tag_id BIGINT NOT NULL AUTO_INCREMENT, post_id BIGINT, tag_id BIGINT, PRIMARY KEY (post_tag_id), FOREIGN KEY (post_id) REFERENCES posts(post_id), FOREIGN KEY (tag_id) REFERENCES tags(tag_id))`;
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at createPostTagsTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE post_tags created.");
      });
    })
  }
  
  // Connects to the database and creates a like_comment table
  function createLikeCommentTable() {
    var sql = `CREATE TABLE liked_comments (comment_like_id BIGINT NOT NULL AUTO_INCREMENT, comment_id BIGINT, liker_id BIGINT, PRIMARY KEY (comment_like_id), FOREIGN KEY (comment_id) REFERENCES comments(comment_id), FOREIGN KEY (liker_id) REFERENCES users(user_id))`;
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at createLikedCommentTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE liked_comments created.");
      });
    })
  }
  
  // Connects to the database and drops a table
  function dropTable() {
    var sql = `DROP TABLE posts`
      connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at dropTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE dropped.");
      });
    })
  }
  
  // Connects to the database and modifies a table
  function modifyTable() {
    var sql = `ALTER TABLE comments
    ADD commenter_username VARCHAR(255);`
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at modifyTable.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE modified.");
      });
    })
  }
  
  // Connects to the database and empties a table
  function deleteAllEntries() {
    var sql = `DELETE FROM posts`
    connection.connect(function(err) {
      if (err) throw err;
      console.log("Connected at deleteAllEntries.");
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("TABLE emptied.");
      });
    })
  }

  module.exports = pool