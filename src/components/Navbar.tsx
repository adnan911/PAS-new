import { Building2, Plus, Download, Printer, RotateCcw, CreditCard, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenRecordPayment: () => void;
  onOpenAddShare: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onResetData: () => void;
  isSheetConnected: boolean;
  isSyncing: boolean;
  sheetTitle?: string;
  onOpenSyncModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRecordPayment,
  onOpenAddShare,
  onExportCSV,
  onPrint,
  onResetData,
  isSheetConnected,
  isSyncing,
  sheetTitle,
  onOpenSyncModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Society Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-400/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-white">
                  PROGRESSIVE ASSOCIATION SOCIETY
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Fund Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                MEMBER PAYMENT &amp; INSTALLMENT DASHBOARD (FY 2026-27)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            {/* Google Sheet Sync Button */}
            <button
              onClick={onOpenSyncModal}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isSheetConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/60 shadow-xs'
                  : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
              }`}
              title={
                isSheetConnected
                  ? `Connected to Google Sheet: ${sheetTitle || 'Live'}. Click to manage sync.`
                  : 'Connect Google Sheet for two-way synchronization'
              }
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isSheetConnected ? 'Sheet Synced' : 'Sync Google Sheet'}</span>
              {isSheetConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              onClick={onOpenRecordPayment}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Record member installment or admission fee"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>

            <button
              onClick={onOpenAddShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-all hover:text-white cursor-pointer"
              title="Add a new share or member"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Share</span>
            </button>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-all hover:text-white cursor-pointer"
              title="Export current ledger to CSV / Excel spreadsheet"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-all hover:text-white cursor-pointer"
              title="Print dashboard summary and ledger report"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs sm:text-sm font-medium border border-slate-700 hover:border-rose-800/60 transition-all cursor-pointer"
              title="Reset data back to original Excel sheet state"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
