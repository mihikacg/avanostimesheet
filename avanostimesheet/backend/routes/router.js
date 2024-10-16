const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
});

router.get('/timesheet', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM TimeSheetEntry');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching timesheet entries.' });
  }
});

router.get('/timesheet/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const weekStart = req.query.weekStart; 

    if (!weekStart) {
      return res.status(400).json({ error: 'Week start date is required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM TimeSheetEntry WHERE Employee_ID = ? AND DATE(Week_Start) = DATE(?)',
      [employeeId, weekStart]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching timesheet entries' });
  }
});


router.get('/approval-timesheet/:approverID', async (req, res) => {
  try {
    const approverID = req.params.approverID;
    if (!approverID) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }

    const [rows] = await db.query(
      'SELECT tse.*, u.First_name, u.Last_name FROM TimeSheetEntry tse JOIN Users u ON tse.Employee_ID = u.Employee_id WHERE u.ApproverID = ?',
      [approverID]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching approval timesheet:', error);
    res.status(500).json({ error: 'An error occurred while fetching timesheet entries' });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Projects');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching projects' });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Tasks');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching tasks' });
  }
});

router.post('/timesheet', async (req, res) => {
  try {
    const entries = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'No valid entries to save' });
    }

    let savedCount = 0;

    for (const entry of entries) {
      const { Project_ID, Task_ID, Week_Start, Entry_Date, Hours, Employee_ID, Comments, Status } = entry;

      if (Hours > 0) {
        await db.query(
          'INSERT INTO TimeSheetEntry (Project_ID, Task_ID, Week_Start, Entry_Date, Hours, Employee_ID, Comments, Status) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)',
          [Project_ID, Task_ID, Week_Start, Entry_Date, Hours, Employee_ID, Comments, Status]
        );
        savedCount++;
      }
    }

    if (savedCount > 0) {
      res.status(201).json({ message: `${savedCount} timesheet entries saved successfully` });
    } else {
      res.status(400).json({ error: 'No entries were saved. All entries had 0 hours.' });
    }
  } catch (error) {
    console.error('Error saving timesheet:', error);
    res.status(500).json({ error: 'An error occurred while saving timesheet entries' });
  }
});

router.post('/approve-timesheet/:timeSheetE', async (req, res) => {
  const { timeSheetE } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE TimeSheetEntry SET Status = ? WHERE TimeSheetE = ? AND Status = ?',
      ['Approved', timeSheetE, 'Pending']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Timesheet entry not found or already approved' });
    }

    res.status(200).json({ message: 'Timesheet entry approved successfully' });
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ message: 'An error occurred while approving the timesheet entry' });
  }
});

router.post('/reject-timesheet/:timeSheetE', async (req, res) => {
  const { timeSheetE } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE TimeSheetEntry SET Status = ? WHERE TimeSheetE = ? AND Status = ?',
      ['Rejected', timeSheetE, 'Pending']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Timesheet entry not found or already rejected' });
    }

    res.status(200).json({ message: 'Timesheet entry rejected successfully' });
  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    res.status(500).json({ message: 'An error occurred while rejecting the timesheet entry' });
  }
});

module.exports = router;