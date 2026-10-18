import { ALL_MONTHS } from '../types.ts';
import type { MonthKey, ShareRecord, SocietySummary } from '../types.ts';

export const MONTHLY_INSTALLMENT_AMOUNT = 2800;
export const ADMISSION_FEE_AMOUNT = 5000;
export const LATE_FEE_PERCENTAGE = 0.10; // 10%

/**
 * Calculates deposit, due, and late fee for a single share record
 */
export function calculateShareRecord(share: ShareRecord): ShareRecord {
  if (share.isClosed) {
    return {
      ...share,
      totalDeposit: share.admissionFee,
      dueMonths: 0,
      dueAmount: 0,
      lateFee: 0,
      totalDue: 0,
      lateFeePaid: 0,
    };
  }

  let totalMonthlyPaid = 0;
  let dueMonths = 0;
  let dueAmount = 0;

  // Evaluate across all months configured on the share record
  const monthKeys = Object.keys(share.months || {});
  for (const m of monthKeys) {
    const payment = share.months[m];
    if (payment) {
      if (payment.status === 'paid') {
        totalMonthlyPaid += payment.amount || 0;
      } else if (payment.status === 'due') {
        dueMonths += 1;
        dueAmount += payment.amount || MONTHLY_INSTALLMENT_AMOUNT;
      }
    }
  }

  const lateFeePaid = share.lateFeePaid || 0;
  // Late fee: 10% of monthly installment (৳280) if there is any due installment
  const lateFee = dueMonths > 0 ? Math.round(MONTHLY_INSTALLMENT_AMOUNT * LATE_FEE_PERCENTAGE) : 0;
  const totalDeposit = share.admissionFee + totalMonthlyPaid + lateFeePaid;
  const totalDue = Math.max(0, dueAmount + lateFee - lateFeePaid);

  return {
    ...share,
    totalDeposit,
    dueMonths,
    dueAmount,
    lateFee,
    totalDue,
    lateFeePaid,
  };
}

/**
 * Summarizes the entire society dataset matching the Excel dashboard
 */
export function calculateSocietySummary(shares: ShareRecord[]): SocietySummary {
  let totalActiveShares = 0;
  let totalShareIds = 0;
  let totalAdmissionCollected = 0;
  let totalMonthlyCollected = 0;
  let totalLateFeeCollected = 0;
  let totalDueMonths = 0;
  let totalDuePrincipal = 0;
  let totalLateFeeDue = 0;

  const monthStats: SocietySummary['monthStats'] = {};

  const uniqueMemberNames = new Set<string>();

  for (const rawShare of shares) {
    const share = calculateShareRecord(rawShare);

    // Count IDs
    if (share.id.includes(',')) {
      const parts = share.id.split(',').length;
      totalShareIds += parts;
    } else {
      totalShareIds += 1;
    }

    if (!share.isClosed) {
      totalActiveShares += 1;
      if (share.memberName && share.memberName.trim() !== '') {
        uniqueMemberNames.add(share.memberName.trim());
      }
    }

    totalAdmissionCollected += share.admissionFee;
    totalLateFeeCollected += share.lateFeePaid || 0;

    const allRecordMonths = Object.keys(share.months || {});
    for (const m of allRecordMonths) {
      if (!monthStats[m]) {
        monthStats[m] = { paidShares: 0, paidAmount: 0, dueShares: 0, dueAmount: 0, upcomingShares: 0 };
      }
      const p = share.months[m];
      if (!p) continue;
      if (p.status === 'paid') {
        if (!share.isClosed) {
          totalMonthlyCollected += p.amount || 0;
        }
        monthStats[m].paidShares += 1;
        monthStats[m].paidAmount += p.amount || 0;
      } else if (p.status === 'due') {
        monthStats[m].dueShares += 1;
        monthStats[m].dueAmount += p.amount || MONTHLY_INSTALLMENT_AMOUNT;
      } else {
        monthStats[m].upcomingShares += 1;
      }
    }

    if (!share.isClosed) {
      totalDueMonths += share.dueMonths;
      totalDuePrincipal += share.dueAmount;
      totalLateFeeDue += share.lateFee;
    }
  }

  const totalBankDeposit = totalAdmissionCollected + totalMonthlyCollected + totalLateFeeCollected;
  const totalOutstandingDue = totalDuePrincipal + totalLateFeeDue;

  // Collection efficiency: Total Deposited / (Total Deposited + Principal Due) * 100
  const totalPotential = totalBankDeposit + totalDuePrincipal;
  const collectionEfficiency = totalPotential > 0
    ? Math.round((totalBankDeposit / totalPotential) * 1000) / 10
    : 100;

  return {
    totalActiveShares,
    totalMembers: uniqueMemberNames.size,
    totalShareIds,
    totalAdmissionCollected,
    totalMonthlyCollected,
    totalLateFeeCollected,
    totalBankDeposit,
    totalDueMonths,
    totalDuePrincipal,
    totalLateFeeDue,
    totalOutstandingDue,
    collectionEfficiency,
    monthStats,
  };
}

/**
 * Format currency in Bangladeshi Taka (৳)
 */
export function formatTaka(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Tk. 0';
  return 'Tk. ' + amount.toLocaleString('en-IN');
}

/**
 * Number to words in BDT format (for Money Receipts)
 */
export function takaInWords(amount: number): string {
  if (amount === 0) return 'Zero Taka Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    let out = '';
    if (n >= 100) {
      out += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      out += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      out += teens[n - 10] + ' ';
      return out;
    }
    if (n > 0) {
      out += units[n] + ' ';
    }
    return out;
  }

  let crore = Math.floor(amount / 10000000);
  let remainder = amount % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundred = remainder % 1000;

  let words = '';
  if (crore > 0) words += convertGroup(crore) + 'Crore ';
  if (lakh > 0) words += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) words += convertGroup(thousand) + 'Thousand ';
  if (hundred > 0) words += convertGroup(hundred);

  return (words.trim() + ' Taka Only').replace(/\s+/g, ' ');
}
