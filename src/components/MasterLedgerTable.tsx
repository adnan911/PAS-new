import React, { useState } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS, SocietySummary } from '../types';
import { formatTaka } from '../utils/calculations';
import { Receipt, CreditCard, ChevronRight, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';

interface MasterLedgerTableProps {
  shares: ShareRecord[];
  summary: SocietySummary;
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
  onSelectMember: (memberName: string) => void;
  onDeleteShare?: (shareId: string) => void;
}

export const MasterLedgerTable: React.FC<MasterLedgerTableProps> = ({
  shares,
  summary,
  onOpenPaymentForShare,
  onOpenReceiptForShare,
  onSelectMember,
  onDeleteShare,
}) => {
  const [shareToDelete, setShareToDelete] = useState<ShareRecord | null>(null);
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table toolbar / header info */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Comprehensive Share &amp; Installment Ledger</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              Showing {shares.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time spreadsheet view mirroring the Progressive Association Society Master Register
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Paid (Tk. 2,800)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Due</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>

      {/* Overflow Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Multi-tier Table Head */}
          <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold select-none">
            {/* Top row */}
            <tr>
              <th rowSpan={2} className="px-3 py-3 border-r border-slate-300 w-12 text-center bg-slate-100/90 sticky left-0 z-10 shadow-[1px_0_0_0_#cbd5e1]">
                SL
              </th>
              <th rowSpan={2} className="px-3 py-3 border-r border-slate-300 min-w-[190px] sticky left-12 z-10 bg-slate-100/90 shadow-[1px_0_0_0_#cbd5e1]">
                Member Name
              </th>
              <th rowSpan={2} className="px-3 py-3 border-r border-slate-300 min-w-[85px] text-center">
                Share ID
              </th>
              <th rowSpan={2} className="px-3 py-3 border-r border-slate-300 text-right min-w-[100px] bg-slate-50">
                Admission Fee
              </th>

              {/* Month Columns Groups */}
              {ALL_MONTHS.map((m) => (
                <th
                  key={m}
                  colSpan={2}
                  className="px-2 py-1.5 border-r border-slate-300 text-center bg-slate-200/70 text-slate-800 font-bold"
                >
                  Month of {m}
                </th>
              ))}

              <th rowSpan={2} className="px-3 py-3 border-r border-slate-300 text-right min-w-[100px] bg-emerald-50/70 text-emerald-900 font-bold">
                Total Deposit
              </th>
              <th rowSpan={2} className="px-2 py-3 border-r border-slate-300 text-center min-w-[65px] bg-amber-50/40">
                Due Mths
              </th>
              <th rowSpan={2} className="px-3 py-3 border-r border-slate-300 text-right min-w-[85px] bg-amber-50/70 text-amber-900">
                Due Amount
              </th>
              <th rowSpan={2} className="px-2 py-3 border-r border-slate-300 text-right min-w-[85px] bg-rose-50/50 text-rose-900">
                Late Fee (10%)
              </th>
              <th rowSpan={2} className="px-3 py-3 border-r border-slate-300 text-right min-w-[95px] bg-rose-100/70 text-rose-950 font-bold">
                Total Due
              </th>
              <th rowSpan={2} className="px-2 py-3 border-r border-slate-300 text-center min-w-[80px]">
                Late Fee Paid
              </th>
              <th rowSpan={2} className="px-3 py-3 text-center min-w-[100px]">
                Actions
              </th>
            </tr>

            {/* Sub-row for Date & Amount */}
            <tr className="border-t border-slate-200 text-[11px] text-slate-600 bg-slate-50">
              {ALL_MONTHS.map((m) => (
                <React.Fragment key={`${m}-sub`}>
                  <th className="px-2 py-1.5 border-r border-slate-200 text-center font-medium w-16">
                    Date
                  </th>
                  <th className="px-2 py-1.5 border-r border-slate-300 text-right font-medium w-16">
                    Amount
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
            {shares.map((share, idx) => {
              const hasDue = share.dueMonths > 0;
              const isClosed = share.isClosed;

              return (
                <tr
                  key={`${share.id}-${idx}`}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    isClosed
                      ? 'bg-slate-100/60 text-slate-500'
                      : hasDue
                      ? 'bg-amber-50/30'
                      : idx % 2 === 1
                      ? 'bg-slate-50/30'
                      : 'bg-white'
                  }`}
                >
                  {/* SL */}
                  <td
                    className={`px-3 py-2.5 border-r border-slate-200 text-center font-sans text-slate-500 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] ${
                      isClosed
                        ? 'bg-slate-100'
                        : hasDue
                        ? 'bg-amber-50'
                        : idx % 2 === 1
                        ? 'bg-slate-50'
                        : 'bg-white'
                    }`}
                  >
                    {share.sl || '-'}
                  </td>

                  {/* Member Name */}
                  <td
                    className={`px-3 py-2.5 border-r border-slate-200 font-sans font-semibold text-slate-900 sticky left-12 z-10 shadow-[1px_0_0_0_#e2e8f0] ${
                      isClosed
                        ? 'bg-slate-100'
                        : hasDue
                        ? 'bg-amber-50'
                        : idx % 2 === 1
                        ? 'bg-slate-50'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 group">
                      <button
                        onClick={() => !isClosed && onSelectMember(share.memberName)}
                        className={`text-left hover:text-emerald-700 transition-colors truncate max-w-[160px] ${
                          isClosed ? 'text-slate-400 italic' : ''
                        }`}
                        title={share.memberName}
                      >
                        {share.memberName || '—'}
                      </button>
                      {!isClosed && (
                        <button
                          onClick={() => onSelectMember(share.memberName)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 p-0.5"
                          title="View member profile"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Share ID */}
                  <td className="px-3 py-2.5 border-r border-slate-200 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        isClosed
                          ? 'bg-slate-200 text-slate-600'
                          : hasDue
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {share.id}
                    </span>
                  </td>

                  {/* Admission Fee */}
                  <td className="px-3 py-2.5 border-r border-slate-200 text-right font-medium">
                    {share.admissionFee.toLocaleString('en-IN')}
                  </td>

                  {/* Monthly Payments (Aug, Sep, Oct, Nov, Dec) */}
                  {ALL_MONTHS.map((m) => {
                    const pay = share.months[m];
                    if (isClosed) {
                      return (
                        <React.Fragment key={m}>
                          <td className="px-2 py-2 border-r border-slate-200 text-center text-slate-400">-</td>
                          <td className="px-2 py-2 border-r border-slate-300 text-right text-slate-400">-</td>
                        </React.Fragment>
                      );
                    }

                    if (pay.status === 'paid') {
                      return (
                        <React.Fragment key={m}>
                          <td className="px-2 py-2 border-r border-slate-200 text-center text-slate-600 text-[11px]">
                            {pay.date || '-'}
                          </td>
                          <td className="px-2 py-2 border-r border-slate-300 text-right font-medium text-emerald-800 bg-emerald-50/20">
                            <button
                              onClick={() => onOpenReceiptForShare(share, m)}
                              className="hover:underline hover:text-emerald-600 cursor-pointer font-semibold"
                              title={`Click to View Receipt or Edit / Void Payment for ${share.id} (${m})`}
                            >
                              {pay.amount.toLocaleString('en-IN')}
                            </button>
                          </td>
                        </React.Fragment>
                      );
                    } else if (pay.status === 'due') {
                      return (
                        <React.Fragment key={m}>
                          <td className="px-2 py-2 border-r border-slate-200 text-center text-rose-600 font-semibold bg-rose-50/60 font-sans">
                            Due
                          </td>
                          <td className="px-2 py-2 border-r border-slate-300 text-right bg-rose-50/60 font-semibold text-rose-700">
                            <button
                              onClick={() => onOpenPaymentForShare(share, m)}
                              className="px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-sans font-bold inline-flex items-center gap-0.5"
                              title={`Pay Due for ${share.id} (${m})`}
                            >
                              Pay
                            </button>
                          </td>
                        </React.Fragment>
                      );
                    } else {
                      // Upcoming
                      return (
                        <React.Fragment key={m}>
                          <td className="px-2 py-2 border-r border-slate-200 text-center text-slate-400">-</td>
                          <td className="px-2 py-2 border-r border-slate-300 text-right text-slate-400">-</td>
                        </React.Fragment>
                      );
                    }
                  })}

                  {/* Total Deposit */}
                  <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-emerald-700 bg-emerald-50/30">
                    {share.totalDeposit.toLocaleString('en-IN')}
                  </td>

                  {/* Due Months */}
                  <td className="px-2 py-2.5 border-r border-slate-200 text-center">
                    {share.dueMonths > 0 ? (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                        {share.dueMonths}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Due Amount */}
                  <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-amber-700">
                    {share.dueAmount > 0 ? share.dueAmount.toLocaleString('en-IN') : <span className="text-slate-400 font-normal">-</span>}
                  </td>

                  {/* Late Fee */}
                  <td className="px-2 py-2.5 border-r border-slate-200 text-right font-medium text-rose-700">
                    {share.lateFee > 0 ? share.lateFee.toLocaleString('en-IN') : <span className="text-slate-400 font-normal">-</span>}
                  </td>

                  {/* Total Due */}
                  <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-rose-700 bg-rose-50/40">
                    {share.totalDue > 0 ? share.totalDue.toLocaleString('en-IN') : <span className="text-slate-400 font-normal">-</span>}
                  </td>

                  {/* Late Fee Paid */}
                  <td className="px-2 py-2.5 border-r border-slate-200 text-center text-slate-400">
                    {share.lateFeePaid > 0 ? share.lateFeePaid.toLocaleString('en-IN') : '-'}
                  </td>

                  {/* Actions Column */}
                  <td className="px-3 py-2.5 text-center font-sans">
                    {!isClosed && (
                      <div className="flex items-center justify-center gap-1.5">
                        {hasDue ? (
                          <button
                            onClick={() => onOpenPaymentForShare(share)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold shadow-xs"
                            title={`Clear dues for ${share.id} (${formatTaka(share.totalDue)})`}
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenPaymentForShare(share)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
                            title={`Record payment for ${share.id}`}
                          >
                            <CreditCard className="w-3 h-3 text-slate-500" />
                            <span>Pay</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenReceiptForShare(share, 'Oct-26')}
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="View / Print Money Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {onDeleteShare && !isClosed && (
                          <button
                            onClick={() => setShareToDelete(share)}
                            aria-label={`Delete share ${share.id}`}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={`Delete share ${share.id} from register (রেজিস্টার থেকে শেয়ার মুছুন)`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grand Total Row matching the original Excel spreadsheet */}
          <tfoot className="bg-slate-900 text-white font-mono font-bold border-t-2 border-slate-700">
            <tr>
              <td colSpan={2} className="px-3 py-3 border-r border-slate-800 text-left font-sans uppercase tracking-wider text-amber-400 text-xs sticky left-0 z-10 bg-slate-900">
                GRAND TOTAL
              </td>
              <td className="px-3 py-3 border-r border-slate-800 text-center font-sans text-xs text-slate-300">
                {summary.totalShareIds} IDs
              </td>
              <td className="px-3 py-3 border-r border-slate-800 text-right text-emerald-300">
                {summary.totalAdmissionCollected.toLocaleString('en-IN')}
              </td>

              {/* Monthly totals */}
              {ALL_MONTHS.map((m) => {
                const stat = summary.monthStats[m];
                return (
                  <React.Fragment key={`${m}-total`}>
                    <td className="px-2 py-2 border-r border-slate-800 text-center text-slate-400 text-[10px]">
                      {stat.paidShares > 0 ? `${stat.paidShares} Paid` : '-'}
                    </td>
                    <td className="px-2 py-2 border-r border-slate-800 text-right text-emerald-300">
                      {stat.paidAmount > 0 ? stat.paidAmount.toLocaleString('en-IN') : '-'}
                    </td>
                  </React.Fragment>
                );
              })}

              {/* Grand Total Deposit */}
              <td className="px-3 py-3 border-r border-slate-800 text-right text-base text-emerald-400 font-extrabold bg-emerald-950/40">
                {summary.totalBankDeposit.toLocaleString('en-IN')}
              </td>

              {/* Total Due Months */}
              <td className="px-2 py-3 border-r border-slate-800 text-center text-amber-400">
                {summary.totalDueMonths}
              </td>

              {/* Total Due Amount */}
              <td className="px-3 py-3 border-r border-slate-800 text-right text-amber-300">
                {summary.totalDuePrincipal.toLocaleString('en-IN')}
              </td>

              {/* Total Late Fee */}
              <td className="px-2 py-3 border-r border-slate-800 text-right text-rose-300">
                {summary.totalLateFeeDue.toLocaleString('en-IN')}
              </td>

              {/* Total Due with Late Fee */}
              <td className="px-3 py-3 border-r border-slate-800 text-right text-rose-400 font-extrabold bg-rose-950/40">
                {summary.totalOutstandingDue.toLocaleString('en-IN')}
              </td>

              {/* Late Fee Paid */}
              <td className="px-2 py-3 border-r border-slate-800 text-center text-slate-400">
                {summary.totalLateFeeCollected > 0 ? summary.totalLateFeeCollected.toLocaleString('en-IN') : '-'}
              </td>

              <td className="px-3 py-3 text-center text-slate-400 font-sans text-[11px]">
                Active 30
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Delete Share Confirmation Dialog */}
      {shareToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Delete Share from Register?</h4>
                <p className="text-xs text-slate-500">
                  {shareToDelete.id} &bull; {shareToDelete.memberName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete share <strong>{shareToDelete.id}</strong> ({shareToDelete.memberName})? This will permanently remove the share from the society register.
              <span className="block text-slate-500 mt-1">
                আপনি কি নিশ্চিত যে এই শেয়ার এন্ট্রিটি পুরোপুরি মুছে ফেলতে চান?
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShareToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteShare && shareToDelete) {
                    onDeleteShare(shareToDelete.id);
                  }
                  setShareToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete Share (হ্যাঁ, মুছুন)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
