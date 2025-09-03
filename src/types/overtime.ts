export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
}

export interface WorkingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  rest: string;
}

export interface OvertimePercentages {
  upTo2Hours: number;
  from2To3Hours: number;
  from3To4Hours: number;
  from4To5Hours: number;
  over5Hours: number;
  restDay: number;
}

export interface DayEntry {
  date: string;
  entry: string;
  intervalStart: string;
  intervalEnd: string;
  exit: string;
  type: 'workday' | 'rest' | 'absence' | 'justified-absence';
}

export interface Calculation {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  workingHours: WorkingHours;
  overtimePercentages: OvertimePercentages;
  dayEntries: DayEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CalculationResult {
  date: string;
  type: string;
  regularHours: number;
  overtimeHours: number;
  overtimePercentage: number;
  totalValue: number;
}

export type AuthStep = 'login' | 'register' | 'forgot-password';
export type CalculationStep = 'dashboard' | 'create' | 'time-entry' | 'results' | 'edit';