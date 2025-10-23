import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

// a menthod on user model to compare password
UserSchema.methods.comparePassword = function (password: string) {
    return bcrypt.compare(password, this.password);
};


export default model<IUser>('User', UserSchema);