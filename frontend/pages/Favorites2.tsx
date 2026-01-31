import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users } from 'lucide-react';
import { api } from '../services/api';
import { Team } from '../types';

const Favorites2: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);

  const loadFavorites = async () => {
    const favIds = await api.history.getFavorites();
    if (favIds.length === 0) {
      setTeams([]);
      return;
    }
    const allTeams = await api.team.getAll();
    setTeams(allTeams.filter(t => favIds.includes(t.id)));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (teamId: string) => {
    await api.history.toggleFavorite(teamId);
    loadFavorites();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Favorites 2</h1>
        <p className="text-slate-500">Your favorite teams</p>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          No favorites yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <Link to={`/calendar/${team.id}`} className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{team.name}</div>
                  <div className="text-xs text-gray-400">Virtual Team</div>
                </div>
              </Link>
              <button
                onClick={() => handleRemove(team.id)}
                className="p-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Remove from favorites"
              >
                <Star className="fill-current" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites2;
