import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { UserRole } from '../constants/roles';
import { ENV } from '../config/env';
import { IUser } from '../models/User';

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  public async register(
    fullName: string,
    email: string,
    password: string,
    role: UserRole = UserRole.BORROWER,
    phone?: string
  ): Promise<{ user: Partial<IUser>; token: string }> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await this.userRepo.create({
      fullName,
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      phone,
    });

    const token = this.generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
    });

    return {
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
      token,
    };
  }

  public async login(
    email: string,
    password: string
  ): Promise<{ user: Partial<IUser>; token: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password credentials.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password credentials.');
    }

    const token = this.generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      token,
    };
  }

  public generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  public verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, ENV.JWT_SECRET) as AuthTokenPayload;
  }
}
