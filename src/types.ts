export type MonthKey = 'Aug-26' | 'Sep-26' | 'Oct-26' | 'Nov-26' | 'Dec-26';

export const ALL_MONTHS: MonthKey[] = ['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'];

export type PaymentStatus = 'paid' | 'due' | 'upcoming';

export interface MonthPayment {
  status: PaymentStatus;
  date?: string; // DD.MM.YY format, e.g. "15.08.26"
  amount: number;
  paymentMethod?: string; // 'Bank Deposit' | 'bKash' | 'Nagad' | 'Cash'
  receiptNo?: string;
  notes?: string;
}

export interface ShareRecord {
  id: string; // e.g., "PAS-01", "PAS-12,13"
  sl?: number | string;
  memberName: string;
  phone?: string;
  admissionFee: number;
  months: Record<MonthKey, MonthPayment>;
  totalDeposit: number;
  dueMonths: number;
  dueAmount: number;
  lateFee: number;
  totalDue: number;
  lateFeePaid: number;
  isClosed?: boolean;
}

export interface SocietySummary {
  totalActiveShares: number;
  totalMembers: number;
  totalShareIds: number;
  totalAdmissionCollected: number;
  totalMonthlyCollected: number;
  totalLateFeeCollected: number;
  totalBankDeposit: number;
  totalDueMonths: number;
  totalDuePrincipal: number;
  totalLateFeeDue: number;
  totalOutstandingDue: number;
  collectionEfficiency: number;
  monthStats: Record<MonthKey, {
    paidShares: number;
    paidAmount: number;
    dueShares: number;
    dueAmount: number;
    upcomingShares: number;
  }>;
}

export interface PaymentTransaction {
  id: string;
  shareId: string;
  memberName: string;
  month: MonthKey;
  amount: number;
  lateFee: number;
  totalPaid: number;
  date: string;
  paymentMethod: string;
  slipOrRefNo?: string;
  collectedBy?: string;
  timestamp: number;
}
