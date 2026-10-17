import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateShareRecord,
  calculateSocietySummary,
  formatTaka,
  takaInWords,
} from './calculations.ts';
import { INITIAL_SHARES } from '../data/initialData.ts';
import type { ShareRecord } from '../types.ts';

test('calculateShareRecord calculates paid share correctly', () => {
  const share: ShareRecord = {
    id: 'PAS-01',
    memberName: 'Test Member',
    admissionFee: 5000,
    months: {
      'Aug-26': { status: 'paid', amount: 2800 },
      'Sep-26': { status: 'paid', amount: 2800 },
      'Oct-26': { status: 'paid', amount: 2800 },
      'Nov-26': { status: 'upcoming', amount: 2800 },
      'Dec-26': { status: 'upcoming', amount: 2800 },
    },
    totalDeposit: 0,
    dueMonths: 0,
    dueAmount: 0,
    lateFee: 0,
    totalDue: 0,
    lateFeePaid: 0,
  };

  const calculated = calculateShareRecord(share);
  assert.equal(calculated.totalDeposit, 13400); // 5000 + 3*2800
  assert.equal(calculated.dueMonths, 0);
  assert.equal(calculated.dueAmount, 0);
  assert.equal(calculated.lateFee, 0);
  assert.equal(calculated.totalDue, 0);
});

test('calculateShareRecord calculates due share and late fee correctly', () => {
  const share: ShareRecord = {
    id: 'PAS-19',
    memberName: 'Md Mohaiminul Islam',
    admissionFee: 5000,
    months: {
      'Aug-26': { status: 'paid', amount: 2800 },
      'Sep-26': { status: 'due', amount: 2800 },
      'Oct-26': { status: 'due', amount: 2800 },
      'Nov-26': { status: 'upcoming', amount: 2800 },
      'Dec-26': { status: 'upcoming', amount: 2800 },
    },
    totalDeposit: 0,
    dueMonths: 0,
    dueAmount: 0,
    lateFee: 0,
    totalDue: 0,
    lateFeePaid: 0,
  };

  const calculated = calculateShareRecord(share);
  assert.equal(calculated.totalDeposit, 7800); // 5000 + 2800
  assert.equal(calculated.dueMonths, 2);
  assert.equal(calculated.dueAmount, 5600);
  assert.equal(calculated.lateFee, 280); // 10% of 2800
  assert.equal(calculated.totalDue, 5880); // 5600 + 280
});

test('calculateSocietySummary matches the Progressive Association Society Excel metrics', () => {
  const summary = calculateSocietySummary(INITIAL_SHARES);

  assert.equal(summary.totalActiveShares, 30, 'Total active shares must be 30');
  assert.equal(summary.totalAdmissionCollected, 160000, 'Admission total must be 160,000');
  assert.equal(summary.totalMonthlyCollected, 235200, 'Monthly total must be 235,200');
  assert.equal(summary.totalBankDeposit, 395200, 'Total bank deposit must be 395,200');
  assert.equal(summary.totalDueMonths, 6, 'Total due months must be 6 (3 members x 2 months)');
  assert.equal(summary.totalDuePrincipal, 16800, 'Total due principal must be 16,800');
  assert.equal(summary.totalLateFeeDue, 840, 'Total late fee due must be 840 (3 x 280)');
  assert.equal(summary.totalOutstandingDue, 17640, 'Total outstanding due must be 17,640');
  assert.equal(summary.collectionEfficiency, 95.9, 'Collection efficiency must be 95.9%');
  assert.equal(summary.monthStats['Aug-26'].paidAmount, 84000, 'Aug-26 collection must be 84,000');
  assert.equal(summary.monthStats['Sep-26'].paidAmount, 75600, 'Sep-26 collection must be 75,600');
  assert.equal(summary.monthStats['Oct-26'].paidAmount, 75600, 'Oct-26 collection must be 75,600');
});

test('formatTaka formats correctly', () => {
  assert.equal(formatTaka(395200), 'Tk. 3,95,200');
  assert.equal(formatTaka(17640), 'Tk. 17,640');
});

test('takaInWords produces proper English words', () => {
  assert.equal(takaInWords(2800), 'Two Thousand Eight Hundred Taka Only');
  assert.equal(takaInWords(5000), 'Five Thousand Taka Only');
});

test('formatSharesForSheet generates exact Image 2 layout with 38 rows and perfect member groupings', async () => {
  const { formatSharesForSheet } = await import('../services/googleSheets.ts');
  const summary = calculateSocietySummary(INITIAL_SHARES);
  const rows = formatSharesForSheet(INITIAL_SHARES, summary);

  // Exactly 6 header rows + 31 data rows + 1 grand total = 38 rows
  assert.equal(rows.length, 38);

  // Row 1 & 2: Title Banners
  assert.equal(rows[0][0], 'PROGRESSIVE ASSOCIATION SOCIETY');
  assert.equal(rows[1][0], 'MEMBER PAYMENT & INSTALLMENT DASHBOARD');

  // Row 3: KPI Headers
  assert.equal(rows[2][0], 'TOTAL ACTIVE SHARES');
  assert.equal(rows[2][2], 'TOTAL BANK DEPOSIT');
  assert.equal(rows[2][7], 'TOTAL OUTSTANDING DUE');
  assert.equal(rows[2][13], 'COLLECTION EFFICIENCY');

  // Row 5 & 6: 2-tier column headers
  assert.equal(rows[4][0], 'SL');
  assert.equal(rows[4][1], 'Member Name');
  assert.equal(rows[4][2], 'Share ID');
  assert.equal(rows[4][3], 'Admission Fee');
  assert.equal(rows[4][4], 'Month of Aug-26');
  assert.equal(rows[5][4], 'Date');
  assert.equal(rows[5][5], 'Amount');

  // Row 7 (First data row): Md Fuad Bin Rahman (PAS-01)
  assert.equal(rows[6][0], '01');
  assert.equal(rows[6][1], 'Md Fuad Bin Rahman');
  assert.equal(rows[6][2], 'PAS-01');

  // Row 8 & 9: PAS-02 & PAS-03 have blank SL and blank member name for merged grouping in Image 2
  assert.equal(rows[7][0], '');
  assert.equal(rows[7][1], '');
  assert.equal(rows[7][2], 'PAS-02');

  assert.equal(rows[8][0], '');
  assert.equal(rows[8][1], '');
  assert.equal(rows[8][2], 'PAS-03');

  // Row 10: Md Asaduzzaman Nahid (PAS-04)
  assert.equal(rows[9][0], '02');
  assert.equal(rows[9][1], 'Md Asaduzzaman Nahid');
  assert.equal(rows[9][2], 'PAS-04');

  // Row 37: Closed Id
  assert.equal(rows[36][1], 'Closed Id');
  assert.equal(rows[36][2], 'PAS-12,13');
  assert.equal(rows[36][3], 10000);

  // Row 38: GRAND TOTAL
  assert.equal(rows[37][1], 'GRAND TOTAL');
  assert.equal(rows[37][2], '32 IDs');
  assert.equal(rows[37][3], 160000);
  assert.equal(rows[37][14], 395200);
  assert.equal(rows[37][18], 17640);
});
