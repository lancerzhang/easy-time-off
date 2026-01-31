import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Share2, Users, Check, Calendar as CalendarIcon, Filter, List, Grid3X3 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import { Team, User, LeaveRecord, DataSource, PublicHoliday } from '../types';

interface TeamData {
  user: User;
  leaves: LeaveRecord[];
}

const TeamCalendar: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { showToast } = useToast();
  const currentUser = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('easy_timeoff_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }, []);
  
  const [team, setTeam] = useState<Team | null>(null);
  const [data, setData] = useState<TeamData[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Default to Feb 2026 for demo
  const [favorites, setFavorites] = useState<string[]>([]);
  const [teamOptions, setTeamOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hover State
  const [hoveredDateIso, setHoveredDateIso] = useState<string | null>(null);

  // Filter State
  const [memberFilter, setMemberFilter] = useState('');

  // Mobile View Toggle
  const [isMobileList, setIsMobileList] = useState(true);

  // Generate date range for the grid (Current Month)
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return {
        date: d,
        iso: d.toISOString().split('T')[0],
        dayNum: i + 1,
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }), // M, T, W
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      };
    });
  }, [currentDate]);

  const hoveredDateLabel = useMemo(() => {
    if (!hoveredDateIso) return null;
    const match = daysInMonth.find(d => d.iso === hoveredDateIso);
    if (!match) return null;
    return match.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [hoveredDateIso, daysInMonth]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (teamId) {
        const t = await api.team.getById(teamId);
        if (t) {
            setTeam(t);
            const membersData = await api.leaves.getByTeam(t.id);
            setData(membersData);
            
            // Add to history
            await api.history.add({ id: t.id, name: t.name, type: 'TEAM', userId: currentUser?.id });
        }
      }
      const h = await api.holidays.getYear(currentDate.getFullYear());
      setHolidays(h);
      const favs = await api.history.getFavorites(currentUser?.id);
      setFavorites(favs);
      setLoading(false);
    };
    fetchData();
  }, [teamId, currentDate]);

  useEffect(() => {
    const loadTeamOptions = async () => {
      const teams = await api.team.getAll();
      const favIds = await api.history.getFavorites(currentUser?.id);
      let createdIds: string[] = [];
      try {
        const raw = localStorage.getItem('easy_timeoff_created_virtual_teams');
        const parsed = raw ? JSON.parse(raw) : [];
        createdIds = Array.isArray(parsed) ? parsed : [];
      } catch {
        createdIds = [];
      }

      const options: { id: string; label: string }[] = [];
      const added = new Set<string>();
      const addOption = (team: Team | undefined, label: string) => {
        if (!team || added.has(team.id)) return;
        options.push({ id: team.id, label });
        added.add(team.id);
      };

      if (currentUser?.teamId) {
        const myTeam = teams.find(t => t.id === currentUser.teamId);
        addOption(myTeam, `My Team · ${myTeam?.name || 'Team'}`);
      }

      if (teamId) {
        const activeTeam = teams.find(t => t.id === teamId);
        addOption(activeTeam, `Current · ${activeTeam?.name || 'Team'}`);
      }

      teams
        .filter(t => t.type === 'VIRTUAL' && createdIds.includes(t.id))
        .forEach(t => addOption(t, `Created · ${t.name}`));

      teams
        .filter(t => t.type === 'VIRTUAL' && favIds.includes(t.id))
        .forEach(t => addOption(t, `Favorite · ${t.name}`));

      setTeamOptions(options);
    };

    loadTeamOptions();
  }, [currentUser, teamId]);

  const toggleFavorite = async () => {
    if (!teamId) return;
    const newFavs = await api.history.toggleFavorite(teamId, currentUser?.id);
    setFavorites(newFavs);
    const isFav = newFavs.includes(teamId);
    showToast(isFav ? 'Added to favorites' : 'Removed from favorites', 'success');
  };

  const shareCalendar = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard', 'success');
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };
  
  const jumpToToday = () => {
      setCurrentDate(new Date(2026, 1, 15)); // Mocking "Today" as Feb 15, 2026 for context
  };

  // Filter Logic
  const filteredData = useMemo(() => {
      if (!memberFilter) return data;
      const lower = memberFilter.toLowerCase();
      return data.filter(d => d.user.displayName.toLowerCase().includes(lower) || d.user.email.toLowerCase().includes(lower));
  }, [data, memberFilter]);

  // --- Rendering Helpers ---

  const getDayStatus = (isoDate: string, user: User, userLeaves: LeaveRecord[]) => {
    // 1. Check Public Holiday for User's Country
    const holiday = holidays.find(h => h.date === isoDate && (h.country === 'ALL' || h.country === user.country));
    if (holiday) return { type: 'HOLIDAY', name: holiday.name };

    // 2. Check User Leaves
    const leave = userLeaves.find(l => isoDate >= l.startDate && isoDate <= l.endDate);
    if (leave) return { type: 'LEAVE', source: leave.source, note: leave.note };

    return null;
  };

  const renderCell = (isoDate: string, user: User, userLeaves: LeaveRecord[], isWeekend: boolean, isHoveredColumn: boolean) => {
    const status = getDayStatus(isoDate, user, userLeaves);
    
    // Base styles
    const cellBaseClass = `w-full h-full relative group cursor-pointer border-r border-gray-100 transition-colors duration-75 
        ${isHoveredColumn ? 'bg-brand-100' : ''}
    `;

    if (status?.type === 'HOLIDAY') {
        return (
            <div className={`${cellBaseClass} bg-red-50 flex items-center justify-center`}>
                <div className="w-2 h-2 rounded-full bg-red-300"></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none">
                    {status.name}
                </div>
            </div>
        );
    }

    if (status?.type === 'LEAVE') {
        let bgClass = '';
        
        switch (status.source) {
            case DataSource.HR: 
                bgClass = 'bg-brand-500'; 
                break;
            case DataSource.OUTLOOK:
                bgClass = 'bg-[repeating-linear-gradient(45deg,#60a5fa,#60a5fa_5px,#3b82f6_5px,#3b82f6_10px)] opacity-60'; 
                break;
            case DataSource.MANUAL:
                bgClass = 'bg-green-500'; 
                break;
        }

        return (
            <div className={`${cellBaseClass} ${bgClass}`}>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none">
                    {status.source}: {status.note || 'On Leave'}
                </div>
            </div>
        );
    }

    if (isWeekend) {
        return <div className={`${cellBaseClass} bg-slate-50`}></div>;
    }

    return <div className={cellBaseClass}></div>;
  };

  if (loading) {
      return (
        <div className="h-full flex flex-col p-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      );
  }
  
  if (!team) return <div className="p-10 text-center text-red-500">Team not found</div>;

  return (
    <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 shrink-0">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${team.type === 'POD' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {team.name}
                        <button onClick={toggleFavorite} className="focus:outline-none transition-transform active:scale-95" title="Add to Favorites">
                            <Star 
                                className={`w-5 h-5 ${favorites.includes(team.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} 
                            />
                        </button>
                    </h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        {team.type === 'POD' ? 'Agile Pod' : 'Virtual Team'} • {filteredData.length} Members
                    </p>
                    {teamOptions.length > 0 && (
                        <div className="mt-2">
                            <select
                                aria-label="Switch team"
                                value={teamId || ''}
                                onChange={(e) => navigate(`/calendar/${e.target.value}`)}
                                className="text-xs font-medium text-slate-600 bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                            >
                                {teamOptions.map(option => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <div className="relative flex-1 sm:flex-none">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Filter members..." 
                        value={memberFilter}
                        onChange={e => setMemberFilter(e.target.value)}
                        className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-40"
                    />
                </div>

                 {/* Mobile View Toggle */}
                 <button 
                    onClick={() => setIsMobileList(!isMobileList)}
                    className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm"
                >
                    {isMobileList ? <Grid3X3 size={16} /> : <List size={16} />}
                </button>

                <button 
                    onClick={jumpToToday}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm"
                    title="Jump to Today"
                >
                    <CalendarIcon size={16} />
                    Today
                </button>

                <button 
                    onClick={shareCalendar}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm"
                    title="Copy Link to Clipboard"
                >
                    <Share2 size={16} />
                    Share
                </button>

                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm ml-auto sm:ml-0">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-md">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="min-w-[120px] text-center font-semibold text-slate-700 text-sm">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-md">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-4 px-1 shrink-0">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-500 rounded-sm"></div> HR System</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Manual Entry</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-400 opacity-60 rounded-sm"></div> Outlook OOO</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-300 rounded-full"></div> Public Holiday</div>
        </div>

        {/* Calendar Grid Container (Desktop & Tablet) */}
        <div className={`flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-col relative min-h-0 ${isMobileList ? 'hidden md:flex' : 'flex'}`}>
            {hoveredDateLabel && (
                <div className="absolute top-2 right-3 z-20 text-xs font-semibold text-slate-600 bg-white/90 border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                    {hoveredDateLabel}
                </div>
            )}
            <div className="overflow-auto custom-scrollbar flex-1">
                <div className="inline-block min-w-full">
                    {/* Header Row */}
                    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 flex shadow-sm">
                        <div className="sticky left-0 z-20 w-48 bg-gray-50 border-r border-gray-200 p-3 font-semibold text-xs text-gray-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            Employee
                        </div>
                        {daysInMonth.map(day => (
                            <div 
                                key={day.iso} 
                                className={`flex-1 min-w-[36px] p-2 text-center border-r border-gray-100 cursor-default transition-colors duration-75 relative
                                    ${day.isWeekend ? 'bg-slate-50' : ''}
                                    ${hoveredDateIso === day.iso ? 'bg-brand-100' : ''}
                                `}
                                onMouseEnter={() => setHoveredDateIso(day.iso)}
                                onMouseLeave={() => setHoveredDateIso(null)}
                                title={day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            >
                                <div className="text-[10px] text-gray-400 font-medium">{day.dayName}</div>
                                <div className={`text-sm font-bold ${day.isWeekend ? 'text-gray-400' : 'text-slate-700'}`}>
                                    {day.dayNum}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Data Rows */}
                    <div className="divide-y divide-gray-100">
                        {filteredData.map(member => (
                            <div key={member.user.id} className="flex hover:bg-brand-100/40 transition-colors group/row">
                                {/* Name Col */}
                                <div className="sticky left-0 z-10 w-48 bg-white group-hover/row:bg-brand-100 border-r border-gray-200 p-3 flex items-center gap-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                                    <img src={member.user.avatar} className="w-8 h-8 rounded-full bg-gray-200" alt="" />
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">{member.user.displayName}</div>
                                        <div className="text-[10px] text-gray-400 truncate">{member.user.country} • {member.user.employeeID}</div>
                                    </div>
                                </div>

                                {/* Date Cols */}
                                {daysInMonth.map(day => (
                                    <div 
                                        key={day.iso} 
                                        className="flex-1 min-w-[36px] h-14"
                                        onMouseEnter={() => setHoveredDateIso(day.iso)}
                                        onMouseLeave={() => setHoveredDateIso(null)}
                                        title={day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    >
                                        {renderCell(day.iso, member.user, member.leaves, day.isWeekend, hoveredDateIso === day.iso)}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {filteredData.length === 0 && (
                            <div className="p-8 text-center text-gray-400 italic">
                                No members match your filter.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Mobile List View */}
        {isMobileList && (
            <div className="md:hidden flex-1 overflow-auto bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Team Status (This Month)</h3>
                {filteredData.map(member => {
                    // Find leaves in this month
                    const currentMonthLeaves = member.leaves.filter(l => {
                        const start = new Date(l.startDate);
                        const end = new Date(l.endDate);
                        // Check intersection with current month
                        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                        return start <= monthEnd && end >= monthStart;
                    });

                    if (currentMonthLeaves.length === 0) return null;

                    return (
                        <div key={member.user.id} className="border-b border-gray-100 pb-4 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                                <img src={member.user.avatar} className="w-8 h-8 rounded-full" alt="" />
                                <span className="font-semibold text-slate-800">{member.user.displayName}</span>
                            </div>
                            <div className="space-y-2 pl-11">
                                {currentMonthLeaves.map(l => (
                                    <div key={l.id} className="text-sm bg-gray-50 p-2 rounded-md border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-slate-700">
                                                {new Date(l.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(l.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                            </div>
                                            <div className="text-xs text-gray-500">{l.note || 'On Leave'}</div>
                                        </div>
                                        <div className="text-xs font-semibold px-2 py-1 rounded bg-white border border-gray-200 text-gray-600">
                                            {l.source}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {filteredData.every(m => m.leaves.filter(l => new Date(l.endDate) >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)).length === 0) && (
                    <div className="text-center py-8 text-gray-400">
                        No leaves found for this month.
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default TeamCalendar;
