import React, { useMemo } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS } from '../types';
import { formatTaka } from '../utils/calculations';
import { User, ShieldCheck, AlertCircle, Phone, ArrowUpRight, CheckCircle2, Clock, Check } from 'lucide-react';

interface MemberCardsViewProps {
  shares: ShareRecord[];
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
  onSelectMember: (memberName: string) => void;
}

interface GroupedMember {
  name: string;
  phone?: string;
  shares: ShareRecord[];
  totalAdmission: number;
  totalDeposited: number;
  totalDue: number;
  dueMonthsCount: number;
  isAllPaid: boolean;
}

export const MemberCardsView: React.FC<MemberCardsViewProps> = ({
  shares,
  onOpenPaymentForShare,
  onOpenReceiptForShare,
  onSelectMember,
}) => {
  const groupedMembers = useMemo(() => {
    const map = new Map<string, GroupedMember>();

    for (const s of shares) {
      if (s.isClosed) continue;
      const key = s.memberName || 'Member PAS-17';
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          phone: s.phone,
          shares: [],
          totalAdmission: 0,
          totalDeposited: 0,
          totalDue: 0,
          dueMonthsCount: 0,
          isAllPaid: true,
        });
      }

      const m = map.get(key)!;
      m.shares.push(s);
      m.totalAdmission += s.admissionFee;
      m.totalDeposited += s.totalDeposit;
      m.totalDue += s.totalDue;
      m.dueMonthsCount += s.dueMonths;
      if (s.dueMonths > 0) {
        m.isAllPaid = false;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // Show members with dues first, then by name
      if (b.totalDue !== a.totalDue) return b.totalDue - a.totalDue;
      return a.name.localeCompare(b.name);
    });
  }, [shares]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {groupedMembers.map((member) => (
        <div
          key={member.name}
          className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
            !member.isAllPaid
              ? 'border-amber-300 ring-1 ring-amber-200/70'
              : 'border-slate-200/90'
          }`}
        >
          {/* Card Top / Header */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                    !member.isAllPaid
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'M'}
                </div>
                <div>
                  <h3
                    onClick={() => onSelectMember(member.name)}
                    className="font-bold text-slate-900 text-base hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {member.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {member.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {member.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              {member.isAllPaid ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Up to Date
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> Due Overdue
                </span>
              )}
            </div>

            {/* Share Badges */}
            <div className="flex flex-wrap gap-1.5 my-3">
              {member.shares.map((s) => (
                <span
                  key={s.id}
                  className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                    s.dueMonths > 0
                      ? 'bg-rose-100 text-rose-900 border border-rose-200 font-bold'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {s.id} {s.dueMonths > 0 && `(Due ${s.dueMonths}m)`}
                </span>
              ))}
              <span className="text-xs text-slate-400 self-center ml-1">
                ({member.shares.length} {member.shares.length > 1 ? 'shares' : 'share'})
              </span>
            </div>

            {/* Financial Summary Box */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs mt-3">
              <div>
                <span className="text-slate-500 block">Total Deposited</span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  {formatTaka(member.totalDeposited)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Outstanding Due</span>
                <span
                  className={`text-base font-bold font-mono ${
                    member.totalDue > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}
                >
                  {formatTaka(member.totalDue)}
                </span>
              </div>
            </div>

            {/* Month-by-month mini timeline */}
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Installment Months
              </span>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {ALL_MONTHS.map((m) => {
                  // check if any share has this month paid or due
                  const isAnyDue = member.shares.some((s) => s.months[m]?.status === 'due');
                  const isAllPaid = member.shares.every((s) => s.months[m]?.status === 'paid');
                  const isUpcoming = member.shares.every(
                    (s) => s.months[m]?.status === 'upcoming'
                  );

                  return (
                    <div
                      key={m}
                      className={`p-1.5 rounded text-[11px] font-mono border ${
                        isAnyDue
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                          : isAllPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <div className="text-[9px] font-sans font-medium uppercase text-slate-400">
                        {m.replace('-26', '')}
                      </div>
                      <div className="mt-0.5 flex items-center justify-center min-h-[16px]">
                        {isAnyDue ? (
                          <span className="text-[10px] font-bold text-rose-700">DUE</span>
                        ) : isAllPaid ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onSelectMember(member.name)}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Portfolio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {member.totalDue > 0 ? (
              <button
                onClick={() => onOpenPaymentForShare(member.shares[0])}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Collect {formatTaka(member.totalDue)}
              </button>
            ) : (
              <button
                onClick={() => onOpenPaymentForShare(member.shares[0])}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
              >
                Record Advance
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
