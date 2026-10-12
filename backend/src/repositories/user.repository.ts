import { UserModel, IUser } from '../models/User';
import { UserRole } from '../constants/roles';

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    return UserModel.create(userData);
  }

  async findUsersByRole(role: UserRole): Promise<IUser[]> {
    return UserModel.find({ role }).sort({ createdAt: -1 });
  }

  // Find borrowers who have not applied for any loan (leads for Sales module)
  async findLeads(): Promise<IUser[]> {
    return UserModel.aggregate([
      { $match: { role: UserRole.BORROWER } },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'borrowerId',
          as: 'loans',
        },
      },
      {
        $match: {
          $or: [
            { loans: { $size: 0 } },
            { 'loans.status': 'DRAFT' },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }
}
