import { Request, Response, NextFunction } from 'express';
import { MongooseError } from 'mongoose';

// Handle specific error types
export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production mode
        if (err.isOperational) {
            // Operational, trusted error: send message to client
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // Programming or other unknown error: don't leak error details
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    }
};

// Handle MongoDB/Mongoose errors
export const handleMongooseError = (err: MongooseError): AppError => {
    if (err.name === 'ValidationError') {
        return new AppError('Invalid input data', 400);
    }
    if (err.name === 'CastError') {
        return new AppError('Invalid ID format', 400);
    }
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue)[0];
        return new AppError(`Duplicate ${field}. Please use another value`, 400);
    }
    return new AppError('Database error', 500);
}; 