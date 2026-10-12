export enum LoanStatus {
  DRAFT = 'DRAFT', // Registered / In-progress, pre-application
  APPLIED = 'APPLIED', // Submitted by borrower, awaiting sanction review
  REJECTED = 'REJECTED', // Rejected by sanction executive
  SANCTIONED = 'SANCTIONED', // Approved by sanction executive, awaiting disbursement
  DISBURSED = 'DISBURSED', // Funds released by disbursement executive, active repayment phase
  CLOSED = 'CLOSED', // Entire repayment fulfilled
}
