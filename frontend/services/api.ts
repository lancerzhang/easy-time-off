import { LeaveRecord, Team, Pod, User, ViewHistoryItem, PublicHoliday } from '../types';
import { MOCK_USERS, MOCK_TEAMS, MOCK_PODS, MOCK_LEAVES, PUBLIC_HOLIDAYS_2026 } from '../constants';

const API_BASE = 'http://localhost:8080/api';
const USE_MOCK_FALLBACK = true;
const MOCK_HISTORY: Record<string, ViewHistoryItem[]> = {};
const MOCK_FAVORITES: Record<string, string[]> = {};

const getCurrentUserId = (): string | null => {
    try {
        const raw = sessionStorage.getItem('easy_timeoff_user');
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed?.id ?? null;
    } catch {
        return null;
    }
};

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
        const res = await request<Team[]>('/teams?type=VIRTUAL');
        if (res) return res;
        return mockDelay(MOCK_TEAMS);
    },
    getCreatedByUser: async (userId: string): Promise<Team[]> => {
        const res = await request<Team[]>(`/teams?createdBy=${encodeURIComponent(userId)}&type=VIRTUAL`);
        if (res) return res;
        return mockDelay(MOCK_TEAMS.filter(t => t.createdBy === userId));
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
    
    createVirtualTeam: async (name: string, memberIds: string[], createdBy?: string): Promise<Team> => {
        const res = await request<Team>('/teams', {
            method: 'POST',
            body: JSON.stringify({ name, type: 'VIRTUAL', memberIds, createdBy })
        });
        if (res) return res;
        
        const newTeam: Team = { id: `vt_${Date.now()}`, name, type: 'VIRTUAL', memberIds, createdBy };
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

  pod: {
    getAll: async (): Promise<Pod[]> => {
        const res = await request<Pod[]>('/pods');
        if (res) return res;
        return mockDelay(MOCK_PODS);
    },
    getById: async (id: string): Promise<Pod | undefined> => {
        const res = await request<Pod>(`/pods/${id}`);
        if (res) return res;
        return mockDelay(MOCK_PODS.find(p => p.id === id));
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
    getByPod: async (podId: string, pod?: Pod): Promise<{ user: User, leaves: LeaveRecord[] }[]> => {
      try {
        const podRes = pod ?? await request<Pod>(`/pods/${podId}`);

        if (podRes) {
            if (!podRes.memberIds || podRes.memberIds.length === 0) return [];
            const idsParam = podRes.memberIds.join(',');

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

        const mockPod = MOCK_PODS.find(p => p.id === podId);
        if (!mockPod) return [];

        const members = MOCK_USERS.filter(u => mockPod.memberIds.includes(u.id));
        const leaves = MOCK_LEAVES.filter(l => mockPod.memberIds.includes(l.userId));

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
    get: async (userId?: string): Promise<ViewHistoryItem[]> => {
        const uid = userId || getCurrentUserId();
        if (!uid) return [];
        const res = await request<ViewHistoryItem[]>(`/history?userId=${encodeURIComponent(uid)}`);
        if (res) return res;
        return mockDelay(MOCK_HISTORY[uid] || []);
    },
    add: async (item: Omit<ViewHistoryItem, 'timestamp'> & { userId?: string }) => {
        const uid = item.userId || getCurrentUserId();
        if (!uid) return;
        const res = await request<ViewHistoryItem>('/history', {
            method: 'POST',
            body: JSON.stringify({
                userId: uid,
                itemId: item.id,
                type: item.type,
                name: item.name
            })
        });
        if (res) return;
        let list = MOCK_HISTORY[uid] || [];
        list = list.filter(i => !(i.id === item.id && i.type === item.type));
        list.unshift({ id: item.id, name: item.name, type: item.type, timestamp: Date.now() });
        if (list.length > 10) list.pop();
        MOCK_HISTORY[uid] = list;
    },
    getFavorites: async (userId?: string): Promise<string[]> => {
        const uid = userId || getCurrentUserId();
        if (!uid) return [];
        const res = await request<string[]>(`/favorites?userId=${encodeURIComponent(uid)}`);
        if (res) return res;
        return mockDelay(MOCK_FAVORITES[uid] || []);
    },
    toggleFavorite: async (teamId: string, userId?: string) => {
        const uid = userId || getCurrentUserId();
        if (!uid) return [];
        const res = await request<string[]>('/favorites', {
            method: 'POST',
            body: JSON.stringify({ userId: uid, teamId })
        });
        if (res) return res;
        let list = MOCK_FAVORITES[uid] || [];
        if (list.includes(teamId)) {
            list = list.filter(i => i !== teamId);
        } else {
            list = [...list, teamId];
        }
        MOCK_FAVORITES[uid] = list;
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
