import React, { useState, useEffect } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS } from '../types';
import { formatTaka } from '../utils/calculations';
import { X, CreditCard, RotateCcw, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shares: ShareRecord[];
  initialShare?: ShareRecord | null;
  initialMonth?: MonthKey;
  onSavePayment: (payload: {
    shareId: string;
    month: MonthKey;
    amount: number;
    date: string;
    paymentMethod: string;
    includeLateFee: boolean;
    notes?: string;
  }) => void;
  onRevertPayment?: (shareId: string, month: MonthKey, targetStatus: 'due' | 'upcoming') => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  shares,
  initialShare,
  initialMonth,
  onSavePayment,
  onRevertPayment,
}) => {
  const activeShares = shares.filter((s) => !s.isClosed);

  const [selectedShareId, setSelectedShareId] = useState<string>(activeShares[0]?.id || 'PAS-01');
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(initialMonth || 'Oct-26');
  const [amount, setAmount] = useState<number>(2800);
  const [date, setDate] = useState<string>('15.10.26');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Deposit');
  const [includeLateFee, setIncludeLateFee] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [showConfirmRevert, setShowConfirmRevert] = useState<boolean>(false);

  const currentShare = activeShares.find((s) => s.id === selectedShareId) || activeShares[0];
  const currentMonthData = currentShare?.months[selectedMonth];
  const isCurrentlyPaid = currentMonthData?.status === 'paid';
  const isCurrentlyDue = currentMonthData?.status === 'due';

  useEffect(() => {
    if (initialShare) {
      setSelectedShareId(initialShare.id);
      if (initialMonth) {
        setSelectedMonth(initialMonth);
      } else if (initialShare.dueMonths > 0) {
        const firstDue = ALL_MONTHS.find((m) => initialShare.months[m]?.status === 'due');
        if (firstDue) setSelectedMonth(firstDue);
      } else {
        const firstUpcoming = ALL_MONTHS.find((m) => initialShare.months[m]?.status === 'upcoming');
        if (firstUpcoming) setSelectedMonth(firstUpcoming);
      }
      setIncludeLateFee(initialShare.dueMonths > 0);
    } else if (initialMonth) {
      setSelectedMonth(initialMonth);
    }
  }, [initialShare, initialMonth, isOpen]);

  // Pre-fill fields whenever selectedShare or selectedMonth changes
  useEffect(() => {
    if (currentMonthData && currentMonthData.status === 'paid') {
      setAmount(currentMonthData.amount || 2800);
      setDate(currentMonthData.date || '15.10.26');
      setPaymentMethod(currentMonthData.paymentMethod || 'Bank Deposit');
      setNotes(currentMonthData.notes || '');
    } else {
      setAmount(2800);
      setDate('15.10.26');
      setPaymentMethod('Bank Deposit');
      setNotes('');
    }
  }, [selectedShareId, selectedMonth]);

  if (!isOpen) return null;

  const handleShareChange = (newId: string) => {
    setSelectedShareId(newId);
    const s = activeShares.find((x) => x.id === newId);
    if (s) {
      if (s.dueMonths > 0) {
        const firstDue = ALL_MONTHS.find((m) => s.months[m]?.status === 'due');
        if (firstDue) setSelectedMonth(firstDue);
        setIncludeLateFee(true);
      } else {
        const firstUpcoming = ALL_MONTHS.find((m) => s.months[m]?.status === 'upcoming');
        if (firstUpcoming) setSelectedMonth(firstUpcoming);
        setIncludeLateFee(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePayment({
      shareId: selectedShareId,
      month: selectedMonth,
      amount: Number(amount) || 2800,
      date,
      paymentMethod,
      includeLateFee,
      notes,
    });
    onClose();
  };

  const handleExecuteRevert = (targetStatus: 'due' | 'upcoming') => {
    if (onRevertPayment) {
      onRevertPayment(selectedShareId, selectedMonth, targetStatus);
    }
    setShowConfirmRevert(false);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !showConfirmRevert) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {isCurrentlyPaid ? 'Edit or Manage Payment Entry' : 'Record Fund Collection'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isCurrentlyPaid
                  ? 'Update payment details or revert accidental entry'
                  : 'Post installment payment to society ledger'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Share ID Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Share ID &amp; Member
            </label>
            <select
              value={selectedShareId}
              onChange={(e) => handleShareChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {activeShares.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} - {s.memberName} {s.dueMonths > 0 ? `(DUE: ${formatTaka(s.totalDue)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Current Share Status Banner */}
          {currentShare && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                currentShare.dueMonths > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div>
                <span className="font-bold">{currentShare.memberName}</span>
                <span className="block text-[11px] text-slate-600 mt-0.5">
                  Deposited: {formatTaka(currentShare.totalDeposit)} | Dues: {formatTaka(currentShare.totalDue)}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-white border">
                {currentShare.dueMonths > 0 ? `${currentShare.dueMonths}m Overdue` : 'Clean'}
              </span>
            </div>
          )}

          {/* Installment Month Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Installment Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value as MonthKey)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-emerald-500"
              >
                {ALL_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    Month of {m} {currentShare?.months[m]?.status === 'paid' ? '✓ (Paid)' : currentShare?.months[m]?.status === 'due' ? '⚠ (Due)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date (DD.MM.YY)</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="15.10.26"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-emerald-500"
                required
              />
            </div>
          </div>

          {/* Already Paid Notice & Quick Revert Button */}
          {isCurrentlyPaid && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between gap-2">
              <div className="text-xs text-blue-900">
                <span className="font-bold block">Entry Already Recorded</span>
                <span className="text-[11px] text-blue-800">
                  Paid: {formatTaka(currentMonthData?.amount || 2800)} on {currentMonthData?.date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmRevert(true)}
                className="px-2.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Revert / Delete</span>
              </button>
            </div>
          )}

          {/* Payment Amount & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Installment Amount (Tk.)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-emerald-500"
              >
                <option value="Bank Deposit">Bank Deposit (Islami Bank)</option>
                <option value="bKash">bKash Merchant</option>
                <option value="Nagad">Nagad Online</option>
                <option value="Cash">Cash to Treasurer</option>
                <option value="BEFTN / NPSB">BEFTN / NPSB Transfer</option>
              </select>
            </div>
          </div>

          {/* Late fee option if applicable */}
          {isCurrentlyDue && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLateFee}
                  onChange={(e) => setIncludeLateFee(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900">
                    Include 10% Late Fee Fine (Tk. 280)
                  </span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Check this if member is paying the overdue penalty fee alongside installment.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deposit Slip / Bank Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. IBBL Slip #98234 or bKash TrxID #8X76"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-emerald-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {isCurrentlyPaid ? (
              <button
                type="button"
                onClick={() => setShowConfirmRevert(true)}
                className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete this payment entry</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm transition-colors cursor-pointer"
              >
                {isCurrentlyPaid ? 'Save Changes' : 'Confirm & Record Payment'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation to Revert/Delete Payment */}
      {showConfirmRevert && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Revert / Delete Payment?</h4>
                <p className="text-xs text-slate-500">
                  {selectedShareId} &bull; {selectedMonth} &bull; {formatTaka(currentMonthData?.amount || 2800)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              How would you like to revert this payment for <strong>{currentShare.memberName}</strong> ({selectedShareId}) for <strong>{selectedMonth}</strong>?
            </p>

            <div className="space-y-2 mb-6">
              <button
                type="button"
                onClick={() => handleExecuteRevert('due')}
                className="w-full text-left p-3 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100 transition-colors cursor-pointer"
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
                onClick={() => handleExecuteRevert('upcoming')}
                className="w-full text-left p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-800 text-xs block">
                  Reset to Unpaid / Upcoming (সম্পূর্ণ মুছে ফেলুন - Unpaid)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Completely clears payment, marking as pending/upcoming with no fine.
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmRevert(false)}
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
