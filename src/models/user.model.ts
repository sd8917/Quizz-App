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
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    roles: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
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


export default model<IUser>('User', UserSchema);