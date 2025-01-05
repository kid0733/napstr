import mongoose from 'mongoose';

// Connection URLs
const MUSIC_DB_URI = process.env.MONGO_URI;
const USER_DB_URI = process.env.MONGO_USER_URI;

// Connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
};

// Create separate connections for music and user databases
export const connections = {
    music: mongoose.createConnection(MUSIC_DB_URI!, options),
    users: mongoose.createConnection(USER_DB_URI!, options)
};

// Connection event handlers
Object.entries(connections).forEach(([name, connection]) => {
    connection.on('connected', () => {
        console.log(`MongoDB ${name} database connected successfully`);
    });

    connection.on('error', (err) => {
        console.error(`MongoDB ${name} connection error:`, err);
    });

    connection.on('disconnected', () => {
        console.log(`MongoDB ${name} database disconnected`);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await Promise.all(
            Object.values(connections).map(connection => connection.close())
        );
        console.log('MongoDB connections closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during MongoDB shutdown:', error);
        process.exit(1);
    }
}); 