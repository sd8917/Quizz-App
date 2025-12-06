import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        minlength: [5, 'Username must be at least 5 characters'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})$/,
            'Please enter a valid email address'
        ]
    },
    googleId: {
        type: String,
        required: false,
        unique: false,
        sparse: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    roles: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    const user = this as any;
    if (!user.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// a menthod on user model to compare password
UserSchema.methods.comparePassword = function (password: string) {
    return bcrypt.compare(password, this.password);
};

// Check if user is currently online (active within last 5 minutes)
UserSchema.methods.isOnline = function (): boolean {
    if (!this.lastActiveAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastActiveAt > fiveMinutesAgo;
};

// Get human-readable active status
UserSchema.methods.getActiveStatus = function (): string {
    if (!this.lastActiveAt) return 'Never active';
    
    const now = Date.now();
    const lastActive = this.lastActiveAt.getTime();
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 5) return 'Online';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return this.lastActiveAt.toLocaleDateString();
};

// Check if user has active premium subscription
UserSchema.methods.checkPremiumStatus = function (): boolean {
    if (!this.isPremium) return false;
    
    // If no expiry date, premium is permanent
    if (!this.premiumExpiresAt) return true;
    
    // Check if premium has expired
    const now = new Date();
    if (this.premiumExpiresAt < now) {
        // Auto-expire premium
        this.isPremium = false;
        this.save().catch((err: any) => console.error('Failed to auto-expire premium:', err));
        return false;
    }
    
    return true;
};


export default model<IUser>('User', UserSchema);