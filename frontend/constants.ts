import { User, Team, Pod, LeaveRecord, DataSource, LeaveStatus, PublicHoliday } from './types';

// --- Mock Users ---
export const MOCK_USERS: User[] = [
  { id: 'u1', employeeID: 'E001', displayName: 'Alice Chen', email: 'alice@company.com', country: 'CN', avatar: 'https://picsum.photos/seed/u1/200', teamId: 'pod1' },
  { id: 'u2', employeeID: 'E002', displayName: 'Bob Smith', email: 'bob@company.com', country: 'US', avatar: 'https://picsum.photos/seed/u2/200', teamId: 'pod1' },
  { id: 'u3', employeeID: 'E003', displayName: 'Charlie Kim', email: 'charlie@company.com', country: 'CN', avatar: 'https://picsum.photos/seed/u3/200', teamId: 'pod1' },
  { id: 'u4', employeeID: 'E004', displayName: 'Diana Prince', email: 'diana@company.com', country: 'US', avatar: 'https://picsum.photos/seed/u4/200', teamId: 'pod2' },
  { id: 'u5', employeeID: 'E005', displayName: 'Evan Wright', email: 'evan@company.com', country: 'CN', avatar: 'https://picsum.photos/seed/u5/200', teamId: 'pod2' },
];

export const CURRENT_USER_ID = 'u1'; // Auto-login as Alice

// --- Mock Teams ---
export const MOCK_TEAMS: Team[] = [
  { id: 'vt1', name: 'Backend Guild', type: 'VIRTUAL', memberIds: ['u2', 'u5'], createdBy: 'u1' },
];

// --- Mock Pods ---
export const MOCK_PODS: Pod[] = [
  { id: 'pod1', name: 'Checkout Pod', memberIds: ['u1', 'u2', 'u3'] },
  { id: 'pod2', name: 'Inventory Pod', memberIds: ['u4', 'u5'] },
];

// --- Mock Public Holidays (2026 Sample with Country) ---
export const PUBLIC_HOLIDAYS_2026: PublicHoliday[] = [
  { date: '2026-01-01', name: 'New Year\'s Day', country: 'ALL' },
  { date: '2026-02-17', name: 'Chinese New Year', country: 'CN' },
  { date: '2026-02-18', name: 'Chinese New Year', country: 'CN' },
  { date: '2026-02-19', name: 'Chinese New Year', country: 'CN' },
  { date: '2026-05-01', name: 'Labor Day', country: 'CN' },
  { date: '2026-07-04', name: 'Independence Day', country: 'US' },
  { date: '2026-10-01', name: 'National Day', country: 'CN' },
  { date: '2026-12-25', name: 'Christmas Day', country: 'ALL' },
];

// --- Mock Leave Records ---
export const MOCK_LEAVES: LeaveRecord[] = [
  // Alice (Current User)
  { id: 'l1', userId: 'u1', startDate: '2026-02-10', endDate: '2026-02-12', source: DataSource.MANUAL, status: LeaveStatus.APPROVED, note: 'Ski trip' },
  // Bob (Outlook sync)
  { id: 'l2', userId: 'u2', startDate: '2026-02-15', endDate: '2026-02-20', source: DataSource.OUTLOOK, status: LeaveStatus.APPROVED, note: 'OOO: Conference' },
  // Charlie (HR System)
  { id: 'l3', userId: 'u3', startDate: '2026-02-01', endDate: '2026-02-28', source: DataSource.HR, status: LeaveStatus.APPROVED, note: 'Sabbatical' },
];
