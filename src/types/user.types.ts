import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  roles: string[];
  createdAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getActiveStatus(): string;
  isOnline(): boolean;
}

export interface IUserResponse {
  _id: string;
  username: string;
  email: string;
  role: string;
  accessToken?: string;
  refreshToken?: string;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  activeStatus?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest extends ILoginRequest {
  username: string;
}