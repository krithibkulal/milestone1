const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory storage for habits
let habits = [];
let completedHabits = [];

// WebSocket server for notifications
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => console.log('Client disconnected'));
});

// Broadcast notifications
function sendNotification(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ message }));
        }
    });
}

// Endpoints

// Add Habit
app.post('/habits', (req, res) => {
    const { name, dailyGoal } = req.body;
    if (!name || !dailyGoal) {
        return res.status(400).json({ error: 'Name and daily goal are required' });
    }

    const newHabit = {
        id: habits.length + 1,
        name,
        dailyGoal,
        completedDays: [],
    };
    habits.push(newHabit);
    res.status(201).json(newHabit);
});

// Update Habit (mark complete for a day)
app.put('/habits/:id', (req, res) => {
    const habitId = parseInt(req.params.id);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (!habit.completedDays.includes(today)) {
        habit.completedDays.push(today);
    }
    res.json(habit);
});

// Get Habits
app.get('/habits', (req, res) => {
    res.json(habits);
});

// Weekly Report
app.get('/habits/report', (req, res) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const report = habits.map((habit) => {
        const weeklyData = habit.completedDays.filter((date) => {
            const habitDate = new Date(date);
            return habitDate >= weekStart && habitDate <= today;
        });

        return {
            name: habit.name,
            dailyGoal: habit.dailyGoal,
            completedDays: weeklyData.length,
        };
    });

    res.json(report);
});

// CRON Job for Daily Notifications
cron.schedule('0 9 * * *', () => {
    const today = new Date().toISOString().split('T')[0];
    const incompleteHabits = habits.filter(
        (habit) => !habit.completedDays.includes(today)
    );

    if (incompleteHabits.length > 0) {
        const message = `Reminder: You have ${incompleteHabits.length} incomplete habits for today.`;
        sendNotification(message);
        console.log(message);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('WebSocket running on ws://localhost:8080');
});
