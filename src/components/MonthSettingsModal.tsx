import React, { useState, useMemo } from 'react';
import {
  Settings,
  X,
  Check,
  Clock,
  Layers,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface MonthSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allConfiguredMonths: string[];
  activeMonths: string[];
  currentMonth: string;
  onToggleMonthVisibility: (month: string) => void;
  onShowOnlyCurrentMonth: (month: string) => void;
  onShowAllMonths: () => void;
  onAddMonth: (monthKey: string) => void;
  onRemoveMonth: (monthKey: string) => void;
  onChangeCurrentMonth: (monthKey: string) => void;
}

// Generate all standard chronological months from Aug-26 up to Dec-29
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const PRESET_MONTHS_THROUGH_2029: string[] = [];

// Aug-26 to Dec-26
for (let m = 7; m < 12; m++) {
  PRESET_MONTHS_THROUGH_2029.push(`${MONTH_NAMES[m]}-26`);
}
// Full 2027, 2028, 2029
for (const year of ['27', '28', '29']) {
  for (const mName of MONTH_NAMES) {
    PRESET_MONTHS_THROUGH_2029.push(`${mName}-${year}`);
  }
}

export const MonthSettingsModal: React.FC<MonthSettingsModalProps> = ({
  isOpen,
  onClose,
  allConfiguredMonths,
  activeMonths,
  currentMonth,
  onToggleMonthVisibility,
  onShowOnlyCurrentMonth,
  onShowAllMonths,
  onAddMonth,
  onRemoveMonth,
  onChangeCurrentMonth,
}) => {
  const { requireAdmin } = useAuth();
  const [selectedYearTab, setSelectedYearTab] = useState<string>('All');

  // Filter months by year tab for clean browsing (MUST be before any return null)
  const filteredTimeline = useMemo(() => {
    if (selectedYearTab === 'All') return PRESET_MONTHS_THROUGH_2029;
    return PRESET_MONTHS_THROUGH_2029.filter((m) => m.endsWith(`-${selectedYearTab}`));
  }, [selectedYearTab]);

  if (!isOpen) return null;

  const isOnlyCurrentShowing =
    activeMonths.length === 1 && activeMonths[0] === currentMonth;

  const handleToggleMonth = (m: string) => {
    requireAdmin(() => {
      // If month is already in activeMonths, toggle it off
      if (activeMonths.includes(m)) {
        if (activeMonths.length <= 1) return;
        onToggleMonthVisibility(m);
      } else {
        // If not in configured months yet, ensure it is added
        if (!allConfiguredMonths.includes(m)) {
          onAddMonth(m);
        } else {
          onToggleMonthVisibility(m);
        }
      }
    }, `toggle month ${m}`);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                Ledger Month Settings
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Quick Display Mode Presets */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                requireAdmin(() => {
                  onShowOnlyCurrentMonth(currentMonth);
                }, 'switch to Current Month View');
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isOnlyCurrentShowing
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Month Only</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Focus on <strong>{currentMonth}</strong>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onShowAllMonths();
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                !isOnlyCurrentShowing
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Show All Months</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Display selected timeline
              </span>
            </button>
          </div>

          {/* Current Focused Month Selector */}
          <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Current Focused Month:</span>
            <select
              value={currentMonth}
              onChange={(e) => {
                const selected = e.target.value;
                requireAdmin(() => {
                  onChangeCurrentMonth(selected);
                }, `set current month to ${selected}`);
              }}
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {allConfiguredMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter Tabs for Clean Browsing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Months to Display (2026 - 2029)
              </label>
              <span className="text-[11px] text-slate-500 font-semibold font-mono">
                {activeMonths.length} Active
              </span>
            </div>

            {/* Year tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 mb-2.5">
              {['All', '26', '27', '28', '29'].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYearTab(yr)}
                  className={`flex-1 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    selectedYearTab === yr
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr === 'All' ? 'All' : `20${yr}`}
                </button>
              ))}
            </div>

            {/* Grid of Months with Clean Checkboxes */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {filteredTimeline.map((m) => {
                const isActive = activeMonths.includes(m);
                const isCurrent = m === currentMonth;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleToggleMonth(m)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{m}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ml-1 border ${
                        isActive
                          ? 'bg-white text-emerald-700 border-white'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {activeMonths.length} month(s) visible on ledger
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
