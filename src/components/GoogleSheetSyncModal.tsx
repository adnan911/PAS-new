import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { SheetMetadata, extractSpreadsheetId } from '../services/googleSheets';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Plus,
  Link,
  ShieldCheck,
} from 'lucide-react';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  connectedSheet: SheetMetadata | null;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  lastSyncedAt: Date | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onLinkExistingSheet: (sheetIdOrUrl: string) => Promise<void>;
  onCreateNewSheet: () => Promise<void>;
  onPullFromSheet: () => Promise<void>;
  onPushToSheet: () => Promise<void>;
  onToggleAutoSync: (enabled: boolean) => void;
  onDisconnectSheet: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  connectedSheet,
  isSyncing,
  autoSyncEnabled,
  lastSyncedAt,
  onSignIn,
  onSignOut,
  onLinkExistingSheet,
  onCreateNewSheet,
  onPullFromSheet,
  onPushToSheet,
  onToggleAutoSync,
  onDisconnectSheet,
}) => {
  const [sheetInput, setSheetInput] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Destructive confirmation state
  const [confirmAction, setConfirmAction] = useState<'pull' | 'push' | null>(null);

  if (!isOpen) return null;

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetInput.trim()) return;
    setErrorMsg(null);
    setIsLinking(true);
    try {
      await onLinkExistingSheet(sheetInput.trim());
      setSheetInput('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to Google Sheet.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleCreateNew = async () => {
    setErrorMsg(null);
    setIsCreating(true);
    try {
      await onCreateNewSheet();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create Google Sheet.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteConfirmedAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    setErrorMsg(null);

    try {
      if (action === 'push') {
        await onPushToSheet();
      } else if (action === 'pull') {
        await onPullFromSheet();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${action} Google Sheet.`);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmAction) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Google Sheets Live Sync
              </h3>
              <p className="text-[11px] text-slate-500">
                Two-way synchronization between Portal Dashboard &amp; Google Sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sync modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Google Account Status */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {currentUser.displayName || 'Authorized Admin'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                      Connected
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">{currentUser.email}</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                  Google Workspace Authentication
                </span>
                <span className="text-[11px] text-slate-500">
                  Sign in with Google to enable two-way sync with Google Sheets
                </span>
              </div>
            )}

            <div>
              {currentUser ? (
                <button
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Account</span>
                </button>
              ) : (
                <button
                  onClick={onSignIn}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-xs shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all hover:shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Connected Sheet Status or Connection Options */}
          {connectedSheet ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Active Google Sheet
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">
                      {connectedSheet.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                      ID: {connectedSheet.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={connectedSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open in Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={onDisconnectSheet}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
                      title="Unlink this spreadsheet"
                    >
                      Unlink
                    </button>
                  </div>
                </div>

                {/* Last synced status */}
                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {lastSyncedAt
                        ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}`
                        : 'Ready to synchronize'}
                    </span>
                  </span>
                  {isSyncing && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Syncing...</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Two-Way Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pull Action Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <DownloadCloud className="w-4 h-4 text-blue-600" />
                    <span>Pull from Google Sheet</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Import changes edited in the Google Sheet directly into the dashboard.
                  </p>
                  <button
                    onClick={() => setConfirmAction('pull')}
                    disabled={isSyncing}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Pull Latest from Sheet
                  </button>
                </div>

                {/* Push Action Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>Push to Google Sheet</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Update the Google Sheet with all current dashboard payments &amp; dues.
                  </p>
                  <button
                    onClick={() => setConfirmAction('push')}
                    disabled={isSyncing}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Push Dashboard to Sheet
                  </button>
                </div>
              </div>

              {/* Auto-Sync Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 text-xs block">
                    Automatic Sync on Update
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Automatically push to Google Sheet when recording a payment or clearing dues
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => onToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          ) : (
            /* When No Sheet is Connected */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Connect with Google Sheets</span>
                  <p className="text-blue-800/80 leading-relaxed">
                    Choose whether you want to create a brand new Google Sheet in your Drive, or link to an existing spreadsheet.
                  </p>
                </div>
              </div>

              {/* Option A: Create New Sheet */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Create New Google Sheet</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Instantly generates a formatted 2026-27 Progressive Association Society Register in your Drive.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateNew}
                    disabled={!currentUser || isCreating}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isCreating ? 'Creating...' : 'Create & Link'}
                  </button>
                </div>
                {!currentUser && (
                  <p className="text-[10px] text-amber-700 italic">
                    * Please sign in with Google first to create a spreadsheet.
                  </p>
                )}
              </div>

              {/* Option B: Link Existing Sheet */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 mb-1">
                  <Link className="w-4 h-4 text-blue-600" />
                  <span>Link Existing Google Sheet</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Paste the URL or Spreadsheet ID of your existing Google Sheet.
                </p>
                <form onSubmit={handleLinkSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-emerald-500"
                    disabled={!currentUser}
                  />
                  <button
                    type="submit"
                    disabled={!currentUser || isLinking || !sheetInput.trim()}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLinking ? 'Connecting...' : 'Connect'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted OAuth2 Workspace Connection</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Mutating Workspace Operations */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmAction === 'push'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {confirmAction === 'push' ? (
                  <UploadCloud className="w-5 h-5" />
                ) : (
                  <DownloadCloud className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {confirmAction === 'push'
                    ? 'Update Google Sheet Data?'
                    : 'Update Dashboard from Google Sheet?'}
                </h4>
                <p className="text-xs text-slate-500">
                  {confirmAction === 'push'
                    ? 'Confirm synchronization to Google Drive'
                    : 'Confirm reading spreadsheet updates'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {confirmAction === 'push'
                ? `Are you sure you want to push current dashboard records into "${connectedSheet?.title}"? This will overwrite the values in your Google Sheet with the latest dashboard payments and dues.`
                : `Are you sure you want to pull and apply the latest values from "${connectedSheet?.title}"? This will update local dashboard records with any changes made directly in the spreadsheet.`}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className={`px-4 py-2 rounded-lg text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                  confirmAction === 'push'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                Confirm &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
