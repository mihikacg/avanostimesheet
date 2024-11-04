const sql = require('mssql');

const dbConfig = {
  server: 'AZAMAS16.internal.aventcorp.com', // your SQL Server instance
  database: 'hcp0nedb',
  user: 'hcp0neadm',
  password: 'rpMln6JMxLrS9tDi',
  port: 1433, // SQL Server default port
  options: {
    encrypt: false, // Set to true if you're on Azure
    trustServerCertificate: true, // Set to true if using self-signed cert
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Handle pool errors
pool.on('error', err => {
  console.error('SQL Server connection pool error:', err);
});

// Utility function to adjust date for EST/EDT (UTC-4/UTC-5)
const adjustToLocalTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

// Execute a query with parameters
const executeQuery = async (query, params = []) => {
  try {
    await poolConnect; // Ensure pool is ready
    const request = pool.request();

    // Add parameters to the request
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    const result = await request.query(query);

    // Adjust dates in the results if needed
    if (result.recordset) {
      result.recordset.forEach(row => {
        if (row.Entry_Date) {
          row.Entry_Date = adjustToLocalTime(row.Entry_Date);
        }
        if (row.Week_Start) {
          row.Week_Start = adjustToLocalTime(row.Week_Start);
        }
      });
    }

    return result.recordset || result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Execute a transaction with multiple queries
const executeTransaction = async (queries) => {
  try {
    await poolConnect; // Ensure pool is ready
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const results = [];
    for (const { query, params } of queries) {
      const request = new sql.Request(transaction);
      
      // Add parameters to the request
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(query);
      results.push(result);
    }

    await transaction.commit();
    return results;
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Cleanup function to close the pool
const closePool = async () => {
  try {
    await pool.close();
    console.log('Pool closed successfully');
  } catch (error) {
    console.error('Error closing pool:', error);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction,
  adjustToLocalTime,
  closePool
};