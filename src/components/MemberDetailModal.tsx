import React, { useState } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS } from '../types';
import { formatTaka } from '../utils/calculations';
import { X, User, ShieldCheck, AlertCircle, Phone, Receipt, CreditCard, Trash2 } from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string | null;
  shares: ShareRecord[];
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
  onDeleteShare?: (shareId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  memberName,
  shares,
  onOpenPaymentForShare,
  onOpenReceiptForShare,
  onDeleteShare,
}) => {
  const [shareToDelete, setShareToDelete] = useState<ShareRecord | null>(null);
  if (!isOpen || !memberName) return null;

  const memberShares = shares.filter((s) => s.memberName === memberName);
  const totalAdmission = memberShares.reduce((sum, s) => sum + s.admissionFee, 0);
  const totalDeposited = memberShares.reduce((sum, s) => sum + s.totalDeposit, 0);
  const totalDue = memberShares.reduce((sum, s) => sum + s.totalDue, 0);
  const totalDueMonths = memberShares.reduce((sum, s) => sum + s.dueMonths, 0);
  const phone = memberShares[0]?.phone;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">{memberName}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800">
                  {memberShares.length} {memberShares.length > 1 ? 'Shares' : 'Share'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Member of Progressive Association Society</span>
                {phone && (
                  <span className="inline-flex items-center gap-1 text-slate-600 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {phone}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close member portfolio"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Overview Metrics */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">
                Total Admission Fees
              </span>
              <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                {formatTaka(totalAdmission)}
              </span>
              <span className="text-[11px] text-slate-400">
                {memberShares.length} x Tk. 5,000 admission
              </span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase block">
                Total Bank Deposit
              </span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">
                {formatTaka(totalDeposited)}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">
                Verified society bank credits
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                totalDue > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <span className="text-xs font-semibold uppercase block opacity-80">
                Outstanding Balance Due
              </span>
              <span
                className={`text-xl font-extrabold font-mono mt-1 block ${
                  totalDue > 0 ? 'text-rose-700' : 'text-slate-700'
                }`}
              >
                {formatTaka(totalDue)}
              </span>
              <span className="text-[11px] opacity-75">
                {totalDueMonths > 0 ? `${totalDueMonths} unpaid installment months` : 'Up to date'}
              </span>
            </div>
          </div>

          {/* Individual Share Records Table */}
          <h4 className="font-bold text-sm text-slate-900 mb-3">
            Individual Share Portfolios &amp; Installment Schedules
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Share ID</th>
                  <th className="px-3 py-2.5 text-right">Admission</th>
                  {ALL_MONTHS.map((m) => (
                    <th key={m} className="px-2 py-2.5 text-center">
                      {m}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right">Deposited</th>
                  <th className="px-3 py-2.5 text-right">Total Due</th>
                  <th className="px-3 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {memberShares.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{s.id}</td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {formatTaka(s.admissionFee)}
                    </td>
                    {ALL_MONTHS.map((m) => {
                      const p = s.months[m];
                      if (p?.status === 'paid') {
                        return (
                          <td key={m} className="px-2 py-2.5 text-center">
                            <span
                              onClick={() => onOpenReceiptForShare(s, m)}
                              className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] cursor-pointer hover:bg-emerald-200"
                              title={`${p.date} - ${formatTaka(p.amount)} (Click for Receipt)`}
                            >
                              Tk. {p.amount}
                            </span>
                          </td>
                        );
                      }
                      if (p?.status === 'due') {
                        return (
                          <td key={m} className="px-2 py-2.5 text-center">
                            <button
                              onClick={() => onOpenPaymentForShare(s, m)}
                              className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] cursor-pointer hover:bg-rose-200"
                              title="Click to Pay Due"
                            >
                              DUE
                            </button>
                          </td>
                        );
                      }
                      return (
                        <td key={m} className="px-2 py-2.5 text-center text-slate-400">
                          —
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                      {formatTaka(s.totalDeposit)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-rose-700">
                      {s.totalDue > 0 ? formatTaka(s.totalDue) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenPaymentForShare(s)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium cursor-pointer"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => onOpenReceiptForShare(s, 'Oct-26')}
                          className="p-1 text-slate-500 hover:text-emerald-700 cursor-pointer"
                          title="View / Edit / Void Payment Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteShare && !s.isClosed && (
                          <button
                            onClick={() => setShareToDelete(s)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete this share"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Progressive Association Society • Permanent Membership Record
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
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
              Are you sure you want to delete share <strong>{shareToDelete.id}</strong> ({shareToDelete.memberName})? This will permanently remove the share from the society ledger.
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
