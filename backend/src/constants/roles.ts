export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  SANCTION = 'sanction',
  DISBURSEMENT = 'disbursement',
  COLLECTION = 'collection',
  BORROWER = 'borrower',
}

export const EXECUTIVE_ROLES = [
  UserRole.SALES,
  UserRole.SANCTION,
  UserRole.DISBURSEMENT,
  UserRole.COLLECTION,
];
