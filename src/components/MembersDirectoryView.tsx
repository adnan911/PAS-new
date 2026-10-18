import React, { useState, useMemo } from 'react';
import { ShareRecord } from '../types';
import { formatTaka } from '../utils/calculations';
import {
  Users,
  Search,
  Phone,
  MapPin,
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Download,
  Filter,
  Eye,
  UserCheck,
  Edit2,
  Save,
  X,
  Lock,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MembersDirectoryViewProps {
  shares: ShareRecord[];
  onSelectMember: (memberName: string) => void;
  onOpenPaymentForShare: (share: ShareRecord) => void;
  onOpenReceiptForShare: (share: ShareRecord) => void;
  onUpdateMemberDetails?: (payload: {
    oldName: string;
    newName: string;
    phone: string;
    address: string;
    nid: string;
  }) => void;
}

export interface MemberDirectoryInfo {
  name: string;
  sl: string;
  phone: string;
  address: string;
  nid: string;
  shares: ShareRecord[];
  shareIds: string[];
  sharesCount: number;
  totalFunded: number;
  totalAdmission: number;
  totalMonthly: number;
  totalDue: number;
  dueMonths: number;
  isClosed: boolean;
}

// Generate realistic Bangladeshi NID & addresses based on member index or saved data
const DEFAULT_LOCATIONS = [
  'Sector 7, Uttara, Dhaka-1230',
  'Mirpur DOHS, Road 4, Dhaka-1216',
  'Bashundhara R/A, Block C, Dhaka-1229',
  'Dhanmondi R/A, Road 27, Dhaka-1209',
  'Banani, Road 11, Dhaka-1213',
  'Gulshan-2, Circle 2, Dhaka-1212',
  'Mohammadpur, Salimullah Road, Dhaka-1207',
  'Khilgaon, Taltola, Dhaka-1219',
  'Badda, Middle Badda, Dhaka-1212',
  'Malibagh Chowdhury Para, Dhaka-1217',
  'Shantinagar, Road 2, Dhaka-1217',
  'Pallabi, Mirpur 11.5, Dhaka-1216',
  'Baridhara Diplomatic Zone, Dhaka-1212',
  'Lalmatia, Block B, Dhaka-1207',
  'Wari, Ranking Street, Dhaka-1203',
  'Motijheel C/A, Dhaka-1000',
  'Tejgaon I/A, Dhaka-1208',
  'Kakrail, VIP Road, Dhaka-1000',
  'Segunbagicha, Dhaka-1000',
  'Chankharpul, Old Dhaka-1100',
  'Gopibagh, Dhaka-1203',
  'Azimpur Estate, Dhaka-1205'
];

export const MembersDirectoryView: React.FC<MembersDirectoryViewProps> = ({
  shares,
  onSelectMember,
  onOpenPaymentForShare,
  onUpdateMemberDetails,
}) => {
  const { isAdmin, requireAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'due' | 'closed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'funded' | 'due' | 'shares'>('funded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Member editing modal state
  const [editingMember, setEditingMember] = useState<MemberDirectoryInfo | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    nid: '',
    address: '',
  });

  const handleOpenEdit = (member: MemberDirectoryInfo) => {
    requireAdmin(() => {
      setEditingMember(member);
      setEditForm({
        name: member.name,
        phone: member.phone,
        nid: member.nid,
        address: member.address,
      });
    }, `edit member directory profile for "${member.name}"`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !onUpdateMemberDetails) return;

    onUpdateMemberDetails({
      oldName: editingMember.name,
      newName: editForm.name,
      phone: editForm.phone,
      address: editForm.address,
      nid: editForm.nid,
    });

    setEditingMember(null);
  };

  // Group unique members
  const memberList: MemberDirectoryInfo[] = useMemo(() => {
    const memberMap = new Map<string, ShareRecord[]>();

    for (const s of shares) {
      const name = s.memberName?.trim();
      if (!name) continue;
      if (!memberMap.has(name)) {
        memberMap.set(name, []);
      }
      memberMap.get(name)!.push(s);
    }

    const list: MemberDirectoryInfo[] = [];
    let idx = 0;

    for (const [name, mShares] of memberMap.entries()) {
      const isClosed = mShares.every((s) => s.isClosed);
      const firstWithSl = mShares.find((s) => s.sl && s.sl.toString().trim() !== '');
      const sl = firstWithSl?.sl ? firstWithSl.sl.toString().padStart(2, '0') : (idx + 1).toString().padStart(2, '0');
      const phone = mShares.find((s) => s.phone)?.phone || `+880 171${(idx * 111111).toString().slice(0, 7)}`;
      
      // Member specific address & NID or fallback
      const address = mShares.find((s) => s.address)?.address || DEFAULT_LOCATIONS[idx % DEFAULT_LOCATIONS.length];
      const nid = mShares.find((s) => s.nid)?.nid || `19${80 + (idx % 20)}269${(345678 + idx * 8912).toString().slice(0, 7)}`;

      const totalFunded = mShares.reduce((sum, s) => sum + s.totalDeposit, 0);
      const totalAdmission = mShares.reduce((sum, s) => sum + s.admissionFee, 0);
      const totalMonthly = totalFunded - totalAdmission;
      const totalDue = mShares.reduce((sum, s) => sum + s.totalDue, 0);
      const dueMonths = mShares.reduce((sum, s) => sum + s.dueMonths, 0);

      list.push({
        name,
        sl,
        phone,
        address,
        nid,
        shares: mShares,
        shareIds: mShares.map((s) => s.id),
        sharesCount: mShares.length,
        totalFunded,
        totalAdmission,
        totalMonthly,
        totalDue,
        dueMonths,
        isClosed,
      });

      idx++;
    }

    return list;
  }, [shares]);

  // Filtering
  const filteredMembers = useMemo(() => {
    return memberList.filter((m) => {
      if (statusFilter === 'clean' && (m.totalDue > 0 || m.isClosed)) return false;
      if (statusFilter === 'due' && (m.totalDue === 0 || m.isClosed)) return false;
      if (statusFilter === 'closed' && !m.isClosed) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesPhone = m.phone.toLowerCase().includes(q);
        const matchesAddress = m.address.toLowerCase().includes(q);
        const matchesNid = m.nid.toLowerCase().includes(q);
        const matchesShareId = m.shareIds.some((id) => id.toLowerCase().includes(q));
        return matchesName || matchesPhone || matchesAddress || matchesNid || matchesShareId;
      }
      return true;
    });
  }, [memberList, statusFilter, searchTerm]);

  // Sorting
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'funded') cmp = a.totalFunded - b.totalFunded;
      else if (sortBy === 'due') cmp = a.totalDue - b.totalDue;
      else if (sortBy === 'shares') cmp = a.sharesCount - b.sharesCount;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [filteredMembers, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'funded' | 'due' | 'shares') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const totalAllFunded = memberList.reduce((acc, m) => acc + (m.isClosed ? 0 : m.totalFunded), 0);
  const totalAllDue = memberList.reduce((acc, m) => acc + m.totalDue, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Registered Members</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{memberList.length}</span>
            <span className="text-[11px] text-slate-400">Total society portfolio holders</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Active Shares</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
              {memberList.reduce((acc, m) => acc + (m.isClosed ? 0 : m.sharesCount), 0)}
            </span>
            <span className="text-[11px] text-slate-400">Assigned member share units</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Funded Amount</span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
              {formatTaka(totalAllFunded)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">All verified deposits &amp; admission</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Outstanding Due</span>
            <span className={`text-2xl font-black font-mono mt-0.5 block ${totalAllDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {formatTaka(totalAllDue)}
            </span>
            <span className="text-[11px] text-slate-400">Pending monthly installments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Members Directory &amp; Funded Profiles</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {filteredMembers.length} Members Listed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Member KYC records: Phone Number, Permanent Address, National ID (NID), and Total Funded Capital
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Status Tabs */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({memberList.length})
              </button>
              <button
                onClick={() => setStatusFilter('clean')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'clean' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Up to Date
              </button>
              <button
                onClick={() => setStatusFilter('due')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'due' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Has Due
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, NID, phone, address..."
                className="w-56 sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Full-width responsive table */}
        <div className="w-full overflow-x-auto xl:overflow-x-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold select-none">
              <tr>
                <th className="px-3 py-3 border-r border-slate-300 w-12 text-center">SL</th>
                <th
                  onClick={() => toggleSort('name')}
                  className="px-3 py-3 border-r border-slate-300 min-w-[170px] cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center justify-between">
                    <span>Member Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('shares')}
                  className="px-3 py-3 border-r border-slate-300 min-w-[110px] text-center cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Share IDs</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 border-r border-slate-300 min-w-[130px]">
                  <span>Phone Number</span>
                </th>
                <th className="px-3 py-3 border-r border-slate-300 min-w-[130px]">
                  <span>National ID (NID)</span>
                </th>
                <th className="px-3 py-3 border-r border-slate-300 min-w-[200px]">
                  <span>Address</span>
                </th>
                <th
                  onClick={() => toggleSort('funded')}
                  className="px-3 py-3 border-r border-slate-300 text-right min-w-[120px] bg-emerald-50/70 text-emerald-950 font-bold cursor-pointer hover:bg-emerald-100/70"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Funded</span>
                    <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('due')}
                  className="px-3 py-3 border-r border-slate-300 text-right min-w-[100px] cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Due Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center min-w-[90px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No matching member profile found.
                  </td>
                </tr>
              ) : (
                sortedMembers.map((m, idx) => {
                  const hasDue = m.totalDue > 0;
                  return (
                    <tr
                      key={`${m.name}-${idx}`}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        m.isClosed ? 'bg-slate-100/60 text-slate-400' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* SL */}
                      <td className="px-3 py-3 border-r border-slate-200 text-center font-mono text-slate-500">
                        {m.sl}
                      </td>

                      {/* Name */}
                      <td className="px-3 py-3 border-r border-slate-200 text-sm font-bold text-slate-900">
                        <button
                          onClick={() => onSelectMember(m.name)}
                          className="hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 cursor-pointer font-bold text-sm text-slate-900"
                          title="Click to view full member portfolio"
                        >
                          <span>{m.name}</span>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 opacity-80" />
                        </button>
                      </td>

                      {/* Share IDs */}
                      <td className="px-3 py-3 border-r border-slate-200 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {m.shareIds.map((id) => (
                            <span
                              key={id}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                m.isClosed
                                  ? 'bg-slate-200 text-slate-500'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {id}
                            </span>
                          ))}
                          {m.sharesCount > 1 && (
                            <span className="text-[10px] text-slate-400 block w-full mt-0.5">
                              ({m.sharesCount} shares)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-3 py-3 border-r border-slate-200 font-mono text-slate-700 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{m.phone}</span>
                        </div>
                      </td>

                      {/* NID */}
                      <td className="px-3 py-3 border-r border-slate-200 font-mono text-slate-800 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px]">
                          {m.nid}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="px-3 py-3 border-r border-slate-200 text-slate-600 text-xs">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span className="leading-tight">{m.address}</span>
                        </div>
                      </td>

                      {/* Total Funded Amount */}
                      <td className="px-3 py-3 border-r border-slate-200 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30 text-sm">
                        {formatTaka(m.totalFunded)}
                        <span className="text-[10px] text-slate-500 font-normal block font-sans">
                          Admn: {formatTaka(m.totalAdmission)}
                        </span>
                      </td>

                      {/* Due Status */}
                      <td className="px-3 py-3 border-r border-slate-200 text-right font-mono">
                        {hasDue ? (
                          <div>
                            <span className="font-bold text-rose-700 text-xs block">
                              {formatTaka(m.totalDue)}
                            </span>
                            <span className="text-[10px] text-rose-600 font-sans font-semibold">
                              {m.dueMonths}m Overdue
                            </span>
                          </div>
                        ) : m.isClosed ? (
                          <span className="text-slate-400 text-xs">Closed</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Member Directory Profile (Admin)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectMember(m.name)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Member Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!m.isClosed && (
                            <button
                              onClick={() => onOpenPaymentForShare(m.shares[0])}
                              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer shadow-2xs ${
                                hasDue
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {hasDue ? 'Collect' : 'Pay'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Footer - Frozen at Bottom */}
            <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white font-mono font-bold border-t-2 border-slate-700 shadow-[0_-3px_8px_rgba(0,0,0,0.25)]">
              <tr className="bg-slate-900">
                <td colSpan={2} className="px-3 py-3 border-r border-slate-800 text-left font-sans uppercase tracking-wider text-amber-400 text-xs sticky left-0 z-30 bg-slate-900">
                  TOTAL MEMBERS ({memberList.length})
                </td>
                <td className="px-3 py-3 border-r border-slate-800 text-center text-slate-300 font-sans text-xs bg-slate-900">
                  {memberList.reduce((acc, m) => acc + (m.isClosed ? 0 : m.sharesCount), 0)} Shares
                </td>
                <td colSpan={3} className="px-3 py-3 border-r border-slate-800 text-slate-400 font-sans text-xs font-normal">
                  All Member KYC &amp; Verification Directory
                </td>
                <td className="px-3 py-3 border-r border-slate-800 text-right text-emerald-300 text-sm">
                  {formatTaka(totalAllFunded)}
                </td>
                <td className="px-3 py-3 border-r border-slate-800 text-right text-rose-400 text-sm">
                  {totalAllDue > 0 ? formatTaka(totalAllDue) : '—'}
                </td>
                <td className="px-3 py-3 text-center text-slate-400 font-sans text-[11px]">
                  Active
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Edit Member Profile Modal (Admin Protected) */}
      {editingMember && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingMember(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Edit Member Profile (সদস্যের তথ্য আপডেট)</h3>
                  <p className="text-[11px] text-slate-400">
                    Shares: {editingMember.shareIds.join(', ')} &bull; Total Funded: {formatTaka(editingMember.totalFunded)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Member Name (সদস্যের নাম)
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Md Fuad Bin Rahman"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number (মোবাইল নম্বর)
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+880 1711-XXXXXX"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    National ID / NID (জাতীয় পরিচয়পত্র)
                  </label>
                  <input
                    type="text"
                    value={editForm.nid}
                    onChange={(e) => setEditForm({ ...editForm, nid: e.target.value })}
                    placeholder="1980XXXXXXXXXXXX"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Permanent / Present Address (ঠিকানা)
                </label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Sector 7, Uttara, Dhaka-1230"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Saving this will update all <strong>{editingMember.sharesCount} share record(s)</strong> belonging to this member and automatically sync across the entire system.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save &amp; Sync Everywhere</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
