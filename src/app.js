const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');
const { env } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const lostAndFoundRoutes = require('./routes/lostAndFound.routes');
const resourceRoute = require('./routes/notes.routes');
const eventRoutes = require('./routes/event.routes');
const adminRoutes = require('./routes/admin.routes');
const courseRoutes = require('./routes/course.routes');
const app = express();

if (env.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
    req.id = req.get('x-request-id') || crypto.randomUUID();
    res.setHeader('x-request-id', req.id);
    next();
});
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || env.allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        const error = new Error("Origin is not allowed by CORS");
        error.statusCode = 403;
        error.code = "CORS_ORIGIN_DENIED";
        callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: env.jsonLimit }));
app.use(express.urlencoded({ extended: false, limit: env.jsonLimit }));
app.use(cookieParser());
app.use(rateLimit({
    windowMs: env.apiRateLimitWindowMs,
    limit: env.apiRateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
}));
app.get('/health', (_req, res) => res.status(200).json({ success: true, data: { status: 'ok' } }));
app.use('/admin' , adminRoutes)
app.use('/courses', courseRoutes)
app.use('/events', eventRoutes);
app.use("/uploads", express.static("uploads"));
app.use('/api/auth' , authRoutes);
app.use('/users' , userRoutes)
app.use('/lost-found' , lostAndFoundRoutes)
app.use('/resources' , resourceRoute)
if (env.serveWebClient) {
    app.use(express.static(path.join(__dirname, 'frontend'), { extensions: ['html'], maxAge: env.nodeEnv === 'production' ? '1h' : 0 }));
}
// app.use('/lost-found/:id' , lostAndFoundRoutes)

app.use(notFound);
app.use(errorHandler);

module.exports = app;
