import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Calendar, Users, ArrowRight, PieChart } from 'lucide-react';
import { api } from '../services/api';
import { User, LeaveRecord, PublicHoliday } from '../types';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [absentToday, setAbsentToday] = useState<{ user: User; leave: LeaveRecord }[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<PublicHoliday[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // 1. My Leaves for balance & upcoming
      const leaves = await api.leaves.getByUser(user.id);
      setMyLeaves(leaves);

      // 2. Team Status
      if (user.teamId) {
          const teamData = await api.leaves.getByTeam(user.teamId); // Returns {user, leaves}[]
          const today = new Date().toISOString().split('T')[0];
          
          const absent = teamData
            .filter(item => item.user.id !== user.id) // Exclude self
            .map(item => {
                const activeLeave = item.leaves.find(l => today >= l.startDate && today <= l.endDate);
                return activeLeave ? { user: item.user, leave: activeLeave } : null;
            })
            .filter(Boolean) as { user: User; leave: LeaveRecord }[];
            
          setAbsentToday(absent);
      }

      // 3. Holidays (Filter by Country)
      const hols = await api.holidays.getYear(new Date().getFullYear());
      const todayIso = new Date().toISOString().split('T')[0];
      const futureHols = hols
        .filter(h => h.date >= todayIso)
        .filter(h => h.country === 'ALL' || h.country === user.country);
        
      setUpcomingHolidays(futureHols.slice(0, 3));

      setLoading(false);
    };
    load();
  }, [user]);

  // Calc Balance (Mock logic: 20 days allowance)
  const totalAllowance = 20;
  const usedDays = myLeaves
    .filter(l => l.status === 'APPROVED')
    .reduce((acc, l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
        return acc + days;
    }, 0);
  const remaining = Math.max(0, totalAllowance - usedDays);
  const percentage = (remaining / totalAllowance) * 100;

  if (loading) return (
      <div className="max-w-6xl mx-auto p-4 space-y-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-48 bg-gray-100 rounded-2xl"></div>
              <div className="h-48 bg-gray-100 rounded-2xl md:col-span-2"></div>
          </div>
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Good Morning, {user.displayName.split(' ')[0]}! ☀️</h1>
            <p className="text-slate-500 mt-1">Here's what's happening today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                            <PieChart size={20} />
                        </div>
                        <h3 className="font-bold text-slate-700">Leave Balance</h3>
                    </div>
                    <div className="flex items-end gap-2 relative z-10">
                        <span className="text-4xl font-extrabold text-slate-900">{remaining}</span>
                        <span className="text-gray-500 mb-1">/ {totalAllowance} days</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-4 relative z-10">
                        <div className="bg-brand-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    </div>
                </div>
                <Link to="/my-leaves" className="mt-6 text-sm text-brand-600 font-medium hover:underline flex items-center gap-1 relative z-10">
                    Request Time Off <ArrowRight size={14} />
                </Link>
                {/* Decorative Circle */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-50 rounded-full"></div>
            </div>

            {/* Who's Out Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <h3 className="font-bold text-slate-700">Who's Out Today</h3>
                    </div>
                    {user.teamId && (
                        <Link to={`/calendar/${user.teamId}`} className="text-xs font-medium text-gray-400 hover:text-brand-600">View Team Calendar</Link>
                    )}
                </div>
                
                {absentToday.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Sun size={24} className="mb-2 opacity-50 text-orange-400" />
                        <span className="text-sm">Everyone in your team is working today!</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {absentToday.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <img src={item.user.avatar} className="w-10 h-10 rounded-full bg-gray-200" alt="" />
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{item.user.displayName}</p>
                                    <p className="text-xs text-orange-600 font-medium">{item.leave.source === 'OUTLOOK' ? 'OOO' : 'On Leave'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Holidays */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Calendar size={20} />
                    </div>
                    <h3 className="font-bold text-slate-700">Upcoming Holidays ({user.country})</h3>
                </div>
                <div className="space-y-4">
                    {upcomingHolidays.length === 0 ? (
                         <p className="text-sm text-gray-500 italic">No upcoming holidays this year.</p>
                    ) : (
                        upcomingHolidays.map((h, i) => {
                             const date = new Date(h.date);
                             const day = date.getDate();
                             const month = date.toLocaleDateString('en-US', { month: 'short' });
                             return (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center bg-red-50 rounded-lg text-red-600 border border-red-100">
                                        <span className="text-xs font-bold uppercase">{month}</span>
                                        <span className="text-lg font-bold leading-none">{day}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">{h.name}</p>
                                        <p className="text-xs text-gray-400">{date.toLocaleDateString(undefined, {weekday: 'long'})}</p>
                                    </div>
                                </div>
                             )
                        })
                    )}
                </div>
            </div>

            {/* Quick Actions / Pending */}
             <div className="bg-brand-600 rounded-2xl p-6 shadow-sm text-white md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-1">Plan your next time off?</h3>
                    <p className="text-brand-100 text-sm">Don't forget to sync with your team before booking.</p>
                </div>
                <Link 
                    to="/my-leaves" 
                    className="relative z-10 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl shadow-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
                >
                    Book Now
                </Link>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;