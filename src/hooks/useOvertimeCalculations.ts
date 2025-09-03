import { useState, useEffect } from 'react';
import { User, Calculation, WorkingHours, OvertimePercentages } from '@/types/overtime';

const STORAGE_KEYS = {
  USERS: 'overtime_users',
  CURRENT_USER: 'overtime_current_user',
  CALCULATIONS: 'overtime_calculations'
};

export const useOvertimeCalculations = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Load current user
      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      // Load calculations
      const savedCalculations = localStorage.getItem(STORAGE_KEYS.CALCULATIONS);
      if (savedCalculations) {
        setCalculations(JSON.parse(savedCalculations));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCalculations = (newCalculations: Calculation[]) => {
    localStorage.setItem(STORAGE_KEYS.CALCULATIONS, JSON.stringify(newCalculations));
    setCalculations(newCalculations);
  };

  const register = (userData: Omit<User, 'id'>): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      
      // Check if username or email already exists
      if (users.find((u: User) => u.username === userData.username || u.email === userData.email)) {
        return false;
      }

      const newUser: User = {
        ...userData,
        id: Date.now().toString()
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      return false;
    }
  };

  const login = (username: string, password: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const user = users.find((u: User) => 
        (u.username === username || u.email === username) && u.password === password
      );

      if (user) {
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const forgotPassword = (email: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const user = users.find((u: User) => u.email === email);
      
      if (user) {
        // In a real app, send email here
        console.log('Password reset email sent to:', email);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending reset email:', error);
      return false;
    }
  };

  const createCalculation = (calculationData: Omit<Calculation, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const newCalculation: Calculation = {
      ...calculationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedCalculations = [...calculations, newCalculation];
    saveCalculations(updatedCalculations);
    return newCalculation.id;
  };

  const updateCalculation = (id: string, calculationData: Partial<Calculation>): boolean => {
    try {
      const updatedCalculations = calculations.map(calc => 
        calc.id === id 
          ? { ...calc, ...calculationData, updatedAt: new Date().toISOString() }
          : calc
      );
      saveCalculations(updatedCalculations);
      return true;
    } catch (error) {
      console.error('Error updating calculation:', error);
      return false;
    }
  };

  const deleteCalculation = (id: string): boolean => {
    try {
      const updatedCalculations = calculations.filter(calc => calc.id !== id);
      saveCalculations(updatedCalculations);
      return true;
    } catch (error) {
      console.error('Error deleting calculation:', error);
      return false;
    }
  };

  const getCalculation = (id: string): Calculation | undefined => {
    return calculations.find(calc => calc.id === id);
  };

  const getDefaultWorkingHours = (): WorkingHours => ({
    monday: '08:00',
    tuesday: '08:00',
    wednesday: '08:00',
    thursday: '08:00',
    friday: '08:00',
    saturday: '04:00',
    sunday: '00:00',
    rest: '00:00'
  });

  const getDefaultOvertimePercentages = (): OvertimePercentages => ({
    upTo2Hours: 50,
    from2To3Hours: 50,
    from3To4Hours: 50,
    from4To5Hours: 50,
    over5Hours: 50,
    restDay: 100
  });

  return {
    currentUser,
    calculations,
    loading,
    register,
    login,
    logout,
    forgotPassword,
    createCalculation,
    updateCalculation,
    deleteCalculation,
    getCalculation,
    getDefaultWorkingHours,
    getDefaultOvertimePercentages
  };
};