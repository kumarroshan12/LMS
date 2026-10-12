import { calculateAgeFromDOB, isValidPAN } from '../utils/math';

export interface BreInput {
  fullName: string;
  pan: string;
  dateOfBirth: string | Date;
  monthlySalary: number;
  employmentMode: 'Salaried' | 'Self-Employed' | 'Unemployed';
}

export interface BreResult {
  isEligible: boolean;
  age: number;
  errors: string[];
}

export class BreService {
  /**
   * Business Rule Engine (BRE) evaluated strictly on server:
   * Rule 1: Age not between 23 and 50 -> REJECT
   * Rule 2: Salary below ₹25,000 / month -> REJECT
   * Rule 3: PAN does not match valid PAN format -> REJECT
   * Rule 4: Applicant is Unemployed -> REJECT
   */
  public evaluateEligibility(input: BreInput): BreResult {
    const errors: string[] = [];
    const age = calculateAgeFromDOB(input.dateOfBirth);

    // Rule 1: Age Check (Between 23 and 50)
    if (isNaN(age) || age < 23 || age > 50) {
      errors.push(
        `Age restriction: Applicant is ${isNaN(age) ? 'invalid age' : age + ' years old'}. Eligibility requires age between 23 and 50 years.`
      );
    }

    // Rule 2: Monthly Salary (Minimum ₹25,000)
    if (!input.monthlySalary || input.monthlySalary < 25000) {
      errors.push(
        `Salary restriction: Monthly salary (₹${(input.monthlySalary || 0).toLocaleString()}) is below the required threshold of ₹25,000.`
      );
    }

    // Rule 3: PAN Format
    if (!isValidPAN(input.pan)) {
      errors.push(
        `PAN format invalid: '${input.pan}' does not match standard 10-character PAN format (e.g. ABCDE1234F).`
      );
    }

    // Rule 4: Employment Mode
    if (input.employmentMode === 'Unemployed') {
      errors.push(
        `Employment status: Applicants who are currently Unemployed cannot proceed with a loan application.`
      );
    }

    return {
      isEligible: errors.length === 0,
      age,
      errors,
    };
  }
}
