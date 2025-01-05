import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'play' | 'like' | 'share' | 'friend' | 'playlist';
    songId?: string;
    targetUserId?: mongoose.Types.ObjectId;
    playlistId?: mongoose.Types.ObjectId;
    metadata?: {
        duration?: number;
        completed?: boolean;
        context?: string;
    };
    timestamp: Date;
}

const ActivitySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['play', 'like', 'share', 'friend', 'playlist'],
        required: true
    },
    songId: {
        type: String,
        sparse: true
    },
    targetUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    playlistId: {
        type: Schema.Types.ObjectId,
        ref: 'Playlist',
        sparse: true
    },
    metadata: {
        duration: Number,
        completed: Boolean,
        context: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
ActivitySchema.index({ userId: 1, type: 1, timestamp: -1 });
ActivitySchema.index({ userId: 1, songId: 1, type: 1 });

// TTL index - automatically delete activities older than 30 days
ActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema); 