const express = require('express')
const path = require('path')
const mysql = require('mysql2/promise')
const { get } = require('express/lib/response')

const app = express()
const port = 3000

app.set('view engine', 'ejs');

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

populateCustomers()

app.get('/', (req, res) => {
  getRows().then(function ([rows, fields]) {
    res.render('pages/index', {
      query: rows,
      test: "testing"
    });
  })
})

async function getRows() {
  let [rows, fields] = await pool.execute('SELECT * FROM customers', [1, 1]);
  return [rows, fields];
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})