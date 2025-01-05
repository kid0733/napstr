import express from 'express';
import './config/database';  // This will initialize our database connections
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(express.json());

// Routes will go here

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 