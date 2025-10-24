import jwt from 'jsonwebtoken';
import { IUser, ILoginRequest, IRegisterRequest, IUserResponse } from '../types';
import User from '../models/user.model';

export class AuthService {
  private static generateToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
      expiresIn: '30d',
    });
  }

  private static formatUserResponse(user: IUser, token?: string): IUserResponse {
    return {
      _id: (user._id as string).toString(),
      username: user.username,
      email: user.email,
      ...(token && { token })
    };
  }

  async register(userData: IRegisterRequest): Promise<IUserResponse> {
    console.log("userData ", userData)
    const { username, email, password } = userData;

    // Check if user exists
    const userExists = await User.findOne({ $and: [{ email }, { name: username }] });
    if (userExists) {
      throw new Error('User already exists');
    }

    // Create user with correct fields and default role
    const user = await User.create({
      username,
      email,
      password,
      roles: ['user'],
    });

    const token = AuthService.generateToken((user._id as string).toString());
    return AuthService.formatUserResponse(user, token);
  }

  async login(credentials: ILoginRequest): Promise<IUserResponse> {
    const { email, password } = credentials;

    // Find user and validate
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = AuthService.generateToken((user._id as string).toString());
    return AuthService.formatUserResponse(user, token);
  }

  async getUserById(id: string): Promise<IUserResponse> {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return AuthService.formatUserResponse(user);
  }
}