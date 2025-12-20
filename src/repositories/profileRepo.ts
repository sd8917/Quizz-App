
import User from '../models/user.model';
import { IUser } from '../types/user.types';

class ProfileRepo {
    // with password.
    /*
        ALERT: HANDLE IT CAREFULLY
    */
  async getUserById(userId: string) {
    return User.findById(userId);
  }

  // without password.
  async getUserProfile(userId: string) {
    return User.findById(userId).select('-password');
  }

  async updateById(userId: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(userId, data, { new: true });
  }

  async findAll(filter: any = {}) {
    return User.find(filter);
  }
}

export default new ProfileRepo();
