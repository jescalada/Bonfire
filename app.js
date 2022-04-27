const express = require('express')
const path = require('path')
const mysql = require('mysql')
const { get } = require('express/lib/response')

const app = express()
const port = 3000

app.set('view engine', 'ejs');

// Connection info should be obtained using a .env
const connection = mysql.createConnection({
  host: '35.193.183.129',
  user: 'jescalada',
  password: 'Rocco123',
  database: 'bonfire-db'
})

connection.connect()
console.log("Connected!");

function createTable() {
  var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table customers created");
  });
}

function populateCustomers() {
  let randomNum = Math.floor(Math.random() * 1000);
  var sql = `INSERT INTO customers (name, address) values ('Juan${randomNum}', '${randomNum} Testing St');`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Inserted some data!");
  });
}

populateCustomers()
// createTable()

// app.use(express.static('public')); // Tells express that there's a directory called public
// app.use(express.static('models')); // Tells express that there's a directory called models

app.get('/', (req, res) => {
  let queryRows
  
  await getRows().then(function () {
    console.log('queryRows before render is ' + queryRows)
    res.render('pages/index', {
      query: queryRows,
      test: "testing"
    });
  })
})

async function getRows() {
  connection.query('SELECT * FROM customers', (err, rows, fields) => {
    if (err) throw err
    rows.forEach(row => {
      console.log(`${row.name} lives in ${row.address}`)
    });
    queryRows = rows;

    console.log('queryRows inside query is ' + queryRows)
  })
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})