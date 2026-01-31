import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, User as UserIcon, Clock } from 'lucide-react';
import { api } from '../services/api';
import { ViewHistoryItem } from '../types';

const History: React.FC = () => {
  const [items, setItems] = useState<ViewHistoryItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.history.get();
      setItems(data);
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">History</h1>
        <p className="text-slate-500">Recently viewed people and teams</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          No recent views yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {items.map(item => {
            const isTeam = item.type === 'TEAM';
            const Icon = isTeam ? Users : UserIcon;
            const link = isTeam ? `/calendar/${item.id}` : `/user/${item.id}`;
            return (
              <Link
                key={item.id + item.timestamp}
                to={link}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${isTeam ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">{isTeam ? 'Team' : 'Person'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={14} />
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
