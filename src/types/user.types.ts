import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  roles: string[];
  createdAt: Date;
  isActive: boolean;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getActiveStatus(): string;
  isOnline(): boolean;
  checkPremiumStatus(): boolean;
}

export interface IUserResponse {
  _id: string;
  username: string;
  email: string;
  role: string;
  isPremium?: boolean;
  premiumExpiresAt?: Date;
  accessToken?: string;
  refreshToken?: string;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  activeStatus?: string;
}

export interface IUserDocument {
  _id: any;
  username: string;
  email: string;
  roles: string[];
  isActive: boolean;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  createdAt: Date;
  lastActiveAt?: Date;
  lastLoginAt?: Date;
  __v?: number;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest extends ILoginRequest {
  username: string;
}