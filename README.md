

Smart Habit Tracker API

Overview
The Smart Habit Tracker helps users maintain daily habits by providing a platform to log progress and receive reminders. It encourages consistency through automated updates and analytics.



Features
1. Add habits with a name and daily goal (e.g., "Drink 8 glasses of water").
2. Mark habits as complete for the day.
3. Send daily reminders via WebSocket.
4. Track weekly completion data and visualize progress.



Endpoints
- Add Habit (POST /habits): Create a new habit with its daily goal.
- Update Habit (PUT /habits/:id): Mark a habit as complete for a day.
- Get Habits (GET /habits): Fetch all active habits and their completion status.
- Weekly Report (GET /habits/report): Generate a progress report for the week.



Daily Notifications
- Use WebSocket and Cron jobs to send reminders for incomplete habits at a scheduled time.

Setup Instructions

1. Install Node.js
Download and install Node.js from the [official website](https://nodejs.org/).

2. Install Dependencies
Run the following commands to set up the project:
```bash
npm init -y
npm install express body-parser ws node-cron
```

Code

Here’s the backend implementation for the Smart Habit Tracker API:

```javascript
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
```

---

Run the Server
1. Start the server:
   ```bash
   node server.js
   ```

2. Open a WebSocket client (e.g., WebSocket King) and connect to:
   ```
   ws://localhost:8080
   ```

3. Use a tool like Postman or curl to test the API:
   - Add a habit:
     ```bash
     curl -X POST http://localhost:3000/habits -H "Content-Type: application/json" -d '{"name":"Drink water","dailyGoal":8}'
     ```
   - Mark as complete:
     ```bash
     curl -X PUT http://localhost:3000/habits/1
     ```
   - Fetch all habits:
     ```bash
     curl http://localhost:3000/habits
     ```
   - Get weekly report:
     ```bash
     curl http://localhost:3000/habits/report
     ```

---

WebSocket Notifications
- Notifications are sent at 9:00 AM daily for incomplete habits.
- WebSocket server runs on `ws://localhost:8080`.

