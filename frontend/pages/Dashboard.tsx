import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Calendar, Users, Star, User as UserIcon, History } from 'lucide-react';
import { api } from '../services/api';
import { User, LeaveRecord, PublicHoliday, Team, Pod } from '../types';
import { toLocalISODate } from '../utils/date';
import { useSidebarData } from '../components/SidebarDataContext';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [absentToday, setAbsentToday] = useState<{ user: User; leave: LeaveRecord }[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<PublicHoliday[]>([]);
  const [teamOptions, setTeamOptions] = useState<{ id: string; label: string; type: 'POD' | 'TEAM' }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; type: 'POD' | 'TEAM' } | null>(
    user.teamId ? { id: user.teamId, type: 'POD' } : null
  );
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [pod, setPod] = useState<Pod | null>(null);
  const [createdTeams, setCreatedTeams] = useState<Team[]>([]);
  const { history: recentViews, favoriteTeams } = useSidebarData();
  const loading = loadingStatus || loadingHolidays;

  useEffect(() => {
    const loadStatus = async () => {
      if (!selectedGroup) {
        setAbsentToday([]);
        setLoadingStatus(false);
        return;
      }

      if (selectedGroup.type === 'POD') {
        if (!pod || pod.id !== selectedGroup.id) {
          // Wait for pod data before requesting members/leaves
          setAbsentToday([]);
          setLoadingStatus(true);
          return;
        }
        setLoadingStatus(true);
        const teamData = await api.leaves.getByPod(selectedGroup.id, pod);
        const today = toLocalISODate(new Date());
        const absent = teamData
          .filter(item => item.user.id !== user.id) // Exclude self
          .map(item => {
            const activeLeave = item.leaves.find(l => today >= l.startDate && today <= l.endDate);
            return activeLeave ? { user: item.user, leave: activeLeave } : null;
          })
          .filter(Boolean) as { user: User; leave: LeaveRecord }[];
        setAbsentToday(absent);
        setLoadingStatus(false);
        return;
      }

      setLoadingStatus(true);
      const teamData = await api.leaves.getByTeam(selectedGroup.id); // Returns {user, leaves}[]
      const today = toLocalISODate(new Date());
      const absent = teamData
        .filter(item => item.user.id !== user.id) // Exclude self
        .map(item => {
          const activeLeave = item.leaves.find(l => today >= l.startDate && today <= l.endDate);
          return activeLeave ? { user: item.user, leave: activeLeave } : null;
        })
        .filter(Boolean) as { user: User; leave: LeaveRecord }[];
      setAbsentToday(absent);
      setLoadingStatus(false);
    };
    loadStatus();
  }, [user, selectedGroup, pod]);

  useEffect(() => {
    const loadHolidays = async () => {
      setLoadingHolidays(true);
      const hols = await api.holidays.getYear(new Date().getFullYear());
      const todayIso = toLocalISODate(new Date());
      const futureHols = hols
        .filter(h => h.date >= todayIso)
        .filter(h => h.country === 'ALL' || h.country === user.country);
      setUpcomingHolidays(futureHols.slice(0, 3));
      setLoadingHolidays(false);
    };
    loadHolidays();
  }, [user]);

  useEffect(() => {
    const loadTeams = async () => {
      const [podRes, createdTeamsRes] = await Promise.all([
        user.teamId ? api.pod.getById(user.teamId) : Promise.resolve(null),
        api.team.getCreatedByUser(user.id)
      ]);
      setPod(podRes);
      setCreatedTeams(createdTeamsRes);
    };
    loadTeams();
  }, [user]);

  useEffect(() => {
    const options: { id: string; label: string; type: 'POD' | 'TEAM' }[] = [];
    const added = new Set<string>();

    const addOption = (id: string | undefined, label: string, type: 'POD' | 'TEAM') => {
      if (!id || added.has(id)) return;
      options.push({ id, label, type });
      added.add(id);
    };

    if (pod) {
      addOption(pod.id, `My Pod · ${pod.name}`, 'POD');
    }

    createdTeams
      .filter(t => t.type === 'VIRTUAL')
      .forEach(t => addOption(t.id, `Created · ${t.name}`, 'TEAM'));

    favoriteTeams.forEach(t => addOption(t.id, `Favorite · ${t.name}`, 'TEAM'));

    setTeamOptions(options);
    setSelectedGroup(prev => {
      if (prev && options.some(o => o.id === prev.id)) return prev;
      return options[0] ? { id: options[0].id, type: options[0].type } : null;
    });
  }, [pod, createdTeams, favoriteTeams]);

  const selectedTeamLabel = teamOptions.find(o => o.id === selectedGroup?.id)?.label || 'Select team';
  const selectedTeamName = selectedTeamLabel.includes('·')
    ? selectedTeamLabel.split('·').slice(-1)[0].trim()
    : selectedTeamLabel;

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
            <div className="md:col-span-2 space-y-6">
                {/* Who's Out Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Users size={20} />
                            </div>
                            <h3 className="font-bold text-slate-700">Who's Out Today</h3>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <select
                                value={selectedGroup?.id || ''}
                                onChange={(e) => {
                                    const next = teamOptions.find(o => o.id === e.target.value);
                                    if (next) setSelectedGroup({ id: next.id, type: next.type });
                                }}
                                className="text-xs font-medium text-slate-600 bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                            >
                                {teamOptions.length === 0 && <option value="">No teams</option>}
                                {teamOptions.map(option => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                ))}
                            </select>
                            {selectedGroup && (
                                <Link to={`/calendar/${selectedGroup.id}`} className="text-xs font-medium text-gray-400 hover:text-brand-600">
                                    View Calendar
                                </Link>
                            )}
                        </div>
                    </div>
                    
                    {!selectedGroup ? (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Users size={22} className="mb-2 opacity-50 text-gray-400" />
                            <span className="text-sm">Select a pod or team to see who's out.</span>
                        </div>
                    ) : absentToday.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Sun size={24} className="mb-2 opacity-50 text-orange-400" />
                            <span className="text-sm">Everyone in {selectedTeamName} is working today!</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Recent Views */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                    <History size={20} />
                                </div>
                                <h3 className="font-bold text-slate-700">Recent Views</h3>
                            </div>
                            <Link to="/history" className="text-xs font-medium text-gray-400 hover:text-brand-600">More</Link>
                        </div>
                        <div className="space-y-3">
                            {recentViews.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No recent views yet.</p>
                            ) : (
                                recentViews.slice(0, 4).map((item) => {
                                    const isTeam = item.type !== 'USER';
                                    const typeLabel = item.type === 'POD' ? 'Pod' : isTeam ? 'Team' : 'Person';
                                    const Icon = isTeam ? Users : UserIcon;
                                    return (
                                        <Link
                                            key={item.id + item.timestamp}
                                            to={isTeam ? `/calendar/${item.id}` : `/user/${item.id}`}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`p-1.5 rounded ${isTeam ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    <Icon size={14} />
                                                </span>
                                                <span className="text-sm text-slate-700 truncate">{item.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{typeLabel}</span>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Favorites */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                    <Star size={20} />
                                </div>
                                <h3 className="font-bold text-slate-700">Favorites</h3>
                            </div>
                            <Link to="/favorite" className="text-xs font-medium text-gray-400 hover:text-brand-600">More</Link>
                        </div>
                        <div className="space-y-3">
                            {favoriteTeams.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No favorites yet.</p>
                            ) : (
                                favoriteTeams.slice(0, 4).map(team => (
                                    <Link
                                        key={team.id}
                                        to={`/calendar/${team.id}`}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="p-1.5 rounded bg-indigo-50 text-indigo-600">
                                                <Users size={14} />
                                            </span>
                                            <span className="text-sm text-slate-700 truncate">{team.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">Team</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:col-span-1 space-y-6">
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

                {/* Plan Next Time Off */}
                <div className="bg-brand-600 rounded-2xl p-6 shadow-sm text-white flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-1">Plan your next time off?</h3>
                        <p className="text-brand-100 text-sm">Don't forget to sync with your team before booking.</p>
                    </div>
                    <Link 
                        to="/my-leaves" 
                        className="relative z-10 px-5 py-2.5 bg-white text-brand-600 font-bold rounded-xl shadow-lg hover:bg-brand-50 transition-colors w-fit"
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
