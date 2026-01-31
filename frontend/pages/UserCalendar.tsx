import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { User, LeaveRecord, DataSource, PublicHoliday } from '../types';

const UserCalendar: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Default Feb 2026
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      
      const u = await api.user.getById(userId);
      setUser(u || null);
      
      if (u) {
          // Add to history
          await api.history.add({ id: u.id, name: u.displayName, type: 'USER' });
          const userLeaves = await api.leaves.getByUser(u.id);
          setLeaves(userLeaves);
      }

      const h = await api.holidays.getYear(currentDate.getFullYear());
      setHolidays(h);
      setLoading(false);
    };
    fetchData();
  }, [userId, currentDate.getFullYear()]);

  // Calendar Grid Generation
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Start grid from Sunday
    const startDay = firstDayOfMonth.getDay(); 
    
    const days: { date: Date | null, iso: string, isToday: boolean }[] = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
        days.push({ date: null, iso: `prev-${i}`, isToday: false });
    }

    // Days of current month
    const today = new Date().toISOString().split('T')[0];
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const iso = d.toISOString().split('T')[0];
        days.push({ 
            date: d, 
            iso,
            isToday: iso === today
        });
    }

    return days;
  }, [currentDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const getDayStatus = (isoDate: string) => {
    if (!user) return null;

    // 1. Holiday (Filter by User Country)
    const holiday = holidays.find(h => h.date === isoDate && (h.country === 'ALL' || h.country === user.country));
    if (holiday) return { type: 'HOLIDAY', name: holiday.name };

    // 2. Leave
    const leave = leaves.find(l => isoDate >= l.startDate && isoDate <= l.endDate);
    if (leave) return { type: 'LEAVE', source: leave.source, note: leave.note };

    return null;
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
  if (!user) return <div className="p-10 text-center text-red-500">User not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
        <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
            <ArrowLeft size={16} /> Back
        </button>

        {/* Header Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-6">
            <img src={user.avatar} className="w-20 h-20 rounded-full bg-gray-200" alt="" />
            <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-slate-800">{user.displayName}</h1>
                <p className="text-slate-500">{user.email}</p>
                <div className="mt-2 flex gap-2 justify-center md:justify-start">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{user.employeeID}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{user.country}</span>
                </div>
            </div>
            <div className="md:ml-auto border-l border-gray-200 pl-6 hidden md:block">
                <div className="text-sm text-gray-500">Upcoming Leave</div>
                <div className="text-2xl font-bold text-brand-600">
                    {leaves.filter(l => new Date(l.startDate) > new Date()).length} <span className="text-sm font-normal text-gray-400">requests</span>
                </div>
            </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Leave Calendar</h2>
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

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>
            
            {/* Days */}
            <div className="grid grid-cols-7 auto-rows-[100px] divide-x divide-gray-100 border-b border-gray-200 last:border-0">
                {calendarGrid.map((day, i) => {
                    if (!day.date) return <div key={i} className="bg-gray-50/50" />;
                    
                    const status = getDayStatus(day.iso);
                    
                    return (
                        <div key={day.iso} className={`relative p-2 hover:bg-gray-50 transition-colors border-b border-gray-100 ${day.isToday ? 'bg-blue-50/30' : ''}`}>
                            <div className={`text-sm font-medium mb-1 ${day.isToday ? 'text-brand-600' : 'text-gray-700'}`}>
                                {day.date.getDate()}
                            </div>
                            
                            {status && (
                                <div className={`text-xs p-1.5 rounded border mb-1 truncate cursor-help
                                    ${status.type === 'HOLIDAY' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                                    ${status.type === 'LEAVE' && status.source === DataSource.HR ? 'bg-brand-50 text-brand-700 border-brand-100' : ''}
                                    ${status.type === 'LEAVE' && status.source === DataSource.MANUAL ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                    ${status.type === 'LEAVE' && status.source === DataSource.OUTLOOK ? 'bg-blue-50 text-blue-700 border-blue-100 dashed-border' : ''}
                                `}
                                title={status.note || status.name}>
                                    {status.type === 'HOLIDAY' ? status.name : status.note || 'On Leave'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-6 mt-6 justify-center">
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-brand-50 border border-brand-100 rounded"></div>
                <span className="text-sm text-gray-600">HR System</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border border-green-100 rounded"></div>
                <span className="text-sm text-gray-600">Manual Entry</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-100 rounded border-dashed"></div>
                <span className="text-sm text-gray-600">Outlook OOO</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border border-red-100 rounded"></div>
                <span className="text-sm text-gray-600">Public Holiday</span>
             </div>
        </div>
    </div>
  );
};

export default UserCalendar;
