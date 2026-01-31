import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { Team, User, ViewHistoryItem } from '../types';

interface SidebarDataContextType {
  history: ViewHistoryItem[];
  favoriteTeamIds: string[];
  favoriteTeams: Team[];
  teams: Team[];
  refresh: () => Promise<void>;
  toggleFavorite: (teamId: string) => Promise<string[]>;
}

const SidebarDataContext = createContext<SidebarDataContextType | undefined>(undefined);

export const SidebarDataProvider: React.FC<{ children: React.ReactNode; user: User | null }> = ({
  children,
  user
}) => {
  const [history, setHistory] = useState<ViewHistoryItem[]>([]);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setHistory([]);
      setFavoriteTeamIds([]);
      setTeams([]);
      return;
    }

    const [historyItems, favIds] = await Promise.all([
      api.history.get(user.id),
      api.history.getFavorites(user.id)
    ]);

    setHistory(historyItems);
    setFavoriteTeamIds(favIds);

    if (favIds.length === 0) {
      setTeams([]);
      return;
    }

    const allTeams = await api.team.getAll();
    setTeams(allTeams);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(async (teamId: string) => {
    if (!user?.id) return [];
    const favIds = await api.history.toggleFavorite(teamId, user.id);
    setFavoriteTeamIds(favIds);

    if (favIds.length === 0) {
      setTeams([]);
      return favIds;
    }

    if (teams.length === 0) {
      const allTeams = await api.team.getAll();
      setTeams(allTeams);
    }

    return favIds;
  }, [user?.id, teams.length]);

  const favoriteTeams = useMemo(() => {
    if (favoriteTeamIds.length === 0) return [];
    return teams.filter(team => favoriteTeamIds.includes(team.id));
  }, [teams, favoriteTeamIds]);

  return (
    <SidebarDataContext.Provider value={{ history, favoriteTeamIds, favoriteTeams, teams, refresh, toggleFavorite }}>
      {children}
    </SidebarDataContext.Provider>
  );
};

export const useSidebarData = () => {
  const context = useContext(SidebarDataContext);
  if (!context) {
    throw new Error('useSidebarData must be used within a SidebarDataProvider');
  }
  return context;
};
