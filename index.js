const express = require('express');
const cors = require('cors');
const yaml = require('yamljs');
const path = require('path');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const protectedRouter = require('./src/routes/protectedRouter');
const publicRouter = require('./src/routes/publicRouter');
const authorizationMiddleware = require('./src/middlewares/authorizationMiddleware');
const controller = require("./src/controllers/statsController");

// env variables
const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/stats';
const isDebug = process.env.NODE_ENV == 'debug';
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

// Swagger setup
const swaggerDocument = yaml.load(path.join(__dirname, './docs/swagger.yaml'));

// Mongoose setup
mongoose.connect(connectionString);

// Server setup
const app = express();
const corsOptions = {
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));
// Handle preflight requests
app.options('*', cors(corsOptions));

// Debugging middleware
if (isDebug) {
    app.use((req, _, next) => {
        console.log(`[DEBUG] Request received: ${req.method} ${req.originalUrl}`);
        next();
    });
}

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Public API routes
app.use('/', publicRouter);

// Internal API routes
app.post('/results', authorizationMiddleware.internalAuthorize, controller.addResult)

// Authorization middleware
app.use(authorizationMiddleware.authorize);

// Protected API routes
app.use('/', protectedRouter);

app.listen(3000, () => console.log("Server started"));
