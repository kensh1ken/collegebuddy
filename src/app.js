const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const lostAndFoundRoutes = require('./routes/lostAndFound.routes');
const lostAndFound = require('./models/lostAndFound.model');
const resourceRoute = require('./routes/notes.routes');
const eventRoutes = require('./routes/event.routes');
const adminRoutes = require('./routes/admin.routes');
const app = express();

const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501"
];

app.use(express.json());
require('dotenv').config();
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(cookieParser());
app.use('/admin' , adminRoutes)
app.use('/events', eventRoutes);
app.use("/uploads", express.static("uploads"));
app.use('/api/auth' , authRoutes);
app.use('/users' , userRoutes)
app.use('/lost-found' , lostAndFoundRoutes)
app.use('/resources' , resourceRoute)
// app.use('/lost-found/:id' , lostAndFoundRoutes)

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }

    if (err) {
        return res.status(400).json({ message: err.message || 'Request failed' });
    }

    next();
});

// app.use(authRoutes);

module.exports = app;