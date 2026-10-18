import React from 'react';
import { SocietySummary } from '../types';
import { formatTaka } from '../utils/calculations';
import { Users, Landmark, AlertCircle, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  summary: SocietySummary;
  onFilterOverdue?: () => void;
  onFilterAll?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  onFilterOverdue,
  onFilterAll,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Total Active Shares */}
      <div
        onClick={onFilterAll}
        className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/60 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Active Shares
          </span>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalActiveShares} Shares
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">
            30 Active Shares ({summary.totalMembers} Members)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            32 Total IDs
          </span>
        </div>
      </div>

      {/* 2. Total Bank Deposit */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/60 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Bank Deposit
          </span>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
            {formatTaka(summary.totalBankDeposit)}
          </span>
          <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" /> Verified
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Admission Fee:</span>
            <span className="font-semibold text-slate-800">{formatTaka(summary.totalAdmissionCollected)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Monthly Installments:</span>
            <span className="font-semibold text-slate-800">{formatTaka(summary.totalMonthlyCollected)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Late Fee Realized:</span>
            <span className="font-medium">{formatTaka(summary.totalLateFeeCollected)}</span>
          </div>
        </div>
      </div>

      {/* 3. Total Outstanding Due */}
      <div
        onClick={onFilterOverdue}
        className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer ${
          summary.totalOutstandingDue > 0 ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
        }`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/60 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Outstanding Due
          </span>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight whitespace-nowrap">
            {formatTaka(summary.totalOutstandingDue)}
          </span>
          {summary.totalDueMonths > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {summary.totalDueMonths} Months Overdue
            </span>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Installment Due:</span>
            <span className="font-semibold text-slate-800">{formatTaka(summary.totalDuePrincipal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Late Fee (10%):</span>
            <span className="font-semibold text-rose-600">{formatTaka(summary.totalLateFeeDue)}</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 text-xs text-amber-700 font-medium">
            <span>Action Required:</span>
            <span>Click to view 3 shares</span>
          </div>
        </div>
      </div>
    </div>
  );
};
