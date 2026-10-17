import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShareRecord, MonthKey, SocietySummary } from './types';
import { INITIAL_SHARES } from './data/initialData';
import { calculateShareRecord, calculateSocietySummary, formatTaka } from './utils/calculations';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { MasterLedgerTable } from './components/MasterLedgerTable';
import { MemberCardsView } from './components/MemberCardsView';
import { MonthReconciliationView } from './components/MonthReconciliationView';
import { OverdueRemindersView } from './components/OverdueRemindersView';
import { MoneyReceiptModal } from './components/MoneyReceiptModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { AddMemberModal } from './components/AddMemberModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { initAuth, googleSignIn, getAccessToken, logout } from './services/googleAuth';
import {
  SheetMetadata,
  fetchSpreadsheetMetadata,
  createGoogleSpreadsheet,
  pushToGoogleSheet,
  applySheetStyling,
  pullFromGoogleSheet,
  extractSpreadsheetId,
} from './services/googleSheets';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Table,
  Users,
  CalendarDays,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'pas_fund_shares_data_v1';
const SHEET_ID_KEY = 'pas_google_sheet_id_v1';
const AUTO_SYNC_KEY = 'pas_google_sheet_autosync_v1';

export default function App() {
  const [shares, setShares] = useState<ShareRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ShareRecord[] = JSON.parse(saved);
        return parsed.map((s) => calculateShareRecord(s));
      }
    } catch (e) {
      console.error('Failed to parse saved shares:', e);
    }
    return INITIAL_SHARES;
  });

  const [activeTab, setActiveTab] = useState<'ledger' | 'cards' | 'months' | 'defaulters'>('ledger');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'paid' | 'closed'>('all');

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [selectedShareForPayment, setSelectedShareForPayment] = useState<ShareRecord | null>(null);
  const [selectedMonthForPayment, setSelectedMonthForPayment] = useState<MonthKey | undefined>(undefined);

  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [selectedShareForReceipt, setSelectedShareForReceipt] = useState<ShareRecord | null>(null);
  const [selectedMonthForReceipt, setSelectedMonthForReceipt] = useState<MonthKey>('Oct-26');

  const [isAddShareOpen, setIsAddShareOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<string | null>(null);

  // Google Sheets Live Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [connectedSheet, setConnectedSheet] = useState<SheetMetadata | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_SYNC_KEY) === 'true';
    } catch {
      return true;
    }
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [shares]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Overall society summary
  const summary: SocietySummary = useMemo(() => {
    return calculateSocietySummary(shares);
  }, [shares]);

  // Filtered shares
  const filteredShares = useMemo(() => {
    return shares.filter((s) => {
      // Status filter
      if (statusFilter === 'overdue' && (s.dueMonths === 0 || s.isClosed)) return false;
      if (statusFilter === 'paid' && (s.dueMonths > 0 || s.isClosed)) return false;
      if (statusFilter === 'closed' && !s.isClosed) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.memberName.toLowerCase().includes(q);
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesPhone = s.phone ? s.phone.toLowerCase().includes(q) : false;
        return matchesName || matchesId || matchesPhone;
      }

      return true;
    });
  }, [shares, statusFilter, searchQuery]);

  // Routing Handlers
  const handleOpenPaymentForShare = (share: ShareRecord, month?: MonthKey) => {
    setSelectedShareForPayment(share);
    if (month) {
      setSelectedMonthForPayment(month);
    } else if (share.dueMonths > 0) {
      const firstDue = (['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'] as MonthKey[]).find(
        (m) => share.months[m]?.status === 'due'
      );
      setSelectedMonthForPayment(firstDue || 'Sep-26');
    } else {
      const firstUpcoming = (['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'] as MonthKey[]).find(
        (m) => share.months[m]?.status === 'upcoming'
      );
      setSelectedMonthForPayment(firstUpcoming || 'Nov-26');
    }
    setIsRecordPaymentOpen(true);
  };

  const handleOpenReceiptForShare = (share: ShareRecord, month?: MonthKey) => {
    let targetMonth = month || 'Oct-26';
    if (share.months[targetMonth]?.status !== 'paid') {
      const lastPaid = (['Dec-26', 'Nov-26', 'Oct-26', 'Sep-26', 'Aug-26'] as MonthKey[]).find(
        (m) => share.months[m]?.status === 'paid'
      );
      if (lastPaid) targetMonth = lastPaid;
    }
    setSelectedShareForReceipt(share);
    setSelectedMonthForReceipt(targetMonth);
    setIsReceiptOpen(true);
  };

  // Initialize Google Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        // If a sheet ID is saved in localStorage, load its metadata
        const savedSheetId = localStorage.getItem(SHEET_ID_KEY);
        if (savedSheetId) {
          fetchSpreadsheetMetadata(savedSheetId, token)
            .then((meta) => {
              setConnectedSheet(meta);
              setLastSyncedAt(new Date());
            })
            .catch((err) => {
              console.warn('Could not verify saved spreadsheet:', err);
            });
        }
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Auth Handlers
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        showToast(`Signed in with Google as ${res.user.email}`);

        // Try restoring saved sheet if present
        const savedSheetId = localStorage.getItem(SHEET_ID_KEY);
        if (savedSheetId) {
          const meta = await fetchSpreadsheetMetadata(savedSheetId, res.accessToken);
          setConnectedSheet(meta);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err: any) {
      showToast(`Google Sign-in: ${err?.message || 'Authentication cancelled'}`);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      showToast('Signed out of Google account.');
    } catch (err: any) {
      showToast(`Sign out error: ${err?.message}`);
    }
  };

  // Google Sheets Management
  const handleLinkExistingSheet = async (input: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    const id = extractSpreadsheetId(input);
    if (!id) throw new Error('Please enter a valid Google Sheet URL or ID.');

    const meta = await fetchSpreadsheetMetadata(id, token);
    setConnectedSheet(meta);
    localStorage.setItem(SHEET_ID_KEY, meta.id);
    setLastSyncedAt(new Date());
    showToast(`Linked with Google Sheet: "${meta.title}"!`);
  };

  const handleCreateNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    const meta = await createGoogleSpreadsheet(
      'Progressive Association Society - Member Ledger (2026-27)',
      shares,
      summary,
      token
    );

    setConnectedSheet(meta);
    localStorage.setItem(SHEET_ID_KEY, meta.id);
    setLastSyncedAt(new Date());
    showToast(`Created & linked new Google Sheet: "${meta.title}"!`);
  };

  const handlePushToSheet = async () => {
    if (!connectedSheet) throw new Error('No Google Sheet linked.');
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    setIsSyncing(true);
    try {
      await pushToGoogleSheet(connectedSheet.id, connectedSheet.sheetName, shares, summary, token);
      try {
        await applySheetStyling(connectedSheet.id, connectedSheet.sheetId, shares, token);
      } catch (styleErr) {
        console.warn('Styling update warning:', styleErr);
      }
      setLastSyncedAt(new Date());
      showToast(`Successfully pushed 31 shares to "${connectedSheet.title}"!`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!connectedSheet) throw new Error('No Google Sheet linked.');
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    setIsSyncing(true);
    try {
      const importedShares = await pullFromGoogleSheet(
        connectedSheet.id,
        connectedSheet.sheetName,
        token
      );
      setShares(importedShares);
      setLastSyncedAt(new Date());
      showToast(`Updated ${importedShares.length} shares from Google Sheet!`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem(AUTO_SYNC_KEY, enabled.toString());
    showToast(enabled ? 'Automatic Google Sheet sync enabled.' : 'Auto-sync paused.');
  };

  const handleDisconnectSheet = () => {
    localStorage.removeItem(SHEET_ID_KEY);
    setConnectedSheet(null);
    showToast('Google Sheet unlinked from dashboard.');
  };

  // Auto-sync trigger on local changes
  const triggerAutoSyncIfEnabled = useCallback(
    async (updatedShares: ShareRecord[]) => {
      if (!autoSyncEnabled || !connectedSheet) return;
      try {
        const token = await getAccessToken();
        if (!token) return;
        setIsSyncing(true);
        const newSummary = calculateSocietySummary(updatedShares);
        await pushToGoogleSheet(
          connectedSheet.id,
          connectedSheet.sheetName,
          updatedShares,
          newSummary,
          token
        );
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Auto-sync to Google Sheet failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [autoSyncEnabled, connectedSheet]
  );

  // Payment Handlers
  const handleSavePayment = ({
    shareId,
    month,
    amount,
    date,
    paymentMethod,
    includeLateFee,
    notes,
  }: {
    shareId: string;
    month: MonthKey;
    amount: number;
    date: string;
    paymentMethod: string;
    includeLateFee: boolean;
    notes?: string;
  }) => {
    const updated = shares.map((s) => {
      if (s.id !== shareId) return s;

      const updatedMonths = {
        ...s.months,
        [month]: {
          status: 'paid' as const,
          date,
          amount,
          paymentMethod,
          notes,
        },
      };

      const updatedShare: ShareRecord = {
        ...s,
        months: updatedMonths,
        lateFeePaid: includeLateFee ? s.lateFeePaid + 280 : s.lateFeePaid,
      };

      return calculateShareRecord(updatedShare);
    });

    setShares(updated);
    showToast(`Payment of Tk. ${amount.toLocaleString('en-IN')} recorded for ${shareId} (${month})!`);
    triggerAutoSyncIfEnabled(updated);
  };

  const handleClearFullDue = (shareId: string, waiveLateFee: boolean) => {
    const updated = shares.map((s) => {
      if (s.id !== shareId) return s;

      const updatedMonths = { ...s.months };
      for (const m of ['Sep-26', 'Oct-26'] as MonthKey[]) {
        if (updatedMonths[m]?.status === 'due') {
          updatedMonths[m] = {
            status: 'paid',
            date: '17.10.26',
            amount: 2800,
            paymentMethod: 'Bank Deposit',
          };
        }
      }

      const lateFeePaid = waiveLateFee ? 0 : s.lateFee;

      return calculateShareRecord({
        ...s,
        months: updatedMonths,
        lateFeePaid,
      });
    });

    setShares(updated);
    showToast(
      waiveLateFee
        ? `Full dues cleared for ${shareId} with late fee waived.`
        : `Full dues & late fee cleared for ${shareId}.`
    );
    triggerAutoSyncIfEnabled(updated);
  };

  const handleAddShare = (newShare: ShareRecord) => {
    const updated = [...shares, newShare];
    setShares(updated);
    showToast(`Share ${newShare.id} registered successfully for ${newShare.memberName}!`);
    triggerAutoSyncIfEnabled(updated);
  };

  const handleRevertPayment = (
    shareId: string,
    month: MonthKey,
    targetStatus?: 'due' | 'upcoming'
  ) => {
    // Intelligently default to 'due' for past billing months (Aug, Sep, Oct) and 'upcoming' for future months
    const defaultStatus: 'due' | 'upcoming' =
      targetStatus ||
      (month === 'Nov-26' || month === 'Dec-26' ? 'upcoming' : 'due');

    const updated = shares.map((s) => {
      if (s.id !== shareId) return s;

      const updatedMonths = {
        ...s.months,
        [month]: {
          status: defaultStatus,
          amount: 2800,
        },
      };

      return calculateShareRecord({
        ...s,
        months: updatedMonths,
        lateFeePaid: Math.max(0, (s.lateFeePaid || 0) - 280),
      });
    });

    setShares(updated);
    showToast(
      defaultStatus === 'due'
        ? `Payment for ${shareId} (${month}) reverted to Overdue (Due).`
        : `Payment entry for ${shareId} (${month}) has been deleted.`
    );
    triggerAutoSyncIfEnabled(updated);
  };

  const handleDeleteShare = (shareId: string) => {
    const updated = shares.filter((s) => s.id !== shareId);
    setShares(updated);
    showToast(`Share ${shareId} deleted from register.`);
    triggerAutoSyncIfEnabled(updated);
  };

  const handleConfirmReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setShares(INITIAL_SHARES);
    setIsResetConfirmOpen(false);
    showToast('Data reset back to original Progressive Association Society Excel ledger.');
  };

  const handleExportCSV = () => {
    let csv = 'PROGRESSIVE ASSOCIATION SOCIETY\n';
    csv += 'MEMBER PAYMENT & INSTALLMENT DASHBOARD\n';
    csv += `TOTAL ACTIVE SHARES,"${summary.totalActiveShares} Shares",,,,TOTAL BANK DEPOSIT,"৳${summary.totalBankDeposit.toLocaleString('en-IN')}",,,,TOTAL OUTSTANDING DUE,"৳${summary.totalOutstandingDue.toLocaleString('en-IN')}",,,,COLLECTION EFFICIENCY,"${summary.collectionEfficiency}%"\n`;
    csv += `30 Active Members (32 IDs),,,,"Admission: ৳${summary.totalAdmissionCollected.toLocaleString('en-IN')} | Monthly: ৳${summary.totalMonthlyCollected.toLocaleString('en-IN')} | Late Fee: ৳${summary.totalLateFeeCollected.toLocaleString('en-IN')}",,,,"Due: ৳${summary.totalDuePrincipal.toLocaleString('en-IN')} + Late Fee: ৳${summary.totalLateFeeDue.toLocaleString('en-IN')}"\n`;
    csv += 'SL,Member Name,Share ID, Admission Fee ,Month of Aug-26,,Month of Sep-26,,Month of Oct-26,,Month of Nov-26,,Month of Dec-26,, Total Deposit ,Due Months,Due Amount,Late Fee (10%),Total Due,Late Fee Paid\n';
    csv += ',,,,Date, Amount ,Date, Amount ,Date, Amount ,Date, Amount ,Date, Amount ,,,,,,\n';

    for (const s of shares) {
      const aug = s.months['Aug-26'];
      const sep = s.months['Sep-26'];
      const oct = s.months['Oct-26'];
      const nov = s.months['Nov-26'];
      const dec = s.months['Dec-26'];

      const row = [
        s.sl || '',
        `"${s.memberName}"`,
        `"${s.id}"`,
        `"${s.admissionFee.toLocaleString('en-IN')}"`,
        aug?.status === 'paid' ? aug.date : aug?.status === 'due' ? 'Due' : '',
        aug?.status === 'paid' ? `"${aug.amount.toLocaleString('en-IN')}"` : '',
        sep?.status === 'paid' ? sep.date : sep?.status === 'due' ? 'Due' : '',
        sep?.status === 'paid' ? `"${sep.amount.toLocaleString('en-IN')}"` : '',
        oct?.status === 'paid' ? oct.date : oct?.status === 'due' ? 'Due' : '',
        oct?.status === 'paid' ? `"${oct.amount.toLocaleString('en-IN')}"` : '',
        nov?.status === 'paid' ? nov.date : nov?.status === 'due' ? 'Due' : '',
        nov?.status === 'paid' ? `"${nov.amount.toLocaleString('en-IN')}"` : '',
        dec?.status === 'paid' ? dec.date : dec?.status === 'due' ? 'Due' : '',
        dec?.status === 'paid' ? `"${dec.amount.toLocaleString('en-IN')}"` : '',
        `"${s.totalDeposit.toLocaleString('en-IN')}"`,
        s.dueMonths > 0 ? s.dueMonths : '-',
        s.dueAmount > 0 ? `"${s.dueAmount.toLocaleString('en-IN')}"` : '-',
        s.lateFee > 0 ? s.lateFee : '-',
        s.totalDue > 0 ? `"${s.totalDue.toLocaleString('en-IN')}"` : '-',
        s.lateFeePaid > 0 ? s.lateFeePaid : '-',
      ];
      csv += row.join(',') + '\n';
    }

    // Grand total row
    csv += `,GRAND TOTAL,,"${summary.totalAdmissionCollected.toLocaleString('en-IN')}",,"${summary.monthStats['Aug-26'].paidAmount.toLocaleString('en-IN')}",,"${summary.monthStats['Sep-26'].paidAmount.toLocaleString('en-IN')}",,"${summary.monthStats['Oct-26'].paidAmount.toLocaleString('en-IN')}",,,,,,"${summary.totalBankDeposit.toLocaleString('en-IN')}",${summary.totalDueMonths},"${summary.totalDuePrincipal.toLocaleString('en-IN')}",${summary.totalLateFeeDue},"${summary.totalOutstandingDue.toLocaleString('en-IN')}",-\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PAS_Fund_Collection_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenRecordPayment={() => handleOpenPaymentForShare(shares[0])}
        onOpenAddShare={() => setIsAddShareOpen(true)}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        onResetData={() => setIsResetConfirmOpen(true)}
        isSheetConnected={!!connectedSheet}
        isSyncing={isSyncing}
        sheetTitle={connectedSheet?.title}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Summary Cards */}
        <SummaryCards
          summary={summary}
          onFilterOverdue={() => {
            setActiveTab('defaulters');
          }}
          onFilterAll={() => {
            setStatusFilter('all');
            setActiveTab('ledger');
          }}
        />

        {/* View Switcher & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex items-center flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Master Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Member Cards</span>
            </button>

            <button
              onClick={() => setActiveTab('months')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'months'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-teal-600" />
              <span>Month Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('defaulters')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'defaulters'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Overdue ({summary.totalDueMonths > 0 ? `${summary.totalDueMonths / 2} Shares` : '0'})</span>
            </button>
          </div>

          {/* Search & Status Filters (Relevant when looking at Ledger or Cards) */}
          {(activeTab === 'ledger' || activeTab === 'cards') && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Status chips */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({shares.length})
                </button>
                <button
                  onClick={() => setStatusFilter('overdue')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                    statusFilter === 'overdue'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Due (3)
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                    statusFilter === 'paid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Paid (27)
                </button>
                <button
                  onClick={() => setStatusFilter('closed')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                    statusFilter === 'closed'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Closed (1)
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, PAS-ID..."
                  className="w-full sm:w-48 pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab View Content */}
        {activeTab === 'ledger' && (
          <MasterLedgerTable
            shares={filteredShares}
            summary={summary}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onOpenReceiptForShare={handleOpenReceiptForShare}
            onSelectMember={(name) => {
              setSelectedMemberForDetail(name);
            }}
            onDeleteShare={handleDeleteShare}
          />
        )}

        {activeTab === 'cards' && (
          <MemberCardsView
            shares={filteredShares}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onOpenReceiptForShare={handleOpenReceiptForShare}
            onSelectMember={(name) => {
              setSelectedMemberForDetail(name);
            }}
          />
        )}

        {activeTab === 'months' && (
          <MonthReconciliationView
            shares={shares}
            summary={summary}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onOpenReceiptForShare={handleOpenReceiptForShare}
          />
        )}

        {activeTab === 'defaulters' && (
          <OverdueRemindersView
            shares={shares}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onClearFullDue={handleClearFullDue}
          />
        )}
      </main>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        shares={shares}
        initialShare={selectedShareForPayment}
        initialMonth={selectedMonthForPayment}
        onSavePayment={handleSavePayment}
        onRevertPayment={handleRevertPayment}
      />

      {/* Official Money Receipt Modal */}
      <MoneyReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        share={selectedShareForReceipt}
        month={selectedMonthForReceipt}
        onVoidPayment={(shareId, month, status) => handleRevertPayment(shareId, month, status)}
        onEditPayment={(share, month) => handleOpenPaymentForShare(share, month)}
      />

      {/* Add Share Modal */}
      <AddMemberModal
        isOpen={isAddShareOpen}
        onClose={() => setIsAddShareOpen(false)}
        shares={shares}
        onAddShare={handleAddShare}
      />

      {/* Member Details Portfolio Modal */}
      <MemberDetailModal
        isOpen={!!selectedMemberForDetail}
        onClose={() => setSelectedMemberForDetail(null)}
        memberName={selectedMemberForDetail}
        shares={shares}
        onOpenPaymentForShare={(share, month) => {
          setSelectedMemberForDetail(null);
          handleOpenPaymentForShare(share, month);
        }}
        onOpenReceiptForShare={(share, month) => {
          handleOpenReceiptForShare(share, month);
        }}
        onDeleteShare={handleDeleteShare}
      />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetConfirmOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Ledger Data?</h3>
                <p className="text-xs text-slate-500">Restore original Excel spreadsheet values</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This will restore the entire society register back to the original Excel dashboard values (30 active shares, Tk. 3,95,200 deposited, Tk. 17,640 due).
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Google Sheet Live Two-Way Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentUser={currentUser}
        connectedSheet={connectedSheet}
        isSyncing={isSyncing}
        autoSyncEnabled={autoSyncEnabled}
        lastSyncedAt={lastSyncedAt}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        onLinkExistingSheet={handleLinkExistingSheet}
        onCreateNewSheet={handleCreateNewSheet}
        onPullFromSheet={handlePullFromSheet}
        onPushToSheet={handlePushToSheet}
        onToggleAutoSync={handleToggleAutoSync}
        onDisconnectSheet={handleDisconnectSheet}
      />
    </div>
  );
}
