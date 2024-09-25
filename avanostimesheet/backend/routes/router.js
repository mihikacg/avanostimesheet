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

module.exports = router;