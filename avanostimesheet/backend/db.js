const mysql = require('mysql2/promise');

// Configuration object
const dbConfig = {
  host: 'sql5.freesqldatabase.com',
  user: 'sql5733234',
  password: 'gzMwYswwrL',
  database: 'sql5733234',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 30000,
  maxReconnects: 3,
  // Use UTC timezone
  timezone: '+00:00'
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (err.code === 'ECONNRESET') {
    console.error('Connection reset by peer. Attempting to reconnect...');
  }
});

// Utility function to adjust date for EST/EDT (UTC-4/UTC-5)
const adjustToLocalTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  // Add 1 day to compensate for the timezone difference
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

// Add a wrapper function for queries to handle connection errors
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(query, params);
    
    // If the results contain date fields, adjust them
    if (Array.isArray(results)) {
      results.forEach(row => {
        if (row.Entry_Date) {
          row.Entry_Date = adjustToLocalTime(row.Entry_Date);
        }
        if (row.Week_Start) {
          row.Week_Start = adjustToLocalTime(row.Week_Start);
        }
      });
    }
    
    return results;
  } catch (error) {
    if (error.code === 'ECONNRESET') {
      try {
        if (connection) {
          connection.release();
        }
        connection = await pool.getConnection();
        const [results] = await connection.query(query, params);
        return results;
      } catch (retryError) {
        throw retryError;
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
};

// Function to handle transactions
const executeTransaction = async (queries) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.query(query, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
};

const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction,
  adjustToLocalTime
};