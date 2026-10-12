export interface LoanMathResult {
  principalAmount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
}

/**
 * Calculates Simple Interest as specified in LMS Assignment:
 * SI = (P * R * T) / (365 * 100) where T = tenure in days
 * Total Repayment = P + SI
 */
export const calculateLoanTerms = (
  principalAmount: number,
  tenureDays: number,
  interestRate: number = 12
): LoanMathResult => {
  // SI = (P * R * T) / (365 * 100)
  const rawSI = (principalAmount * interestRate * tenureDays) / (365 * 100);
  const interestAmount = Math.round(rawSI * 100) / 100; // round to 2 decimal places
  const totalRepayment = Math.round((principalAmount + interestAmount) * 100) / 100;

  return {
    principalAmount,
    tenureDays,
    interestRate,
    interestAmount,
    totalRepayment,
  };
};

/**
 * Validates Indian PAN format: 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)
 */
export const isValidPAN = (pan: string): boolean => {
  if (!pan) return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
};

/**
 * Calculates age in full years from date of birth
 */
export const calculateAgeFromDOB = (dobStringOrDate: string | Date): number => {
  const dob = new Date(dobStringOrDate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};
