const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
const PORT = 3000;

// Middleware to parse JSON data
app.use(bodyParser.json());

// Placeholder for habit storage
let habits = [];

// POST /habits: Add a new habit
app.post('/habits', (req, res) => {
    const { name, dailyGoal } = req.body;

    if (!name || !dailyGoal) {
        return res.status(400).json({ status: 'error', error: 'Name and daily goal are required.' });
    }

    const newHabit = {
        id: habits.length + 1,
        name,
        dailyGoal,
        progress: [], // Tracks daily completion
    };

    habits.push(newHabit);
    res.status(201).json({ status: 'success', data: newHabit });
});

// PUT /habits/:id: Mark a habit as complete for today
app.put('/habits/:id', (req, res) => {
    const { id } = req.params;
    const habit = habits.find(h => h.id === parseInt(id));

    if (!habit) {
        return res.status(404).json({ status: 'error', error: 'Habit not found.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (!habit.progress.includes(today)) {
        habit.progress.push(today); // Mark as complete for today
    }

    res.json({ status: 'success', data: habit });
});

// GET /habits: Fetch all habits and their status
app.get('/habits', (req, res) => {
    res.json({ status: 'success', data: habits });
});

// GET /habits/report: Generate a weekly report
app.get('/habits/report', (req, res) => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const weeklyReport = habits.map(habit => {
        const weeklyProgress = habit.progress.filter(date => {
            const habitDate = new Date(date);
            return habitDate >= oneWeekAgo && habitDate <= today;
        });

        return {
            name: habit.name,
            weeklyCompletion: weeklyProgress.length,
            dailyGoal: habit.dailyGoal,
        };
    });

    res.json({ status: 'success', data: weeklyReport });
});

// Cron job to send reminders for incomplete habits at 8:00 AM daily
cron.schedule('0 8 * * *', () => {
    const today = new Date().toISOString().split('T')[0];
    const incompleteHabits = habits.filter(habit => !habit.progress.includes(today));

    if (incompleteHabits.length > 0) {
        console.log('Reminder: Complete your habits for today!');
        incompleteHabits.forEach(habit => {
            console.log(`- ${habit.name}`);
        });
    } else {
        console.log('Great job! All habits completed for today!');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
