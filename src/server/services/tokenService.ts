import jwt from 'jsonwebtoken';
import { UserDevice } from '../models/UserDevice';
import crypto from 'crypto';

export class TokenService {
    private static instance: TokenService;
    
    private constructor() {}

    static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    // Generate access token (1 year)
    generateAccessToken(userId: string): string {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
    }

    // Generate refresh token (2 years)
    generateRefreshToken(): string {
        return crypto.randomBytes(40).toString('hex');
    }

    // Create new device session
    async createDeviceSession(
        userId: string,
        deviceInfo: {
            deviceId: string;
            deviceName: string;
            deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
            os?: string;
            browser?: string;
            ip?: string;
            location?: string;
        }
    ) {
        const accessToken = this.generateAccessToken(userId);
        const refreshToken = this.generateRefreshToken();
        
        // Set refresh token expiry to 2 years
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setFullYear(refreshTokenExpiry.getFullYear() + 2);

        // Create or update device session
        await UserDevice.findOneAndUpdate(
            {
                userId,
                deviceId: deviceInfo.deviceId
            },
            {
                userId,
                ...deviceInfo,
                token: accessToken,
                refreshToken,
                refreshTokenExpiry,
                isActive: true,
                lastActive: new Date()
            },
            { upsert: true, new: true }
        );

        return {
            accessToken,
            refreshToken
        };
    }

    // Refresh access token using refresh token
    async refreshAccessToken(refreshToken: string) {
        const device = await UserDevice.findOne({
            refreshToken,
            isActive: true
        });

        if (!device) {
            throw new Error('Invalid refresh token');
        }

        if (device.refreshTokenExpiry < new Date()) {
            throw new Error('Refresh token expired');
        }

        // Generate new access token
        const accessToken = this.generateAccessToken(device.userId.toString());
        
        // Update device with new access token
        device.token = accessToken;
        device.lastActive = new Date();
        await device.save();

        return accessToken;
    }

    // Revoke access from a specific device
    async revokeDevice(userId: string, deviceId: string) {
        const device = await UserDevice.findOne({ userId, deviceId });
        if (device) {
            await device.revokeAccess();
        }
    }

    // Revoke access from all devices except current
    async revokeAllOtherDevices(userId: string, currentDeviceId: string) {
        await UserDevice.revokeAllExcept(userId, currentDeviceId);
    }

    // Get all active devices for a user
    async getActiveDevices(userId: string) {
        return UserDevice.findActiveDevices(userId);
    }

    // Verify access token
    verifyAccessToken(token: string): { userId: string } {
        try {
            return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }
}

export const tokenService = TokenService.getInstance(); 