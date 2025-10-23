import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  roles: string[];
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserResponse {
  _id: string;
  username: string;
  email: string;
  token?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest extends ILoginRequest {
  username: string;
}