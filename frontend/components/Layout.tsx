import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Briefcase, 
  Clock,
  ChevronRight,
  Settings,
  Search,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { User, ViewHistoryItem, Team } from '../types';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState<ViewHistoryItem[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{users: User[], teams: Team[]} | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Refresh history when menu opens or location changes
    setHistory(api.history.get());
    setIsMobileMenuOpen(false); // Close mobile menu on nav
  }, [location]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        const users = await api.search.users(searchQuery);
        const teams = await api.search.teams(searchQuery);
        setSearchResults({ users, teams });
        setShowSearchDropdown(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchResultClick = (path: string) => {
      navigate(path);
      setShowSearchDropdown(false);
      setSearchQuery('');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'My Time-off', path: '/my-leaves', icon: Clock },
    { label: 'My Calendar', path: user ? `/user/${user.id}` : '#', icon: UserIcon },
    { label: 'Team Calendar', path: '/calendar/pod1', icon: Calendar }, 
    { label: 'Directory', path: '/directory', icon: Briefcase },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 h-screen overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0 z-20 relative">
        <div className="font-bold text-xl text-brand-600">Easy Time-off</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30 transition-transform transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 flex flex-col h-full
      `}>
        <div className="p-6 hidden md:block shrink-0">
          <div className="font-bold text-2xl text-brand-600 flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            <span>Easy Time-off</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 font-medium' 
                    : 'text-slate-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}

          {/* Recent History Section */}
          {history.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                Recent Views
              </h3>
              <div className="space-y-1">
                {history.map((h) => (
                  <Link
                    key={h.id + h.timestamp}
                    to={h.type === 'TEAM' ? `/calendar/${h.id}` : `/user/${h.id}`}
                    className="flex items-center justify-between px-4 py-2 text-sm text-slate-500 hover:text-brand-600 hover:bg-gray-50 rounded-md group"
                  >
                    <span className="truncate max-w-[140px]">{h.name}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <img src={user?.avatar} alt="Profile" className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full overflow-hidden relative">
         {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-10 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Top Header with Search */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between shrink-0">
            {/* Search Bar */}
            <div className="relative w-full max-w-md" ref={searchRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search for people or teams..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if(searchQuery) setShowSearchDropdown(true); }}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-100 rounded-lg text-sm transition-all outline-none"
                    />
                </div>

                {/* Search Dropdown */}
                {showSearchDropdown && searchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                        {searchResults.users.length === 0 && searchResults.teams.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">No results found</div>
                        ) : (
                            <div className="max-h-[60vh] overflow-y-auto">
                                {searchResults.users.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">People</div>
                                        {searchResults.users.map(u => (
                                            <div 
                                                key={u.id}
                                                onClick={() => handleSearchResultClick(`/user/${u.id}`)}
                                                className="px-4 py-2 hover:bg-brand-50 cursor-pointer flex items-center gap-3"
                                            >
                                                <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                                                <div>
                                                    <div className="text-sm font-medium text-slate-800">{u.displayName}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.teams.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-t border-gray-100">Teams</div>
                                        {searchResults.teams.map(t => (
                                            <div 
                                                key={t.id}
                                                onClick={() => handleSearchResultClick(`/calendar/${t.id}`)}
                                                className="px-4 py-3 hover:bg-brand-50 cursor-pointer flex items-center gap-3"
                                            >
                                                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded">
                                                    <Users size={16} />
                                                </div>
                                                <div className="text-sm font-medium text-slate-800">{t.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="ml-4 flex items-center text-sm text-slate-500 hidden md:block">
                <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;