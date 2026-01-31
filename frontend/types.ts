export enum DataSource {
  HR = 'HR',
  OUTLOOK = 'OUTLOOK',
  MANUAL = 'MANUAL'
}

export enum LeaveStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  employeeID: string;
  displayName: string;
  email: string;
  country: string; // e.g., 'CN', 'US'
  avatar: string;
  teamId: string; // Agile Pod ID
}

export interface Team {
  id: string;
  name: string;
  type: 'POD' | 'VIRTUAL';
  memberIds: string[];
}

export interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  source: DataSource;
  status: LeaveStatus;
  note?: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  country: string; // 'ALL', 'CN', 'US', etc.
  isWorkday?: boolean; // For make-up workdays (e.g., China adjustment)
}

export interface ViewHistoryItem {
  id: string;
  type: 'USER' | 'TEAM';
  name: string;
  timestamp: number;
}