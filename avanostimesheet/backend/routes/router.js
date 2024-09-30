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
    const weekStart = req.query.weekStart; // Expect weekStart as a query parameter

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
    const { Project_ID, Task_ID, Week_Start, Entries, Employee_ID, Comments } = req.body;

    if (!Project_ID || !Task_ID || !Week_Start || !Entries || !Employee_ID) {
      if (!Employee_ID) {
        return res.status(400).json({ error: 'Missing employee ID.' });
      }
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Iterate over each day's entry in the week
    const status = 'Pending';  // Automatic status
    for (const entry of Entries) {
      const { Entry_Date, Hours } = entry;

      if (!Entry_Date || !Hours) {
        return res.status(400).json({ error: 'Each entry must have an Entry_Date and Hours' });
      }

      await db.query(
        'INSERT INTO TimeSheetEntry (Project_ID, Task_ID, Week_Start, Entry_Date, Hours, Employee_ID, Comments, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [Project_ID, Task_ID, Week_Start, Entry_Date, Hours, Employee_ID, Comments, status]
      );
    }

    res.status(201).json({ message: 'Timesheet entries saved successfully' });
  } catch (error) {
    console.error('Error saving timesheet:', error);
    res.status(500).json({ error: 'An error occurred while saving timesheet entries' });
  }
});


module.exports = router;