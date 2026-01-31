import { LeaveRecord, Team, User, ViewHistoryItem, PublicHoliday } from '../types';
import { MOCK_USERS, MOCK_TEAMS, MOCK_LEAVES, PUBLIC_HOLIDAYS_2026 } from '../constants';

const API_BASE = 'http://localhost:8080/api';
const USE_MOCK_FALLBACK = true;

// Helper to simulate network delay for mocks
const mockDelay = <T>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), 500));
};

// Generic Request Helper with Fallback Capability
const request = async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
             throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return {} as T;
        }

        return await response.json();
    } catch (error) {
        if (USE_MOCK_FALLBACK) {
            console.warn(`Backend unreachable or failed (${endpoint}), falling back to mock data.`, error);
            return null; // Return null to signal fallback logic
        }
        throw error;
    }
};

export const api = {
  auth: {
    login: async (): Promise<User> => {
        const res = await request<User>('/users/login', { method: 'POST' });
        if (res) return res;
        return mockDelay(MOCK_USERS[0]);
    }
  },

  user: {
    getAll: async (): Promise<User[]> => {
        const res = await request<User[]>('/users');
        if (res) return res;
        return mockDelay(MOCK_USERS);
    },
    getById: async (id: string): Promise<User | undefined> => {
        const res = await request<User>(`/users/${id}`);
        if (res) return res;
        return mockDelay(MOCK_USERS.find(u => u.id === id));
    },
  },

  team: {
    getAll: async (): Promise<Team[]> => {
        const res = await request<Team[]>('/teams');
        if (res) return res;
        return mockDelay(MOCK_TEAMS);
    },
    getById: async (id: string): Promise<Team | undefined> => {
        const res = await request<Team>(`/teams/${id}`);
        if (res) return res;
        return mockDelay(MOCK_TEAMS.find(t => t.id === id));
    },
    
    saveVirtualTeam: async (team: Team): Promise<Team> => {
        const res = await request<Team>('/teams', {
            method: 'POST',
            body: JSON.stringify(team)
        });
        if (res) return res;
        // Mock Update
        const idx = MOCK_TEAMS.findIndex(t => t.id === team.id);
        if (idx >= 0) MOCK_TEAMS[idx] = team;
        else MOCK_TEAMS.push({...team, id: `vt_${Date.now()}`});
        return mockDelay(team);
    },
    
    createVirtualTeam: async (name: string, memberIds: string[]): Promise<Team> => {
        const res = await request<Team>('/teams', {
            method: 'POST',
            body: JSON.stringify({ name, type: 'VIRTUAL', memberIds })
        });
        if (res) return res;
        
        const newTeam: Team = { id: `vt_${Date.now()}`, name, type: 'VIRTUAL', memberIds };
        MOCK_TEAMS.push(newTeam);
        return mockDelay(newTeam);
    },
    
    deleteVirtualTeam: async (id: string): Promise<void> => {
        const res = await request<void>(`/teams/${id}`, { method: 'DELETE' });
        if (res !== null) return;
        
        const idx = MOCK_TEAMS.findIndex(t => t.id === id);
        if (idx >= 0) MOCK_TEAMS.splice(idx, 1);
        return mockDelay(undefined);
    }
  },

  leaves: {
    getAll: async (): Promise<LeaveRecord[]> => {
        const res = await request<LeaveRecord[]>('/leaves');
        if (res) return res;
        return mockDelay(MOCK_LEAVES);
    },
    
    getByUser: async (userId: string): Promise<LeaveRecord[]> => {
        const res = await request<LeaveRecord[]>(`/leaves/user/${userId}`);
        if (res) return res;
        return mockDelay(MOCK_LEAVES.filter(l => l.userId === userId));
    },
    
    getByTeam: async (teamId: string): Promise<{ user: User, leaves: LeaveRecord[] }[]> => {
      try {
        const teamRes = await request<Team>(`/teams/${teamId}`);
        
        if (teamRes) {
             if (!teamRes.memberIds || teamRes.memberIds.length === 0) return [];
             const idsParam = teamRes.memberIds.join(',');
             
             const [members, leaves] = await Promise.all([
                 request<User[]>(`/users?ids=${idsParam}`),
                 request<LeaveRecord[]>(`/leaves?userIds=${idsParam}`)
             ]);

             if (members && leaves) {
                 return members.map(user => ({
                    user,
                    leaves: leaves.filter(l => l.userId === user.id)
                 }));
             }
        }
        
        const mockTeam = MOCK_TEAMS.find(t => t.id === teamId);
        if (!mockTeam) return [];
        
        const members = MOCK_USERS.filter(u => mockTeam.memberIds.includes(u.id));
        const leaves = MOCK_LEAVES.filter(l => mockTeam.memberIds.includes(l.userId));
        
        return mockDelay(members.map(user => ({
            user,
            leaves: leaves.filter(l => l.userId === user.id)
        })));
        
      } catch (e) {
        return [];
      }
    },
    
    save: async (leave: LeaveRecord): Promise<LeaveRecord> => {
        const res = await request<LeaveRecord>(`/leaves/${leave.id}`, {
            method: 'PUT',
            body: JSON.stringify(leave)
        });
        if (res) return res;
        
        const idx = MOCK_LEAVES.findIndex(l => l.id === leave.id);
        if (idx >= 0) MOCK_LEAVES[idx] = leave;
        return mockDelay(leave);
    },

    create: async (data: Omit<LeaveRecord, 'id'>): Promise<LeaveRecord> => {
      const res = await request<LeaveRecord>('/leaves', {
          method: 'POST',
          body: JSON.stringify(data)
      });
      if (res) return res;
      
      const newLeave: LeaveRecord = { ...data, id: `l_${Date.now()}` };
      MOCK_LEAVES.push(newLeave);
      return mockDelay(newLeave);
    },
    
    delete: async (id: string): Promise<void> => {
        const res = await request<void>(`/leaves/${id}`, { method: 'DELETE' });
        if (res !== null) return;
        
        const idx = MOCK_LEAVES.findIndex(l => l.id === id);
        if (idx >= 0) MOCK_LEAVES.splice(idx, 1);
        return mockDelay(undefined);
    }
  },

  holidays: {
    getYear: async (year: number): Promise<PublicHoliday[]> => {
        const res = await request<PublicHoliday[]>(`/holidays?year=${year}`);
        if (res) return res;
        return mockDelay(PUBLIC_HOLIDAYS_2026);
    }
  },

  // Client-Side Only Logic
  history: {
    get: (): ViewHistoryItem[] => {
        return JSON.parse(localStorage.getItem('easy_timeoff_history') || '[]');
    },
    add: (item: Omit<ViewHistoryItem, 'timestamp'>) => {
        let list: ViewHistoryItem[] = JSON.parse(localStorage.getItem('easy_timeoff_history') || '[]');
        list = list.filter(i => i.id !== item.id);
        list.unshift({ ...item, timestamp: Date.now() });
        if (list.length > 10) list.pop();
        localStorage.setItem('easy_timeoff_history', JSON.stringify(list));
    },
    getFavorites: (): string[] => {
        return JSON.parse(localStorage.getItem('easy_timeoff_favorites') || '[]');
    },
    toggleFavorite: (id: string) => {
        let list: string[] = JSON.parse(localStorage.getItem('easy_timeoff_favorites') || '[]');
        if (list.includes(id)) {
            list = list.filter(i => i !== id);
        } else {
            list.push(id);
        }
        localStorage.setItem('easy_timeoff_favorites', JSON.stringify(list));
        return list;
    }
  },

  search: {
    users: async (query: string): Promise<User[]> => {
       const res = await request<User[]>(`/users?query=${encodeURIComponent(query)}`);
       if (res) return res;
       
       if (!query) return mockDelay(MOCK_USERS);
       const lower = query.toLowerCase();
       return mockDelay(MOCK_USERS.filter(u => 
           u.displayName.toLowerCase().includes(lower) || 
           u.email.toLowerCase().includes(lower) ||
           u.employeeID.toLowerCase().includes(lower)
       ));
    },
    teams: async (query: string): Promise<Team[]> => {
       const res = await request<Team[]>(`/teams?query=${encodeURIComponent(query)}`);
       if (res) return res;
       
       if (!query) return mockDelay(MOCK_TEAMS);
       const lower = query.toLowerCase();
       return mockDelay(MOCK_TEAMS.filter(t => t.name.toLowerCase().includes(lower)));
    }
  }
};