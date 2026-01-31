import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { User, Team } from '../types';

const Directory: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // For selection in modal

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  // Load all users for the modal once
  useEffect(() => {
    api.user.getAll().then(setAllUsers);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allTeams = await api.team.getCreatedByUser(currentUser.id);
    const lower = searchQuery.toLowerCase();
    const virtualTeams = allTeams.filter(t => t.type === 'VIRTUAL');
    const filteredTeams = searchQuery
      ? virtualTeams.filter(t => t.name.toLowerCase().includes(lower))
      : virtualTeams;
    setTeams(filteredTeams);
    setLoading(false);
  };

  const openNewModal = () => {
      setEditingTeamId(null);
      setTeamName('');
      setSelectedMembers([]);
      setIsModalOpen(true);
  };

  const openEditModal = (team: Team, e: React.MouseEvent) => {
      e.preventDefault();
      setEditingTeamId(team.id);
      setTeamName(team.name);
      setSelectedMembers(team.memberIds);
      setIsModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || selectedMembers.length === 0) return;

    if (editingTeamId) {
        // Update
        const team: Team = {
            id: editingTeamId,
            name: teamName,
            type: 'VIRTUAL',
            memberIds: selectedMembers,
            createdBy: currentUser.id
        };
        await api.team.saveVirtualTeam(team);
    } else {
        // Create
        await api.team.createVirtualTeam(teamName, selectedMembers, currentUser.id);
    }

    setIsModalOpen(false);
    setTeamName('');
    setSelectedMembers([]);
    loadData(); // Refresh list
  };

  const handleDeleteTeam = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (confirm('Are you sure you want to delete this virtual team?')) {
        await api.team.deleteVirtualTeam(id);
        loadData();
    }
  };

  const toggleMemberSelection = (userId: string) => {
    if (selectedMembers.includes(userId)) {
        setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
        setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Teams</h1>
          <p className="text-slate-500">Create and manage your virtual teams</p>
        </div>
        
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Create Virtual Team
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
            type="text" 
            placeholder="Search your virtual teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none shadow-sm"
        />
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                    <Link to={`/calendar/${team.id}`} key={team.id} className="block bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group relative">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-pink-100 text-pink-700">
                                <Users size={20} />
                            </div>
                            <div className="flex gap-1">
                                 <button 
                                    onClick={(e) => openEditModal(team, e)}
                                    className="p-1.5 text-gray-300 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                    title="Edit Team"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteTeam(team.id, e)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete Team"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1 group-hover:text-brand-600 transition-colors">{team.name}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                            Virtual Team
                        </p>
                        <div className="flex items-center -space-x-2">
                            {team.memberIds.slice(0, 4).map((uid, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] text-gray-600">
                                    {uid.substring(0,2)}
                                </div>
                            ))}
                            {team.memberIds.length > 4 && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                                    +{team.memberIds.length - 4}
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
                 {teams.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No virtual teams created yet.
                    </div>
                 )}
            </div>
        )}
      </div>

      {/* Create/Edit Team Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800">{editingTeamId ? 'Edit Virtual Team' : 'Create Virtual Team'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
                
                <form onSubmit={handleSaveTeam} className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g., Project Alpha Squad"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Members ({selectedMembers.length})</label>
                            <div className="border border-gray-200 rounded-lg max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                                {allUsers.map(u => {
                                    const isSelected = selectedMembers.includes(u.id);
                                    return (
                                        <div 
                                            key={u.id} 
                                            onClick={() => toggleMemberSelection(u.id)}
                                            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-brand-50' : ''}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800">{u.displayName}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!teamName.trim() || selectedMembers.length === 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingTeamId ? 'Save Changes' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Directory;
