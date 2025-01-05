
import mongoose, { Schema, Document, Model } from 'mongoose';
import { connections } from '../config/database';

export interface IUserDevice extends Document {
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
    token: string;
    lastActive: Date;
    isActive: boolean;
    createdAt: Date;
    refreshToken: string;
    refreshTokenExpiry: Date;
    deviceInfo: {
        os?: string;
        browser?: string;
        ip?: string;
        location?: string;
    };
    revokeAccess(): Promise<void>;
}

interface IUserDeviceModel extends Model<IUserDevice> {
    findActiveDevices(userId: string): Promise<IUserDevice[]>;
    revokeAllExcept(userId: string, deviceId: string): Promise<any>;
}

const UserDeviceSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    deviceId: {
        type: String,
        required: true,
        index: true
    },
    deviceName: {
        type: String,
        required: true
    },
    deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'other'],
        default: 'other'
    },
    token: {
        type: String,
        required: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    refreshTokenExpiry: {
        type: Date,
        required: true
    },
    deviceInfo: {
        os: String,
        browser: String,
        ip: String,
        location: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
UserDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
UserDeviceSchema.index({ refreshToken: 1 });
UserDeviceSchema.index({ lastActive: 1 });

// Auto-update lastActive
UserDeviceSchema.pre('save', function(next) {
    if (this.isModified('token')) {
        this.lastActive = new Date();
    }
    next();
});

// Instance methods
UserDeviceSchema.methods.revokeAccess = async function(this: IUserDevice): Promise<void> {
    this.isActive = false;
    this.token = '';
    this.refreshToken = '';
    await this.save();
};

// Static methods
UserDeviceSchema.statics.findActiveDevices = function(userId: string): Promise<IUserDevice[]> {
    return this.find({
        userId,
        isActive: true
    }).sort({ lastActive: -1 });
};

UserDeviceSchema.statics.revokeAllExcept = async function(userId: string, deviceId: string) {
    return this.updateMany(
        {
            userId,
            deviceId: { $ne: deviceId },
            isActive: true
        },
        {
            $set: {
                isActive: false,
                token: '',
                refreshToken: ''
            }
        }
    );
};

// Use the users connection instead of default mongoose
export const UserDevice = connections.users.model<IUserDevice, IUserDeviceModel>('UserDevice', UserDeviceSchema); 