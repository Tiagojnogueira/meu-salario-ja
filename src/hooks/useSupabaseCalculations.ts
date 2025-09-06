import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WorkingHours, OvertimePercentages, DayEntry } from '@/types/overtime';

export interface Calculation {
  id: string;
  user_id: string;
  description: string;
  start_date: string;
  end_date: string;
  working_hours: WorkingHours;
  overtime_percentages: OvertimePercentages;
  day_entries: DayEntry[];
  created_at: string;
  updated_at: string;
  // Campos de horário noturno
  night_shift_start?: string;
  night_shift_end?: string;
  extend_night_hours?: boolean;
  apply_night_reduction?: boolean;
  // Campos de configuração detalhada
  auto_fill_enabled?: boolean;
  detailed_working_hours?: any;
}

export const useSupabaseCalculations = (userId?: string) => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCalculations = async () => {
    if (!userId) {
      console.log('useSupabaseCalculations - No userId provided, skipping fetch');
      return;
    }
    
    setLoading(true);
    console.log('useSupabaseCalculations - Fetching calculations for userId:', userId);
    
    try {
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useSupabaseCalculations - Error fetching calculations:', error);
        toast.error('Erro ao carregar cálculos');
        return;
      }

      console.log('useSupabaseCalculations - Fetched calculations:', data?.length || 0, 'records');

      // Transform the data to match our interface
      const transformedData: Calculation[] = (data || []).map(item => ({
        ...item,
        working_hours: item.working_hours as unknown as WorkingHours,
        overtime_percentages: item.overtime_percentages as unknown as OvertimePercentages,
        day_entries: (item.day_entries as unknown as DayEntry[]) || []
      }));

      setCalculations(transformedData);
    } catch (error) {
      console.error('Fetch calculations error:', error);
      toast.error('Erro ao carregar cálculos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCalculations();
    }
  }, [userId]);

  const createCalculation = async (
    calculationData: Omit<Calculation, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!userId) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const insertData = {
        user_id: userId,
        description: calculationData.description,
        start_date: calculationData.start_date,
        end_date: calculationData.end_date,
        working_hours: calculationData.working_hours as unknown as any,
        overtime_percentages: calculationData.overtime_percentages as unknown as any,
        day_entries: calculationData.day_entries as unknown as any,
        night_shift_start: calculationData.night_shift_start,
        night_shift_end: calculationData.night_shift_end,
        extend_night_hours: calculationData.extend_night_hours,
        apply_night_reduction: calculationData.apply_night_reduction,
        auto_fill_enabled: (calculationData as any).auto_fill_enabled,
        detailed_working_hours: (calculationData as any).detailed_working_hours
      };

      const { data, error } = await supabase
        .from('calculations')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating calculation:', error);
        toast.error('Erro ao criar cálculo');
        return null;
      }

      await fetchCalculations();
      return data.id;
    } catch (error) {
      console.error('Create calculation error:', error);
      toast.error('Erro ao criar cálculo');
      return null;
    }
  };

  const updateCalculation = async (
    id: string,
    calculationData: Partial<Omit<Calculation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      console.log('useSupabaseCalculations - updateCalculation called with:', {
        id,
        calculationData,
        userId
      });

      const updateData: any = {};
      
      if (calculationData.description !== undefined) {
        updateData.description = calculationData.description;
      }
      if (calculationData.start_date !== undefined) {
        updateData.start_date = calculationData.start_date;
      }
      if (calculationData.end_date !== undefined) {
        updateData.end_date = calculationData.end_date;
      }
      if (calculationData.working_hours !== undefined) {
        updateData.working_hours = calculationData.working_hours as unknown as any;
      }
      if (calculationData.overtime_percentages !== undefined) {
        updateData.overtime_percentages = calculationData.overtime_percentages as unknown as any;
      }
      if (calculationData.day_entries !== undefined) {
        updateData.day_entries = calculationData.day_entries as unknown as any;
      }
      if (calculationData.night_shift_start !== undefined) {
        updateData.night_shift_start = calculationData.night_shift_start;
      }
      if (calculationData.night_shift_end !== undefined) {
        updateData.night_shift_end = calculationData.night_shift_end;
      }
      if (calculationData.extend_night_hours !== undefined) {
        updateData.extend_night_hours = calculationData.extend_night_hours;
      }
      if (calculationData.apply_night_reduction !== undefined) {
        updateData.apply_night_reduction = calculationData.apply_night_reduction;
      }
      if ((calculationData as any).auto_fill_enabled !== undefined) {
        updateData.auto_fill_enabled = (calculationData as any).auto_fill_enabled;
      }
      if ((calculationData as any).detailed_working_hours !== undefined) {
        updateData.detailed_working_hours = (calculationData as any).detailed_working_hours;
      }

      console.log('useSupabaseCalculations - Final updateData:', updateData);

      const { data, error } = await supabase
        .from('calculations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select();

      console.log('useSupabaseCalculations - Supabase response:', { data, error });

      if (error) {
        console.error('Error updating calculation:', error);
        toast.error('Erro ao atualizar cálculo');
        return false;
      }

      await fetchCalculations();
      return true;
    } catch (error) {
      console.error('Update calculation error:', error);
      toast.error('Erro ao atualizar cálculo');
      return false;
    }
  };

  const deleteCalculation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calculations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting calculation:', error);
        toast.error('Erro ao excluir cálculo');
        return false;
      }

      await fetchCalculations();
      toast.success('Cálculo excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Delete calculation error:', error);
      toast.error('Erro ao excluir cálculo');
      return false;
    }
  };

  const getCalculation = (id: string): Calculation | undefined => {
    console.log('useSupabaseCalculations - getCalculation called with id:', id);
    console.log('useSupabaseCalculations - Available calculations:', calculations.length);
    console.log('useSupabaseCalculations - userId:', userId);
    
    const calculation = calculations.find(calc => calc.id === id);
    
    console.log('useSupabaseCalculations - Found calculation:', !!calculation, calculation?.id);
    
    if (!calculation) {
      console.log('useSupabaseCalculations - All calculation IDs:', calculations.map(c => c.id));
    }
    
    return calculation;
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
    from2To3Hours: 70,
    from3To4Hours: 70,
    from4To5Hours: 70,
    over5Hours: 70,
    restDay: 100
  });

  return {
    calculations,
    loading,
    createCalculation,
    updateCalculation,
    deleteCalculation,
    getCalculation,
    getDefaultWorkingHours,
    getDefaultOvertimePercentages,
    refetch: fetchCalculations
  };
};