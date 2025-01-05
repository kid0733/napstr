import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { connections } from '../config/database';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    lastActive: Date;
    profile: {
        displayName: string;
        avatar?: string;
        bio?: string;
    };
    social: {
        friends: mongoose.Types.ObjectId[];
        friendRequests: {
            incoming: mongoose.Types.ObjectId[];
            outgoing: mongoose.Types.ObjectId[];
        };
    };
    preferences: {
        privateProfile: boolean;
        shareListening: boolean;
        allowFriendRequests: boolean;
    };
    stats: {
        totalPlayTime: number;
        songCount: number;
        joinDate: Date;
    };
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    profile: {
        displayName: {
            type: String,
            required: true,
            trim: true
        },
        avatar: String,
        bio: {
            type: String,
            maxlength: 500
        }
    },
    social: {
        friends: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        friendRequests: {
            incoming: [{
                type: Schema.Types.ObjectId,
                ref: 'User'
            }],
            outgoing: [{
                type: Schema.Types.ObjectId,
                ref: 'User'
            }]
        }
    },
    preferences: {
        privateProfile: {
            type: Boolean,
            default: false
        },
        shareListening: {
            type: Boolean,
            default: true
        },
        allowFriendRequests: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        totalPlayTime: {
            type: Number,
            default: 0
        },
        songCount: {
            type: Number,
            default: 0
        },
        joinDate: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
UserSchema.index({ username: 1, email: 1 });
UserSchema.index({ 'social.friends': 1 });
UserSchema.index({ lastActive: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Use the users connection instead of default mongoose
export const User = connections.users.model<IUser>('User', UserSchema); 