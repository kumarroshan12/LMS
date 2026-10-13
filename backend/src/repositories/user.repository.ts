import { UserModel, IUser } from '../models/User';
import { UserRole } from '../constants/roles';

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
  }

  async updateCustomerProfile(userId: string, profile: NonNullable<IUser['customerProfile']>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { $set: { customerProfile: profile } },
      { new: true, runValidators: true }
    );
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    return UserModel.create(userData);
  }

  async findUsersByRole(role: UserRole): Promise<IUser[]> {
    return UserModel.find({ role }).sort({ createdAt: -1 });
  }

  // Sales works only eligible borrowers who have not submitted an application.
  async findLeads(): Promise<IUser[]> {
    return UserModel.aggregate([
      {
        $match: {
          role: UserRole.BORROWER,
          'customerProfile.eligibility.isEligible': true,
        },
      },
      {
        $lookup: {
          from: 'loans',
          let: { borrowerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$borrowerId', '$$borrowerId'] },
                    { $ne: ['$status', 'DRAFT'] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'submittedApplications',
        },
      },
      { $match: { submittedApplications: { $size: 0 } } },
      { $sort: { createdAt: -1 } },
    ]);
  }
}
