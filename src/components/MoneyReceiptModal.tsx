import React, { useState } from 'react';
import { ShareRecord, MonthKey } from '../types';
import { formatTaka, takaInWords } from '../utils/calculations';
import { Printer, X, ShieldCheck, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MoneyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  share: ShareRecord | null;
  month?: MonthKey;
  onVoidPayment?: (shareId: string, month: MonthKey, targetStatus: 'due' | 'upcoming') => void;
  onEditPayment?: (share: ShareRecord, month: MonthKey) => void;
}

export const MoneyReceiptModal: React.FC<MoneyReceiptModalProps> = ({
  isOpen,
  onClose,
  share,
  month = 'Oct-26',
  onVoidPayment,
  onEditPayment,
}) => {
  const { requireAdmin } = useAuth();
  const [showConfirmVoid, setShowConfirmVoid] = useState<boolean>(false);

  if (!isOpen || !share) return null;

  const payment = share.months[month] || {
    status: 'paid',
    amount: 2800,
    date: '15.09.26',
    paymentMethod: 'Bank Deposit',
  };

  const amount = payment.amount || 2800;
  const words = takaInWords(amount);
  const receiptNo = `PAS-${month.replace('-', '')}-${share.id.replace('PAS-', '')}`;
  const paymentDate = payment.date ? `${payment.date.split('.').join('/')}` : '15/09/2026';

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmVoid = (targetStatus: 'due' | 'upcoming') => {
    if (onVoidPayment) {
      onVoidPayment(share.id, month, targetStatus);
    }
    setShowConfirmVoid(false);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !showConfirmVoid) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible print:block print-modal"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:block">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-slate-800 text-sm">Official Money Receipt</h3>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {onEditPayment && (
              <button
                onClick={() => {
                  requireAdmin(() => {
                    onEditPayment(share, month);
                    onClose();
                  }, 'edit payment entry');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Edit payment amount, date or notes"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit Entry (এডিট করুন)</span>
              </button>
            )}

            {onVoidPayment && (
              <button
                onClick={() => requireAdmin(() => setShowConfirmVoid(true), 'void/delete payment entry')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Void and delete this accidental installment entry (ভুল এন্ট্রি মুছুন)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Void Entry (ভুল এন্ট্রি মুছুন)</span>
              </button>
            )}

            <button
              onClick={() => requireAdmin(handlePrint, 'print this money receipt')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close receipt"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Receipt Container */}
        <div className="p-8 sm:p-10 font-sans print:p-4 text-slate-900 bg-white" id="printable-receipt">
          {/* Header */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <div className="flex justify-center mb-2.5">
              <img
                src="/logo.png"
                alt="Progressive Association Society"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-wider mb-2">
              Govt. Registered Multipurpose Cooperative Society
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
              PROGRESSIVE ASSOCIATION SOCIETY
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Central Office: Plot #14, Sector #03, Uttara Model Town, Dhaka-1230, Bangladesh
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Email: info@pas-society.org.bd | Helpline: +880 1711-000000 | Reg No: PAS/DH/2026/049
            </p>
            <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded">
              MONEY RECEIPT (MEMBER COPY)
            </div>
          </div>

          {/* Receipt Info Line */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs font-mono border-b border-slate-200">
            <div>
              <span className="text-slate-500 font-sans font-medium">Receipt No: </span>
              <strong className="text-slate-900">{receiptNo}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-sans font-medium">Issue Date: </span>
              <strong className="text-slate-900">{paymentDate}</strong>
            </div>
          </div>

          {/* Body Statement */}
          <div className="py-6 space-y-4 text-sm leading-relaxed">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="text-slate-600 font-medium whitespace-nowrap min-w-[170px]">
                Received with thanks from:
              </span>
              <div className="flex-1 font-bold text-slate-950 text-base border-b border-dotted border-slate-400 pb-0.5">
                {share.memberName || 'Member of Progressive Association Society'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-600 font-medium whitespace-nowrap">Share ID No:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {share.id}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-600 font-medium whitespace-nowrap">Payment Method:</span>
                <span className="font-semibold text-slate-900">
                  {payment.paymentMethod || 'Bank Deposit / Islami Bank Bangladesh PLC'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="text-slate-600 font-medium whitespace-nowrap min-w-[170px]">
                On account of:
              </span>
              <div className="flex-1 font-medium text-slate-900 border-b border-dotted border-slate-400 pb-0.5">
                Monthly Installment for <strong>{month}</strong> (Regular Monthly Subscription)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="text-slate-600 font-medium whitespace-nowrap min-w-[170px]">
                Amount in Words:
              </span>
              <div className="flex-1 font-semibold italic text-slate-900 border-b border-dotted border-slate-400 pb-0.5">
                {words}
              </div>
            </div>
          </div>

          {/* Amount Box & Society Seal */}
          <div className="my-6 p-4 bg-slate-50 border-2 border-slate-300 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                Total Amount Received
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-mono tracking-tight">
                {formatTaka(amount)}
              </span>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center text-emerald-700 text-[10px] font-bold uppercase rotate-[-6deg]">
                <ShieldCheck className="w-5 h-5 mb-0.5" />
                <span>PA SOCIETY</span>
                <span>VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs font-medium text-slate-700">
            <div>
              <div className="border-t border-slate-900 pt-2 font-bold text-slate-950 font-serif">
                Md Fuad Bin Rahman
              </div>
              <p className="text-[11px] text-slate-500">Authorized Officer / Cashier</p>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-2 font-bold text-slate-950 font-serif">
                General Secretary / Treasurer
              </div>
              <p className="text-[11px] text-slate-500">Progressive Association Society</p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            * This is a computer generated official acknowledgement receipt for fund collection FY 2026-27.
          </div>
        </div>
      </div>

      {/* Confirmation Dialog to Void/Delete Payment */}
      {showConfirmVoid && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Void &amp; Delete Payment?</h4>
                <p className="text-xs text-slate-500">
                  {share.id} &bull; {month} &bull; {formatTaka(amount)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              How would you like to revert this payment for <strong>{share.memberName}</strong> ({share.id}) for <strong>{month}</strong>?
            </p>

            <div className="space-y-2 mb-6">
              <button
                type="button"
                onClick={() => handleConfirmVoid('due')}
                className="w-full text-left p-3 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span className="font-bold text-amber-900 text-xs block">
                  Mark as Overdue (বকেয়া রাখুন - Due + 10% Late Fee)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Restores installment as overdue with applicable late fee calculation.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmVoid('upcoming')}
                className="w-full text-left p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 text-xs block">
                  Completely Delete / Reset (সম্পূর্ণ মুছে ফেলুন - Unpaid)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Clears the payment record completely, marking it as unpaid/upcoming.
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmVoid(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel (বাতিল)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
