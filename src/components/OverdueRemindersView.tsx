import React, { useState } from 'react';
import { ShareRecord, MonthKey } from '../types';
import { formatTaka } from '../utils/calculations';
import { AlertTriangle, Copy, Check, MessageSquare, CreditCard, ExternalLink, ShieldAlert } from 'lucide-react';

interface OverdueRemindersViewProps {
  shares: ShareRecord[];
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onClearFullDue: (shareId: string, waiveLateFee: boolean) => void;
}

export const OverdueRemindersView: React.FC<OverdueRemindersViewProps> = ({
  shares,
  onOpenPaymentForShare,
  onClearFullDue,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const dueShares = shares.filter((s) => !s.isClosed && s.dueMonths > 0);
  const totalDuePrincipal = dueShares.reduce((sum, s) => sum + s.dueAmount, 0);
  const totalLateFee = dueShares.reduce((sum, s) => sum + s.lateFee, 0);
  const totalOutstanding = totalDuePrincipal + totalLateFee;

  const handleCopyReminder = (share: ShareRecord) => {
    const text = `Assalamu Alaikum ${share.memberName},
This is a gentle payment reminder from PROGRESSIVE ASSOCIATION SOCIETY.
According to our records for Share ID: ${share.id}:
- Due Installments: Month of Sep-26 & Oct-26
- Principal Due: ${formatTaka(share.dueAmount)} (${share.dueMonths} months @ Tk. 2,800)
- Late Fee (10%): ${formatTaka(share.lateFee)}
- Total Payable: ${formatTaka(share.totalDue)}

Please deposit the due amount into the Society Bank Account or send via bKash/Nagad and confirm your deposit slip with the Treasurer.
Thank you for your active cooperation!
- Executive Committee, Progressive Association Society`;

    navigator.clipboard.writeText(text);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Outstanding Due &amp; Late Fee Recovery Console
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Currently <strong>{dueShares.length} shares</strong> are overdue for 2 installment cycles (Sep-26 &amp; Oct-26).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-lg border border-amber-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Dues</span>
              <span className="text-xl font-extrabold text-rose-700 font-mono">
                {formatTaka(totalOutstanding)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {dueShares.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Zero Outstanding Dues</h3>
          <p className="text-xs text-slate-500 mt-1">
            All member shares have cleared their installments. Collection efficiency is 100%!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dueShares.map((share) => (
            <div
              key={share.id}
              className="bg-white rounded-xl border-2 border-amber-300/90 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                      {share.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{share.memberName}</h3>
                    <p className="text-xs text-slate-500">{share.phone || '+880 1700-000000'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    {share.dueMonths} Mths Overdue
                  </span>
                </div>

                {/* Overdue Calculation Details */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Missed Months:</span>
                    <span className="font-semibold text-slate-800">Sep-26, Oct-26</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Principal Installments (2x Tk. 2,800):</span>
                    <span className="font-bold text-slate-800 font-mono">{formatTaka(share.dueAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Late Fee Penalty (10%):</span>
                    <span className="font-bold text-rose-600 font-mono">+{formatTaka(share.lateFee)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
                    <span className="text-slate-900">Total Outstanding:</span>
                    <span className="text-rose-700 font-mono text-base">{formatTaka(share.totalDue)}</span>
                  </div>
                </div>

                {/* WhatsApp & SMS template preview */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                  <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp / SMS Reminder</span>
                    </span>
                    <button
                      onClick={() => handleCopyReminder(share)}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === share.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    &ldquo;Assalamu Alaikum {share.memberName}, this is a gentle payment reminder from Progressive Association Society for Share ID {share.id}...&rdquo;
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onClearFullDue(share.id, false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Clear Full Due ({formatTaka(share.totalDue)})
                </button>
                <button
                  onClick={() => onClearFullDue(share.id, true)}
                  className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium transition-colors cursor-pointer text-center"
                  title="Clear principal installments and waive Tk. 280 late fee"
                >
                  Waive Late Fee
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
