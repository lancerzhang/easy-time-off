import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { api } from '../services/api';
import { PublicHoliday } from '../types';

const Settings: React.FC = () => {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    // Fetch 2026 for this prototype
    const data = await api.holidays.getYear(2026);
    setHolidays(data);
    setLoading(false);
  };

  const getCountryBadge = (code: string) => {
      if (code === 'ALL') return <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-bold">Global</span>;
      if (code === 'CN') return <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-xs font-bold">China</span>;
      if (code === 'US') return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 text-xs font-bold">USA</span>;
      return <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{code}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
      <p className="text-slate-500 mb-8">System configurations and master data</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <div>
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <CalendarIcon size={20} className="text-brand-600" />
                    Public Holidays (2026)
                </h2>
                <p className="text-sm text-gray-500">View company-wide holidays configuration.</p>
             </div>
        </div>
        
        <div className="p-6">
             <div className="mb-4 bg-blue-50 p-4 rounded-lg flex gap-3 items-start border border-blue-100">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                    Public holidays are managed via a central JSON configuration file. To request changes or corrections, please contact the HR Systems team.
                </p>
             </div>

             <div className="space-y-4">
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                            <div className="col-span-3">Date</div>
                            <div className="col-span-2">Region</div>
                            <div className="col-span-7">Holiday Name</div>
                        </div>
                        {holidays.map((h, idx) => (
                            <div key={idx} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-gray-50">
                                <div className="col-span-3 font-medium text-slate-800">
                                    {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="col-span-2">
                                    {getCountryBadge(h.country)}
                                </div>
                                <div className="col-span-7 text-slate-600 flex items-center gap-2">
                                    {h.name}
                                </div>
                            </div>
                        ))}
                         {holidays.length === 0 && <div className="p-4 text-center text-gray-500">No holidays configured</div>}
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;