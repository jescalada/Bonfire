const express = require('express')
const path = require('path')
const mysql = require('mysql2/promise')
const { get } = require('express/lib/response')
const bcrypt = require('bcrypt')

const app = express()
const port = 3000

const users = [] // We put the users in here temporarily, later we integrate it to the database

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })) // Tells our application to take the forms and access them from the request object

// Connection info should be obtained using a .env
const pool = mysql.createPool({
  connectionLimit: 10,
  host: '35.193.183.129',
  user: 'jescalada',
  password: 'Rocco123',
  database: 'bonfire-db'
})

function createTable() {
  var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
  pool.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table customers created");
  });
}

function populateCustomers() {
  let randomNum = Math.floor(Math.random() * 1000);
  var sql = `INSERT INTO customers (name, address) values ('Juan${randomNum}', '${randomNum} Testing St');`;
  pool.query(sql);
}

populateCustomers();

// Should serve the landing page
app.get('/', (req, res) => {
  getRows().then(function ([rows, fields]) {
    res.render('pages/index', {
      query: rows,
      test: "testing"
    });
  })
})

// GET login page
app.get('/login', (req, res) => {
  res.render('pages/login')
})

// POST login page
app.post('/login', (req, res) => {
  
})

// GET registration page
app.get('/register', (req, res) => {
  res.render('pages/register');
})

// POST login page
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login') // Redirect to login page on success
  } catch(err) {
    console.log(err);
    res.redirect('/register') // Return to registration page on failure
  }
  console.log(users)
})

async function getRows() {
  let [rows, fields] = await pool.execute('SELECT * FROM customers', [1, 1]);
  return [rows, fields];
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})