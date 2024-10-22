const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../db');

// Middleware to handle connection timeouts
const connectionErrorHandler = (req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
};

router.use(connectionErrorHandler);

// Test database connection
router.get('/test-connection', async (req, res) => {
  try {
    const [result] = await executeQuery('SELECT 1');
    res.json({ status: 'success', message: 'Database connection is working' });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection test failed',
      details: error.message 
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM Users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    handleQueryError(error, res, 'fetching users');
  }
});

// Get all timesheet entries
router.get('/timesheet', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM TimeSheetEntry');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching timesheet entries:', error);
    handleQueryError(error, res, 'fetching timesheet entries');
  }
});

// Get timesheet entries for specific employee and week
router.get('/timesheet/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const weekStart = req.query.weekStart;

    if (!weekStart) {
      return res.status(400).json({ error: 'Week start date is required' });
    }

    const rows = await executeQuery(
      `SELECT 
        tse.*,
        p.Project_Name,
        t.Task_Name
       FROM TimeSheetEntry tse
       LEFT JOIN Projects p ON tse.Project_ID = p.Project_ID
       LEFT JOIN Tasks t ON tse.Task_ID = t.Task_ID
       WHERE tse.Employee_ID = ? 
       AND DATE(tse.Week_Start) = DATE(?)`,
      [employeeId, weekStart]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching employee timesheet:', error);
    handleQueryError(error, res, 'fetching employee timesheet');
  }
});

// Get timesheet entries for approval
router.get('/approval-timesheet/:approverID', async (req, res) => {
  try {
    const approverID = req.params.approverID;
    if (!approverID) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }

    const rows = await executeQuery(
      'SELECT tse.*, u.First_name, u.Last_name FROM TimeSheetEntry tse JOIN Users u ON tse.Employee_ID = u.Employee_id WHERE u.ApproverID = ?',
      [approverID]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching approval timesheet:', error);
    handleQueryError(error, res, 'fetching approval timesheet');
  }
});

// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM Projects');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    handleQueryError(error, res, 'fetching projects');
  }
});

// Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM Tasks');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    handleQueryError(error, res, 'fetching tasks');
  }
});

// Save timesheet entries
router.post('/timesheet', async (req, res) => {
  try {
    const entries = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'No valid entries to save' });
    }

    // Prepare queries for transaction
    const queries = entries
      .filter(entry => entry.Hours > 0)
      .map(entry => ({
        query: 'INSERT INTO TimeSheetEntry (Project_ID, Task_ID, Week_Start, Entry_Date, Hours, Employee_ID, Comments, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params: [
          entry.Project_ID,
          entry.Task_ID,
          entry.Week_Start,
          entry.Entry_Date,
          entry.Hours,
          entry.Employee_ID,
          entry.Comments,
          entry.Status
        ]
      }));

    if (queries.length === 0) {
      return res.status(400).json({ error: 'No entries were saved. All entries had 0 hours.' });
    }

    await executeTransaction(queries);
    res.status(201).json({ message: `${queries.length} timesheet entries saved successfully` });
  } catch (error) {
    console.error('Error saving timesheet:', error);
    handleQueryError(error, res, 'saving timesheet entries');
  }
});

// Approve timesheet entry
router.post('/approve-timesheet/:timeSheetE', async (req, res) => {
  try {
    const { timeSheetE } = req.params;
    const result = await executeQuery(
      'UPDATE TimeSheetEntry SET Status = ? WHERE TimeSheetE = ? AND Status = ?',
      ['Approved', timeSheetE, 'Pending']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Timesheet entry not found or already approved' });
    }

    res.status(200).json({ message: 'Timesheet entry approved successfully' });
  } catch (error) {
    console.error('Error approving timesheet:', error);
    handleQueryError(error, res, 'approving timesheet');
  }
});

// Reject timesheet entry
router.post('/reject-timesheet/:timeSheetE', async (req, res) => {
  try {
    const { timeSheetE } = req.params;
    const result = await executeQuery(
      'UPDATE TimeSheetEntry SET Status = ? WHERE TimeSheetE = ? AND Status = ?',
      ['Rejected', timeSheetE, 'Pending']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Timesheet entry not found or already rejected' });
    }

    res.status(200).json({ message: 'Timesheet entry rejected successfully' });
  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    handleQueryError(error, res, 'rejecting timesheet');
  }
});

// Delete timesheet entry
router.delete('/timesheet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'DELETE FROM TimeSheetEntry WHERE TimeSheetE = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    res.status(200).json({ message: 'Timesheet entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timesheet entry:', error);
    handleQueryError(error, res, 'deleting timesheet entry');
  }
});

// Update timesheet entry
router.put('/timesheet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Project_ID, Task_ID, Hours, Employee_ID, Entry_Date, Status } = req.body;

    // Validate input
    if (!Project_ID || !Task_ID || !Hours || !Employee_ID || !Entry_Date || !Status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await executeQuery(
      'UPDATE TimeSheetEntry SET Project_ID = ?, Task_ID = ?, Hours = ?, Employee_ID = ?, Entry_Date = ?, Status = ? WHERE TimeSheetE = ?',
      [Project_ID, Task_ID, Hours, Employee_ID, Entry_Date, Status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    res.status(200).json({ message: 'Timesheet entry updated successfully' });
  } catch (error) {
    console.error('Error updating timesheet entry:', error);
    handleQueryError(error, res, 'updating timesheet entry');
  }
});

// Error handling utility function
const handleQueryError = (error, res, action) => {
  if (error.code === 'ECONNRESET') {
    res.status(500).json({
      error: 'Database connection was reset. Please try again.',
      details: `Error occurred while ${action}.`
    });
  } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    res.status(500).json({
      error: 'Database connection was lost. Please try again.',
      details: `Error occurred while ${action}.`
    });
  } else if (error.code === 'ER_CON_COUNT_ERROR') {
    res.status(500).json({
      error: 'Database has too many connections. Please try again later.',
      details: `Error occurred while ${action}.`
    });
  } else {
    res.status(500).json({
      error: `An error occurred while ${action}.`,
      details: error.message
    });
  }
};

module.exports = router;