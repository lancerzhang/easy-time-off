import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, Edit2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import { LeaveRecord, DataSource, User, LeaveStatus, PublicHoliday } from '../types';
import { parseISODate, toLocalISODate } from '../utils/date';

const MyLeaves: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Default Feb 2026

  useEffect(() => {
    loadLeaves();
  }, [currentUser]);

  useEffect(() => {
    api.holidays.getYear(currentDate.getFullYear()).then(setHolidays);
  }, [currentDate]);

  const loadLeaves = async () => {
    setLoading(true);
    const data = await api.leaves.getByUser(currentUser.id);
    // Sort desc date
    setLeaves(data.sort((a, b) => parseISODate(b.startDate).getTime() - parseISODate(a.startDate).getTime()));
    setLoading(false);
  };

  const openNewModal = () => {
      setEditId(null);
      setStartDate('');
      setEndDate('');
      setNote('');
      setShowModal(true);
  };

  const openEditModal = (leave: LeaveRecord) => {
      setEditId(leave.id);
      setStartDate(leave.startDate);
      setEndDate(leave.endDate);
      setNote(leave.note || '');
      setShowModal(true);
  };

  const checkOverlap = (start: string, end: string, ignoreId: string | null) => {
      return leaves.some(l => {
          if (ignoreId && l.id === ignoreId) return false;
          // Check if ranges overlap: (StartA <= EndB) and (EndA >= StartB)
          return (start <= l.endDate) && (end >= l.startDate);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
        showToast('Please select both start and end dates', 'error');
        return;
    }

    if (startDate > endDate) {
        showToast('Start date cannot be after end date', 'error');
        return;
    }

    if (checkOverlap(startDate, endDate, editId)) {
        showToast('You already have a leave request during these dates', 'error');
        return;
    }

    setSubmitting(true);
    try {
      if (editId) {
          // Update existing
          const original = leaves.find(l => l.id === editId);
          if (original) {
              await api.leaves.save({
                  ...original,
                  startDate,
                  endDate,
                  note,
                  status: LeaveStatus.PENDING // Re-approve if changed
              });
              showToast('Leave request updated successfully', 'success');
          }
      } else {
          // Create new
          await api.leaves.create({
            userId: currentUser.id,
            startDate,
            endDate,
            source: DataSource.MANUAL,
            status: LeaveStatus.PENDING,
            note
          });
          showToast('Leave request submitted successfully', 'success');
          navigate(`/leave-success?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`);
      }
      setShowModal(false);
      loadLeaves();
    } catch (error) {
      console.error(error);
      showToast('Failed to submit leave request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to cancel this leave?')) {
        try {
            await api.leaves.delete(id);
            showToast('Leave request cancelled', 'info');
            loadLeaves();
        } catch (e) {
            showToast('Failed to delete request', 'error');
        }
    }
  };

  const getSourceBadge = (source: DataSource) => {
    switch (source) {
        case DataSource.HR: return <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">HR System</span>;
        case DataSource.OUTLOOK: return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Outlook OOO</span>;
        case DataSource.MANUAL: return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Manual</span>;
    }
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDayOfMonth.getDay();

    const days: { date: Date | null; iso: string; isToday: boolean }[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, iso: `prev-${i}`, isToday: false });
    }

    const today = toLocalISODate(new Date());
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const iso = toLocalISODate(d);
      days.push({ date: d, iso, isToday: iso === today });
    }

    return days;
  }, [currentDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const getDayStatus = (isoDate: string) => {
    const holiday = holidays.find(h => h.date === isoDate && (h.country === 'ALL' || h.country === currentUser.country));
    if (holiday) return { type: 'HOLIDAY', name: holiday.name };

    const leave = leaves.find(l => isoDate >= l.startDate && isoDate <= l.endDate);
    if (leave) return { type: 'LEAVE', source: leave.source, note: leave.note };

    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Time-off</h1>
          <p className="text-slate-500">Manage your upcoming and past leaves</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={openNewModal}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus size={20} />
              New Request
            </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">My Calendar</h2>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-md">
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-[140px] text-center font-semibold text-slate-700">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-md">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[90px] divide-x divide-gray-100">
          {calendarGrid.map((day, i) => {
            if (!day.date) return <div key={i} className="bg-gray-50/50 border-b border-gray-100" />;
            const status = getDayStatus(day.iso);
            return (
              <div key={day.iso} className={`relative p-2 border-b border-gray-100 hover:bg-gray-50 transition-colors ${day.isToday ? 'bg-blue-50/30' : ''}`}>
                <div className={`text-sm font-medium mb-1 ${day.isToday ? 'text-brand-600' : 'text-gray-700'}`}>
                  {day.date.getDate()}
                </div>
                {status && (
                  <div
                    className={`text-xs p-1.5 rounded border mb-1 truncate cursor-help
                      ${status.type === 'HOLIDAY' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                      ${status.type === 'LEAVE' && status.source === DataSource.HR ? 'bg-brand-50 text-brand-700 border-brand-100' : ''}
                      ${status.type === 'LEAVE' && status.source === DataSource.MANUAL ? 'bg-green-50 text-green-700 border-green-100' : ''}
                      ${status.type === 'LEAVE' && status.source === DataSource.OUTLOOK ? 'bg-blue-50 text-blue-700 border-blue-100 dashed-border' : ''}
                    `}
                    title={status.type === 'HOLIDAY' ? status.name : status.note || 'On Leave'}
                  >
                    {status.type === 'HOLIDAY' ? status.name : status.note || 'On Leave'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
            <div className="p-8 space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
            </div>
        ) : leaves.length === 0 ? (
            <div className="p-12 text-center">
                <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No leaves found</h3>
                <p className="text-gray-500 mt-1">You haven't requested any time off yet.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Note</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {leaves.map(leave => {
                            const start = parseISODate(leave.startDate);
                            const end = parseISODate(leave.endDate);
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            const isEditable = leave.userId === currentUser.id && leave.source === DataSource.MANUAL;

                            return (
                                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">
                                            {start.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                            {' - '}
                                            {end.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{leave.status}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {diffDays} {diffDays > 1 ? 'days' : 'day'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getSourceBadge(leave.source)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                        {leave.note || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isEditable && (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditModal(leave)}
                                                    className="text-gray-400 hover:text-brand-600 transition-colors p-1"
                                                    title="Edit Request"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(leave.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    title="Delete Request"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-slate-800">{editId ? 'Edit Leave Request' : 'New Leave Request'}</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input 
                                type="date" 
                                required
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input 
                                type="date" 
                                required
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                        <textarea 
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Reason for leave..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                        />
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700">
                            {editId 
                                ? 'Updating this will reset status to PENDING for re-approval.' 
                                : 'Submitting this will block your calendar. No need to select a leave type.'}
                        </p>
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : (editId ? 'Update Request' : 'Submit Request')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
