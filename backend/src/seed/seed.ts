import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { LoanModel } from '../models/Loan';
import { PaymentModel } from '../models/Payment';
import { UserRole } from '../constants/roles';
import { LoanStatus } from '../constants/loanStatus';
import { calculateLoanTerms } from '../utils/math';
import { ENV } from '../config/env';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    // Let the seed clear legacy fixtures before creating newly-added unique indexes.
    await mongoose.connect(ENV.MONGO_URI, { autoIndex: false });
    console.log('[Seed] Connected.');

    // Clear existing data for clean seed
    await UserModel.deleteMany({});
    await LoanModel.deleteMany({});
    await PaymentModel.deleteMany({});
    // Rebuild the partial unique index after the old sample loans are removed,
    // before inserting the fixtures below.
    await LoanModel.syncIndexes();
    console.log('[Seed] Cleaned existing collections.');

    const defaultPassword = 'Password@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // 1. Seed Roles with predictable evaluator credentials
    const usersData = [
      {
        fullName: 'System Administrator',
        email: 'admin@lms.com',
        passwordHash,
        role: UserRole.ADMIN,
        phone: '+91 9876543210',
      },
      {
        fullName: 'Sarah Sales Executive',
        email: 'sales@lms.com',
        passwordHash,
        role: UserRole.SALES,
        phone: '+91 9876543211',
      },
      {
        fullName: 'Suresh Sanction Officer',
        email: 'sanction@lms.com',
        passwordHash,
        role: UserRole.SANCTION,
        phone: '+91 9876543212',
      },
      {
        fullName: 'Deepa Disbursement Officer',
        email: 'disbursement@lms.com',
        passwordHash,
        role: UserRole.DISBURSEMENT,
        phone: '+91 9876543213',
      },
      {
        fullName: 'Chirag Collection Officer',
        email: 'collection@lms.com',
        passwordHash,
        role: UserRole.COLLECTION,
        phone: '+91 9876543214',
      },
      {
        fullName: 'Rahul Sharma (Borrower Lead)',
        email: 'rahul.lead@lms.com',
        passwordHash,
        role: UserRole.BORROWER,
        phone: '+91 9876543215',
        customerProfile: {
          fullName: 'Rahul Sharma',
          pan: 'ABCRS1234D',
          dateOfBirth: new Date('1996-07-12'),
          monthlySalary: 50000,
          employmentMode: 'Salaried',
          eligibility: { isEligible: true, checkedAt: new Date() },
        },
      },
      {
        fullName: 'Priya Verma (Active Borrower)',
        email: 'borrower@lms.com',
        passwordHash,
        role: UserRole.BORROWER,
        phone: '+91 9876543216',
      },
      {
        fullName: 'Vikram Mehta (Sanction Demo Borrower)',
        email: 'vikram.borrower@lms.com',
        passwordHash,
        role: UserRole.BORROWER,
        phone: '+91 9876543217',
      },
      {
        fullName: 'Ananya Roy (Collection Demo Borrower)',
        email: 'ananya.borrower@lms.com',
        passwordHash,
        role: UserRole.BORROWER,
        phone: '+91 9876543218',
      },
    ];

    const seededUsers = await UserModel.insertMany(usersData);
    console.log(`[Seed] Created ${seededUsers.length} accounts.`);

    const admin = seededUsers.find((u) => u.role === UserRole.ADMIN)!;
    const sanctionUser = seededUsers.find((u) => u.role === UserRole.SANCTION)!;
    const disbUser = seededUsers.find((u) => u.role === UserRole.DISBURSEMENT)!;
    const collectUser = seededUsers.find((u) => u.role === UserRole.COLLECTION)!;
    const borrower = seededUsers.find((u) => u.email === 'borrower@lms.com')!;
    const sanctionedBorrower = seededUsers.find((u) => u.email === 'vikram.borrower@lms.com')!;
    const disbursedBorrower = seededUsers.find((u) => u.email === 'ananya.borrower@lms.com')!;

    // 2. Seed Sample Loan 1: APPLIED (For Sanction Officer to review/approve/reject)
    const terms1 = calculateLoanTerms(150000, 180, 12);
    await LoanModel.create({
      borrowerId: borrower._id,
      fullName: 'Priya Verma',
      pan: 'ABCDE1234F',
      dateOfBirth: new Date('1995-05-15'),
      monthlySalary: 65000,
      employmentMode: 'Salaried',
      salarySlipUrl: '/uploads/sample-salary-slip.pdf',
      salarySlipOriginalName: 'salary_slip_priya.pdf',
      principalAmount: terms1.principalAmount,
      tenureDays: terms1.tenureDays,
      interestRate: terms1.interestRate,
      interestAmount: terms1.interestAmount,
      totalRepayment: terms1.totalRepayment,
      totalPaid: 0,
      balanceRemaining: terms1.totalRepayment,
      status: LoanStatus.APPLIED,
    });

    // 3. Seed Sample Loan 2: SANCTIONED (For Disbursement Officer to release funds)
    const terms2 = calculateLoanTerms(250000, 90, 12);
    await LoanModel.create({
      borrowerId: sanctionedBorrower._id,
      fullName: 'Vikram Mehta',
      pan: 'BKMPL9876A',
      dateOfBirth: new Date('1988-11-20'),
      monthlySalary: 95000,
      employmentMode: 'Salaried',
      salarySlipUrl: '/uploads/sample-salary-slip.pdf',
      salarySlipOriginalName: 'salary_slip_vikram.pdf',
      principalAmount: terms2.principalAmount,
      tenureDays: terms2.tenureDays,
      interestRate: terms2.interestRate,
      interestAmount: terms2.interestAmount,
      totalRepayment: terms2.totalRepayment,
      totalPaid: 0,
      balanceRemaining: terms2.totalRepayment,
      status: LoanStatus.SANCTIONED,
      sanctionedBy: sanctionUser._id,
      sanctionedAt: new Date(Date.now() - 3600000 * 24),
    });

    // 4. Seed Sample Loan 3: DISBURSED (For Collection Officer to record payments)
    const terms3 = calculateLoanTerms(100000, 60, 12);
    const disbursedLoan = await LoanModel.create({
      borrowerId: disbursedBorrower._id,
      fullName: 'Ananya Roy',
      pan: 'CRUPR5544K',
      dateOfBirth: new Date('1992-03-10'),
      monthlySalary: 72000,
      employmentMode: 'Salaried',
      salarySlipUrl: '/uploads/sample-salary-slip.pdf',
      salarySlipOriginalName: 'salary_slip_ananya.pdf',
      principalAmount: terms3.principalAmount,
      tenureDays: terms3.tenureDays,
      interestRate: terms3.interestRate,
      interestAmount: terms3.interestAmount,
      totalRepayment: terms3.totalRepayment,
      totalPaid: 20000,
      balanceRemaining: Math.round((terms3.totalRepayment - 20000) * 100) / 100,
      status: LoanStatus.DISBURSED,
      sanctionedBy: sanctionUser._id,
      sanctionedAt: new Date(Date.now() - 3600000 * 48),
      disbursedBy: disbUser._id,
      disbursedAt: new Date(Date.now() - 3600000 * 36),
      disbursementReference: 'DISB-20261012-9842',
    });

    // Seed 1 payment for the disbursed loan
    await PaymentModel.create({
      loanId: disbursedLoan._id,
      utrNumber: 'CMS982347101298',
      amount: 20000,
      paymentDate: new Date(Date.now() - 3600000 * 12),
      collectedBy: collectUser._id,
    });

    console.log('[Seed] Sample lifecycle loans and payments populated.');
    console.log('\n================ CREDENTIALS READY FOR EVALUATOR ================');
    console.log('Password for ALL pre-created accounts: Password@123');
    console.log('1. Admin:         admin@lms.com');
    console.log('2. Sales:         sales@lms.com');
    console.log('3. Sanction:      sanction@lms.com');
    console.log('4. Disbursement:  disbursement@lms.com');
    console.log('5. Collection:    collection@lms.com');
    console.log('6. Borrower:      borrower@lms.com (also rahul.lead@lms.com for Sales lead)');
    console.log('7. Sanction demo borrower: vikram.borrower@lms.com');
    console.log('8. Collection demo borrower: ananya.borrower@lms.com');
    console.log('==================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
