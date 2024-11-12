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
    const result = await executeQuery('SELECT 1 AS result');
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
    const rows = await executeQuery('SELECT * FROM [hcp0nedb].[dbo].[tbl_TS_Users]');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    handleQueryError(error, res, 'fetching users');
  }
});

// Get all timesheet entries
router.get('/timesheet', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry]');
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
       FROM [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry] tse
       LEFT JOIN [hcp0nedb].[dbo].[tbl_TS_Projects] p ON tse.Project_ID = p.Project_ID
       LEFT JOIN [hcp0nedb].[dbo].[tbl_TS_Tasks] t ON tse.Task_ID = t.Task_ID
       WHERE tse.Employee_ID = @param0 
       AND CONVERT(DATE, tse.Week_Start) = CONVERT(DATE, @param1)`,
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
      `SELECT 
        tse.*, 
        u.First_name, 
        u.Last_name,
        p.Project_Name,
        t.Task_Name
       FROM [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry] tse 
       JOIN [hcp0nedb].[dbo].[tbl_TS_Users] u ON tse.Employee_ID = u.Employee_id 
       LEFT JOIN [hcp0nedb].[dbo].[tbl_TS_Projects] p ON tse.Project_ID = p.Project_ID
       LEFT JOIN [hcp0nedb].[dbo].[tbl_TS_Tasks] t ON tse.Task_ID = t.Task_ID
       WHERE u.ApproverID = @param0
       ORDER BY tse.Entry_Date DESC`,
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
    const rows = await executeQuery('SELECT * FROM [hcp0nedb].[dbo].[tbl_TS_Projects]');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    handleQueryError(error, res, 'fetching projects');
  }
});

// Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM [hcp0nedb].[dbo].[tbl_TS_Tasks]');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    handleQueryError(error, res, 'fetching tasks');
  }
});



router.post('/timesheet', async (req, res) => {
  try {
    const entries = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'No valid entries to save' });
    }

    // Prepare queries for transaction - just insert new entries
    const queries = entries
      .filter(entry => entry.Hours > 0)
      .map(entry => ({
        query: `INSERT INTO [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry]
                (Project_ID, Task_ID, Week_Start, Entry_Date, Hours, Employee_ID, Comments, Status)
                VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7)`,
        params: [
          entry.Project_ID,
          entry.Task_ID,
          entry.Week_Start,
          entry.Entry_Date,
          entry.Hours,
          entry.Employee_ID,
          entry.Comments || '',
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

router.post('/approve-timesheet/:timeSheetEntryId', async (req, res) => {
  try {
    const timeSheetEntryId = req.params.timeSheetEntryId;
    const result = await executeQuery(
      `UPDATE [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry] 
       SET Status = @param0 
       WHERE TimeSheetEntry_ID = @param1 
       AND Status = @param2`,
      ['Approved', timeSheetEntryId, 'InProgress']
    );

    if (!result.rowsAffected[0]) {
      return res.status(404).json({ 
        message: 'Timesheet entry not found or not in InProgress status' 
      });
    }

    res.json({ 
      success: true,
      message: 'Timesheet entry approved successfully',
      timeSheetEntryId: timeSheetEntryId
    });
  } catch (error) {
    console.error('Error approving timesheet:', error);
    handleQueryError(error, res, 'approving timesheet');
  }
});

// Reject timesheet entry
router.post('/reject-timesheet/:timeSheetEntryId', async (req, res) => {
  try {
    const timeSheetEntryId = req.params.timeSheetEntryId;
    const result = await executeQuery(
      `UPDATE [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry] 
       SET Status = @param0 
       WHERE TimeSheetEntry_ID = @param1 
       AND Status = @param2`,
      ['Rejected', timeSheetEntryId, 'InProgress']
    );

    if (!result.rowsAffected[0]) {
      return res.status(404).json({ 
        message: 'Timesheet entry not found or not in InProgress status' 
      });
    }

    res.json({ 
      success: true,
      message: 'Timesheet entry rejected successfully',
      timeSheetEntryId: timeSheetEntryId
    });
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
      'DELETE FROM [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry] WHERE TimeSheetEntry_ID = @param0',
      [id]
    );

    if (!result.rowsAffected[0]) {
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

    if (!Project_ID || !Task_ID || !Hours || !Employee_ID || !Entry_Date || !Status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await executeQuery(
      `UPDATE [hcp0nedb].[dbo].[tbl_TS_TimeSheetEntry] 
       SET Project_ID = @param0, 
           Task_ID = @param1, 
           Hours = @param2, 
           Employee_ID = @param3, 
           Entry_Date = @param4, 
           Status = @param5 
       WHERE TimeSheetEntry_ID = @param6`,
      [Project_ID, Task_ID, Hours, Employee_ID, Entry_Date, Status, id]
    );

    if (!result.rowsAffected[0]) {
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
  if (error.code === 'ETIMEOUT') {
    res.status(500).json({
      error: 'Database request timed out. Please try again.',
      details: `Error occurred while ${action}.`
    });
  } else if (error.code === 'EREQUEST') {
    res.status(500).json({
      error: 'Invalid database request. Please check your input.',
      details: `Error occurred while ${action}.`
    });
  } else if (error.code === 'ECONNRESET') {
    res.status(500).json({
      error: 'Connection was reset. Please try again.',
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