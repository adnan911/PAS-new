import React, { useState } from 'react';
import { ShareRecord, ALL_MONTHS } from '../types';
import { calculateShareRecord } from '../utils/calculations';
import { X, UserPlus, ShieldPlus } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  shares: ShareRecord[];
  onAddShare: (newShare: ShareRecord) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  shares,
  onAddShare,
}) => {
  // Compute the highest existing numeric PAS ID
  const maxIdNum = shares.reduce((max, s) => {
    const matches = s.id.match(/\d+/g);
    if (matches) {
      const nums = matches.map(Number);
      return Math.max(max, ...nums);
    }
    return max;
  }, 0);
  const suggestedId = `PAS-${(maxIdNum + 1).toString().padStart(2, '0')}`;

  const [id, setId] = useState<string>(suggestedId);
  const [memberName, setMemberName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+880 17');
  const [admissionFee, setAdmissionFee] = useState<number>(5000);

  React.useEffect(() => {
    if (isOpen) {
      setId(suggestedId);
      setMemberName('');
      setPhone('+880 17');
      setAdmissionFee(5000);
    }
  }, [isOpen, suggestedId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    const newRecord: ShareRecord = calculateShareRecord({
      id: id.trim().toUpperCase(),
      sl: shares.filter((s) => !s.isClosed).length + 1,
      memberName: memberName.trim(),
      phone: phone.trim(),
      admissionFee: Number(admissionFee) || 5000,
      months: {
        'Aug-26': { status: 'upcoming', amount: 2800 },
        'Sep-26': { status: 'upcoming', amount: 2800 },
        'Oct-26': { status: 'upcoming', amount: 2800 },
        'Nov-26': { status: 'upcoming', amount: 2800 },
        'Dec-26': { status: 'upcoming', amount: 2800 },
      },
      totalDeposit: 0,
      dueMonths: 0,
      dueAmount: 0,
      lateFee: 0,
      totalDue: 0,
      lateFeePaid: 0,
    });

    onAddShare(newRecord);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Add New Society Share</h3>
              <p className="text-[11px] text-slate-500">Allocate share certificate and admission slot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add share dialog"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Share ID No</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. PAS-33"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-teal-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Member Full Name</label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="e.g. Md. Shahidul Alam"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-teal-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1711-XXXXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Admission Fee (Tk.)</label>
            <input
              type="number"
              value={admissionFee}
              onChange={(e) => setAdmissionFee(Number(e.target.value))}
              min="0"
              step="500"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-teal-500"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Standard society admission fee is Tk. 5,000 per share.
            </span>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-sm transition-colors cursor-pointer"
            >
              Register Share
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
