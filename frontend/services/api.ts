import { LeaveRecord, Team, Pod, User, ViewHistoryItem, PublicHoliday } from '../types';
import { MOCK_USERS, MOCK_TEAMS, MOCK_PODS, MOCK_LEAVES, PUBLIC_HOLIDAYS_2026 } from '../constants';

const API_BASE = 'http://localhost:8080/api';
const USE_MOCK_FALLBACK = true;
const SEARCH_LIMIT = 20;
const HISTORY_DEDUP_TTL_MS = 2000;
const MOCK_HISTORY: Record<string, ViewHistoryItem[]> = {};
const MOCK_FAVORITES: Record<string, string[]> = {};
const GET_DEDUP_TTL_MS = 1500;
const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const historyInFlight = new Map<string, Promise<void>>();
const historyRecent = new Map<string, number>();

type DateRange = { from?: string; to?: string };
type GroupLeavesResponse = { user: User; leaves: LeaveRecord[] };

const toQueryString = (params: URLSearchParams): string => {
    const qs = params.toString();
    return qs ? `?${qs}` : '';
};

const filterLeavesByRange = (leaves: LeaveRecord[], range?: DateRange): LeaveRecord[] => {
    if (!range?.from && !range?.to) return leaves;
    return leaves.filter(leave => {
        const startsBeforeEnd = !range?.to || leave.startDate <= range.to;
        const endsAfterStart = !range?.from || leave.endDate >= range.from;
        return startsBeforeEnd && endsAfterStart;
    });
};

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
    const url = `${API_BASE}${endpoint}`;
    const method = (options?.method || 'GET').toUpperCase();
    const cacheKey = `${method}:${url}`;
    const canDedup = method === 'GET' && !options?.body;

    if (canDedup) {
        const cached = responseCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value as T;
        }
        const inFlight = inFlightRequests.get(cacheKey);
        if (inFlight) {
            return inFlight as Promise<T>;
        }
    }

    try {
        const fetchPromise = fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        const responsePromise = (async () => {
            const response = await fetchPromise;

            if (!response.ok) {
                 throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return {} as T;
            }

            return await response.json();
        })();

        if (canDedup) {
            inFlightRequests.set(cacheKey, responsePromise);
        }

        const data = await responsePromise;
        if (canDedup && data !== null) {
            responseCache.set(cacheKey, { expiresAt: Date.now() + GET_DEDUP_TTL_MS, value: data });
        }
        return data;
    } catch (error) {
        if (USE_MOCK_FALLBACK) {
            console.warn(`Backend unreachable or failed (${endpoint}), falling back to mock data.`, error);
            return null; // Return null to signal fallback logic
        }
        throw error;
    } finally {
        if (canDedup) {
            inFlightRequests.delete(cacheKey);
        }
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
    getByIds: async (ids: string[]): Promise<User[]> => {
        if (!ids.length) return [];
        const idsParam = ids.join(',');
        const res = await request<User[]>(`/users?ids=${encodeURIComponent(idsParam)}`);
        if (res) return res;
        return mockDelay(MOCK_USERS.filter(u => ids.includes(u.id)));
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
    getByIds: async (ids: string[]): Promise<Team[]> => {
        if (!ids.length) return [];
        const idsParam = ids.join(',');
        const res = await request<Team[]>(`/teams?ids=${encodeURIComponent(idsParam)}`);
        if (res) return res;
        return mockDelay(MOCK_TEAMS.filter(t => ids.includes(t.id)));
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
    
    getByTeam: async (teamId: string, range?: DateRange): Promise<GroupLeavesResponse[]> => {
      try {
        const params = new URLSearchParams();
        if (range?.from) params.set('from', range.from);
        if (range?.to) params.set('to', range.to);
        const res = await request<GroupLeavesResponse[]>(`/teams/${teamId}/leaves${toQueryString(params)}`);
        if (res) return res;
        
        const mockTeam = MOCK_TEAMS.find(t => t.id === teamId);
        if (!mockTeam) return [];
        
        const members = MOCK_USERS.filter(u => mockTeam.memberIds.includes(u.id));
        const leaves = filterLeavesByRange(
            MOCK_LEAVES.filter(l => mockTeam.memberIds.includes(l.userId)),
            range
        );
        
        return mockDelay(members.map(user => ({
            user,
            leaves: leaves.filter(l => l.userId === user.id)
        })));
        
      } catch (e) {
        return [];
      }
    },
    getByPod: async (podId: string, pod?: Pod, range?: DateRange): Promise<GroupLeavesResponse[]> => {
      try {
        const params = new URLSearchParams();
        if (range?.from) params.set('from', range.from);
        if (range?.to) params.set('to', range.to);
        const res = await request<GroupLeavesResponse[]>(`/pods/${podId}/leaves${toQueryString(params)}`);
        if (res) return res;

        const mockPod = pod ?? MOCK_PODS.find(p => p.id === podId);
        if (!mockPod) return [];

        const members = MOCK_USERS.filter(u => mockPod.memberIds.includes(u.id));
        const leaves = filterLeavesByRange(
            MOCK_LEAVES.filter(l => mockPod.memberIds.includes(l.userId)),
            range
        );

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
    get: async (userId?: string, limit?: number, offset?: number): Promise<ViewHistoryItem[]> => {
        const uid = userId || getCurrentUserId();
        if (!uid) return [];
        const params = new URLSearchParams({ userId: uid });
        if (limit !== undefined) params.set('limit', String(limit));
        if (offset !== undefined) params.set('offset', String(offset));
        const res = await request<ViewHistoryItem[]>(`/history?${params.toString()}`);
        if (res) return res;
        return mockDelay(MOCK_HISTORY[uid] || []);
    },
    add: async (item: Omit<ViewHistoryItem, 'timestamp'> & { userId?: string }) => {
        const uid = item.userId || getCurrentUserId();
        if (!uid) return;
        const key = `${uid}:${item.type}:${item.id}`;
        const lastSentAt = historyRecent.get(key);
        if (lastSentAt && Date.now() - lastSentAt < HISTORY_DEDUP_TTL_MS) return;

        const inFlight = historyInFlight.get(key);
        if (inFlight) return inFlight;

        historyRecent.set(key, Date.now());
        const sendPromise = (async () => {
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
        })();

        historyInFlight.set(key, sendPromise);
        try {
            await sendPromise;
        } finally {
            historyInFlight.delete(key);
        }
    },
    getFavorites: async (userId?: string, limit?: number, offset?: number): Promise<string[]> => {
        const uid = userId || getCurrentUserId();
        if (!uid) return [];
        const params = new URLSearchParams({ userId: uid });
        if (limit !== undefined) params.set('limit', String(limit));
        if (offset !== undefined) params.set('offset', String(offset));
        const res = await request<string[]>(`/favorites?${params.toString()}`);
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
       const res = await request<User[]>(`/users?query=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`);
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
       const res = await request<Team[]>(`/teams?query=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`);
       if (res) return res;
       
       if (!query) return mockDelay(MOCK_TEAMS);
       const lower = query.toLowerCase();
       return mockDelay(MOCK_TEAMS.filter(t => t.name.toLowerCase().includes(lower)));
    }
  }
};
