const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'sql5.freesqldatabase.com',
  user: 'sql5733234',
  password: 'gzMwYswwrL',
  database: 'sql5733234',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;