import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { DayEntry, WorkingHours, OvertimePercentages } from '@/types/overtime';
import { ArrowLeft, Printer, Calculator, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResultsPageProps {
  calculationId: string;
  onBack: () => void;
  onBackToDashboard: () => void;
  onEdit?: () => void;
}

interface DayResult {
  date: string;
  weekday: string;
  type: string;
  entry: string;
  intervalStart: string;
  intervalEnd: string;
  exit: string;
  workedHours: number;
  contractualHours: number;
  regularHours: number;
  overtimeHours: number;
  overtimeDayHours: number;  // Horas extras diurnas
  overtimeNightHours: number; // Horas extras noturnas
  nightHours: number;
  overtimePercentage: number;
}

export const ResultsPage = ({ calculationId, onBack, onBackToDashboard, onEdit }: ResultsPageProps) => {
  const { profile } = useSupabaseAuth();
  const { getCalculation } = useSupabaseCalculations(profile?.user_id);
  const calculation = getCalculation(calculationId);

  if (!calculation) {
    return <div>Cálculo não encontrado</div>;
  }

  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToHours = (minutes: number): number => {
    return minutes / 60;
  };

  const formatHoursToTime = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const calculateNightHours = (effectiveEntry: string, effectiveExit: string, entryType: DayEntry['type'], nightShiftStart: string, nightShiftEnd: string, extendNightHours: boolean = false, applyNightReduction: boolean = true): number => {
    if (entryType === 'absence' || entryType === 'justified-absence' || !effectiveEntry || !effectiveExit) {
      return 0;
    }

    const entryMinutes = timeToMinutes(effectiveEntry);
    const exitMinutes = timeToMinutes(effectiveExit);
    const nightStartMinutes = timeToMinutes(nightShiftStart);
    let nightEndMinutes = timeToMinutes(nightShiftEnd);

    console.log('Calculating night hours for:', {
      entry: effectiveEntry,
      exit: effectiveExit,
      nightStart: nightShiftStart,
      nightEnd: nightShiftEnd,
      extendNightHours,
      applyNightReduction,
      entryMinutes,
      exitMinutes,
      nightStartMinutes,
      nightEndMinutes
    });

    let nightMinutes = 0;
    let workStart = entryMinutes;
    let workEnd = exitMinutes;

    // Se o trabalho cruza meia-noite (ex: 22:00 às 06:00)
    if (workEnd < workStart) {
      workEnd += 24 * 60; // Adiciona 24 horas para trabalhar com minutos contínuos
    }

    // Calcular total de horas trabalhadas
    const totalWorkedMinutes = workEnd - workStart;

    // Aplicar Súmula 60 do TST: se extend_night_hours estiver marcado E
    // o trabalho começou dentro do período noturno
    const workStartsInNightPeriod = (nightEndMinutes < nightStartMinutes) 
      ? (workStart >= nightStartMinutes || workStart <= nightEndMinutes)
      : (workStart >= nightStartMinutes && workStart <= nightEndMinutes);

    if (extendNightHours && workStartsInNightPeriod) {
      // Com Súmula 60: TODAS as horas trabalhadas são noturnas quando o trabalho inicia no período noturno
      nightMinutes = totalWorkedMinutes;
      console.log('Aplicando Súmula 60 - todas as horas são noturnas:', nightMinutes / 60);
    } else {
      // Lógica original: considera apenas o período configurado
      if (nightEndMinutes < nightStartMinutes) {
        // Primeira parte: das 22:00 às 24:00
        const firstNightEnd = 24 * 60;
        if (workStart < firstNightEnd && workEnd > nightStartMinutes) {
          const overlapStart = Math.max(workStart, nightStartMinutes);
          const overlapEnd = Math.min(workEnd, firstNightEnd);
          nightMinutes += Math.max(0, overlapEnd - overlapStart);
        }
        
        // Segunda parte: das 00:00 às 05:00
        if (workEnd > 24 * 60) {
          const nextDayWorkEnd = workEnd - 24 * 60;
          const overlapStart = 0;
          const overlapEnd = Math.min(nextDayWorkEnd, nightEndMinutes);
          nightMinutes += Math.max(0, overlapEnd - overlapStart);
        } else if (workStart < nightEndMinutes) {
          const overlapStart = Math.max(workStart, 0);
          const overlapEnd = Math.min(workEnd, nightEndMinutes);
          nightMinutes += Math.max(0, overlapEnd - overlapStart);
        }
      } else {
        // Período noturno não cruza meia-noite
        const overlapStart = Math.max(workStart, nightStartMinutes);
        const overlapEnd = Math.min(workEnd, nightEndMinutes);
        nightMinutes = Math.max(0, overlapEnd - overlapStart);
      }
      console.log('Sem Súmula 60 - apenas período configurado:', nightMinutes / 60);
    }

    // Converter minutos para horas (sem redução ainda)
    let nightHours = nightMinutes / 60;

    // Aplicar fator de redução da hora noturna se habilitado
    if (applyNightReduction && nightHours > 0) {
      // Cada hora noturna no relógio equivale a 52,5 minutos
      // Fórmula: horas_relógio × 60 ÷ 52,5 = horas_noturnas_efetivas
      const effectiveNightHours = (nightHours * 60) / 52.5;
      console.log(`Aplicando fator de redução: ${nightHours}h relógio → ${effectiveNightHours.toFixed(2)}h noturnas`);
      nightHours = effectiveNightHours;
    } else if (!applyNightReduction && nightHours > 0) {
      console.log('Fator de redução desabilitado - mantendo horas do relógio:', nightHours);
    }

    console.log('Night hours calculated (final):', nightHours);
    
    return nightHours;
  };

  const getContractualHours = (date: string, workingHours: WorkingHours): number => {
    const dayOfWeek = parseISO(date + 'T00:00:00').getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[dayOfWeek];
    const hoursStr = workingHours[dayName] || '00:00';
    return timeToMinutes(hoursStr) / 60;
  };

  const calculateDayResult = (entry: DayEntry, workingHours: WorkingHours, overtimePercentages: OvertimePercentages): DayResult => {
    const entryMinutes = timeToMinutes(entry.entry);
    const intervalStartMinutes = timeToMinutes(entry.intervalStart);
    const intervalEndMinutes = timeToMinutes(entry.intervalEnd);
    const exitMinutes = timeToMinutes(entry.exit);

    let workedMinutes = 0;
    let overtimeHours = 0;
    let overtimeDayHours = 0;
    let overtimeNightHours = 0;
    let overtimePercentage = 0;

    if (entry.type === 'workday' || entry.type === 'rest') {
      // Calculate worked hours with new logic for different scenarios
      let effectiveExitMinutes = exitMinutes;
      
      // Cenário 1: Tem entrada e início de intervalo, mas não tem fim de intervalo e nem saída
      // Considera o início de intervalo como horário de saída
      if (entryMinutes && intervalStartMinutes && !intervalEndMinutes && !exitMinutes) {
        effectiveExitMinutes = intervalStartMinutes;
      }
      // Cenário 2: Tem entrada, início de intervalo, fim de intervalo mas não tem saída
      // Ignora fim de intervalo e calcula entre entrada e início de intervalo
      else if (entryMinutes && intervalStartMinutes && intervalEndMinutes && !exitMinutes) {
        effectiveExitMinutes = intervalStartMinutes;
      }

      if (entryMinutes && effectiveExitMinutes) {
        workedMinutes = effectiveExitMinutes - entryMinutes;
        if (workedMinutes < 0) {
          // Crosses midnight
          workedMinutes = (24 * 60 - entryMinutes) + effectiveExitMinutes;
        }

        // Subtract interval apenas se tiver fim de intervalo e saída preenchidos (cenário normal)
        if (intervalStartMinutes && intervalEndMinutes && exitMinutes) {
          const intervalMinutes = intervalEndMinutes - intervalStartMinutes;
          workedMinutes -= intervalMinutes;
        }
      }
    }

    // Horas trabalhadas no relógio (para "Total Trabalhado")
    const clockWorkedHours = minutesToHours(workedMinutes);
    const contractualHours = getContractualHours(entry.date, workingHours);
    
    // Calculate effective entry and exit times for night hours calculation
    let effectiveEntryTime = entry.entry;
    let effectiveExitTime = entry.exit;
    
    // Apply the same logic for effective exit time as used in worked hours calculation
    if (entryMinutes && intervalStartMinutes && !intervalEndMinutes && !exitMinutes) {
      // Cenário 1: Entrada + início intervalo, sem fim intervalo e sem saída
      effectiveExitTime = entry.intervalStart;
    } else if (entryMinutes && intervalStartMinutes && intervalEndMinutes && !exitMinutes) {
      // Cenário 2: Entrada + início intervalo + fim intervalo, sem saída
      effectiveExitTime = entry.intervalStart;
    }
    
    // Calculate night hours using effective times
    const nightShiftStart = (calculation as any).night_shift_start?.replace(':00', '') || '22:00';
    const nightShiftEnd = (calculation as any).night_shift_end?.replace(':00', '') || '05:00';
    const extendNightHours = (calculation as any).extend_night_hours ?? false;
    const applyNightReduction = (calculation as any).apply_night_reduction ?? true;
    const nightHours = calculateNightHours(effectiveEntryTime, effectiveExitTime, entry.type, nightShiftStart, nightShiftEnd, extendNightHours, applyNightReduction);
    
    // Calculate effective worked hours (considering night reduction factor)
    // For night hours calculation: if reduction is applied, night hours are already converted to effective hours
    // For total calculation: clock hours + (night effective hours - night clock hours)
    
    // Calculate night hours in clock time (before reduction) for comparison
    let nightClockHours = 0;
    if (nightHours > 0 && applyNightReduction) {
      // If reduction was applied, reverse it to get clock hours
      nightClockHours = (nightHours * 52.5) / 60;
    } else {
      nightClockHours = nightHours;
    }
    
    // Calculate effective worked hours
    const dayClockHours = Math.max(0, clockWorkedHours - nightClockHours);
    const effectiveWorkedHours = dayClockHours + nightHours;
    
    // Calculate regular and overtime hours considering effective hours
    let regularHours = Math.min(effectiveWorkedHours, contractualHours);
    
    if (entry.type === 'rest') {
      // All hours on rest day are overtime at rest day percentage
      // Para dias de descanso, use as horas efetivas para cálculo de extras
      const effectiveHours = Math.max(clockWorkedHours, nightHours);
      overtimeHours = effectiveHours;
      regularHours = 0;
      overtimePercentage = overtimePercentages.restDay;
      
      // All overtime hours on rest day are night hours if they worked at night
      if (nightHours > 0) {
        // Calculate night overtime hours (in clock hours first)
        const nightOvertimeClockHours = Math.min(nightHours, effectiveHours);
        
        // Apply night reduction factor to night overtime hours if enabled
        if (applyNightReduction && nightOvertimeClockHours > 0) {
          overtimeNightHours = (nightOvertimeClockHours * 60) / 52.5;
        } else {
          overtimeNightHours = nightOvertimeClockHours;
        }
        
        overtimeDayHours = Math.max(0, effectiveHours - nightOvertimeClockHours);
      } else {
        overtimeDayHours = effectiveHours;
      }
    } else if (entry.type === 'workday') {
      // For workdays - use effective worked hours for overtime calculation
      if (effectiveWorkedHours > contractualHours) {
        overtimeHours = effectiveWorkedHours - contractualHours;
        regularHours = contractualHours;

        // Calculate how much of the work period was during night hours (22:00-05:00)
        const workStart = timeToMinutes(effectiveEntryTime);
        const workEnd = timeToMinutes(effectiveExitTime);
        const nightStart = timeToMinutes(nightShiftStart); // 22:00 = 1320 minutes
        
        // Calculate total night minutes worked (only 22:00-24:00 for same day work)
        let nightWorkMinutes = 0;
        if (workEnd > nightStart) {
          // Work extends into night period (after 22:00)
          nightWorkMinutes = workEnd - Math.max(workStart, nightStart);
        }
        
        // Apply interval reduction to night minutes if applicable
        if (entry.intervalStart && entry.intervalEnd && entry.exit) {
          const intervalStart = timeToMinutes(entry.intervalStart);
          const intervalEnd = timeToMinutes(entry.intervalEnd);
          
          // Check if interval overlaps with night period (after 22:00)
          if (intervalEnd > nightStart && intervalStart < workEnd) {
            const nightIntervalStart = Math.max(intervalStart, nightStart);
            const nightIntervalEnd = Math.min(intervalEnd, workEnd);
            if (nightIntervalEnd > nightIntervalStart) {
              nightWorkMinutes = Math.max(0, nightWorkMinutes - (nightIntervalEnd - nightIntervalStart));
            }
          }
        }
        
        const nightWorkHours = nightWorkMinutes / 60;
        
        // For overtime distribution, we need to consider the proportion of night hours
        // If we have night hours and overtime, calculate how much overtime was at night
        if (nightHours > 0 && overtimeHours > 0) {
          // Calculate the effective overtime hours that occurred during night period
          // Use the ratio of night hours to total effective hours
          const nightRatio = nightHours / effectiveWorkedHours;
          const dayRatio = (effectiveWorkedHours - nightHours) / effectiveWorkedHours;
          
          // Distribute overtime proportionally
          overtimeNightHours = overtimeHours * nightRatio;
          overtimeDayHours = overtimeHours * dayRatio;
        } else if (nightHours > 0) {
          // No overtime, but we have night hours
          overtimeNightHours = 0;
          overtimeDayHours = 0;
        } else {
          // No night hours, all overtime is day overtime
          overtimeDayHours = overtimeHours;
          overtimeNightHours = 0;
        }

        // For display purposes, we'll show the average percentage
        if (overtimeHours <= 2) {
          overtimePercentage = overtimePercentages.upTo2Hours;
        } else if (overtimeHours <= 3) {
          overtimePercentage = overtimePercentages.from2To3Hours;
        } else if (overtimeHours <= 4) {
          overtimePercentage = overtimePercentages.from3To4Hours;
        } else if (overtimeHours <= 5) {
          overtimePercentage = overtimePercentages.from4To5Hours;
        } else {
          overtimePercentage = overtimePercentages.over5Hours;
        }
      }
    }

    console.log('Day result calculated:', {
      date: entry.date,
      clockWorkedHours,
      nightClockHours,
      nightHours,
      effectiveWorkedHours,
      contractualHours,
      overtimeHours,
      overtimeDayHours,
      overtimeNightHours
    });

    return {
      date: entry.date,
      weekday: format(parseISO(entry.date + 'T00:00:00'), 'EEEE', { locale: ptBR }),
      type: getTypeLabel(entry.type),
      entry: entry.entry || '-',
      intervalStart: entry.intervalStart || '-',
      intervalEnd: entry.intervalEnd || '-',
      exit: entry.exit || '-',
      workedHours: clockWorkedHours,
      contractualHours,
      regularHours,
      overtimeHours,
      overtimeDayHours,
      overtimeNightHours,
      nightHours,
      overtimePercentage
    };
  };

  const getTypeLabel = (type: DayEntry['type']) => {
    switch (type) {
      case 'workday': return 'Dia de Trabalho';
      case 'rest': return 'Dia de Descanso';
      case 'absence': return 'Falta';
      case 'justified-absence': return 'Falta Justificada';
      default: return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Dia de Trabalho': return 'default';
      case 'Dia de Descanso': return 'secondary';
      case 'Falta': return 'destructive';
      case 'Falta Justificada': return 'outline';
      default: return 'default';
    }
  };

  // Process day entries into results
  const dayResults: DayResult[] = (calculation?.day_entries || []).map((entry: DayEntry): DayResult => {
    const result = calculateDayResult(entry, calculation.working_hours, calculation.overtime_percentages);
    return {
      date: entry.date,
      weekday: format(parseISO(entry.date + 'T00:00:00'), 'EEEE', { locale: ptBR }),
      type: getTypeLabel(entry.type),
      entry: entry.entry,
      intervalStart: entry.intervalStart,
      intervalEnd: entry.intervalEnd,
      exit: entry.exit,
      workedHours: result.workedHours,
      contractualHours: result.contractualHours,
      regularHours: result.regularHours,
      overtimeHours: result.overtimeHours,
      overtimeDayHours: result.overtimeDayHours,
      overtimeNightHours: result.overtimeNightHours,
      nightHours: result.nightHours,
      overtimePercentage: result.overtimePercentage
    };
  });

  // Group results by month/year
  const groupByMonth = (results: DayResult[]) => {
    const groups: { [key: string]: DayResult[] } = {};
    
    results.forEach(result => {
      const monthKey = format(parseISO(result.date + 'T00:00:00'), 'yyyy-MM', { locale: ptBR });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(result);
    });
    
    return groups;
  };

  // Calculate totals for a specific month
  const calculateMonthTotals = (monthResults: DayResult[]) => {
    return monthResults.reduce((acc, result) => ({
      workedHours: acc.workedHours + result.workedHours,
      regularHours: acc.regularHours + result.regularHours,
      overtimeHours: acc.overtimeHours + result.overtimeHours,
      overtimeDayHours: acc.overtimeDayHours + result.overtimeDayHours,
      overtimeNightHours: acc.overtimeNightHours + result.overtimeNightHours,
      nightHours: acc.nightHours + result.nightHours
    }), { workedHours: 0, regularHours: 0, overtimeHours: 0, overtimeDayHours: 0, overtimeNightHours: 0, nightHours: 0 });
  };

  const resultsByMonth = groupByMonth(dayResults);

  // Calculate progressive overtime hours by percentage
  const calculateProgressiveOvertimeHours = (results: DayResult[], overtimePercentages: OvertimePercentages) => {
    let he50 = 0, he60 = 0, he70 = 0, he80 = 0, he90 = 0, he100 = 0;
    
    results.forEach(result => {
      const totalOvertimeHours = result.overtimeDayHours + result.overtimeNightHours;
      
      if (result.type === 'Dia de Descanso' && totalOvertimeHours > 0) {
        // Rest day overtime is always at restDay percentage
        const restDayPercentage = overtimePercentages.restDay;
        if (restDayPercentage === 50) he50 += totalOvertimeHours;
        else if (restDayPercentage === 60) he60 += totalOvertimeHours;
        else if (restDayPercentage === 70) he70 += totalOvertimeHours;
        else if (restDayPercentage === 80) he80 += totalOvertimeHours;
        else if (restDayPercentage === 90) he90 += totalOvertimeHours;
        else if (restDayPercentage === 100) he100 += totalOvertimeHours;
      } else if (totalOvertimeHours > 0 && result.type === 'Dia de Trabalho') {
        // Progressive calculation for workdays
        let remainingOvertimeHours = totalOvertimeHours;
        
        // First 2 hours at upTo2Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt1st = Math.min(remainingOvertimeHours, 2);
          if (overtimePercentages.upTo2Hours === 50) he50 += hoursAt1st;
          else if (overtimePercentages.upTo2Hours === 60) he60 += hoursAt1st;
          else if (overtimePercentages.upTo2Hours === 70) he70 += hoursAt1st;
          else if (overtimePercentages.upTo2Hours === 80) he80 += hoursAt1st;
          else if (overtimePercentages.upTo2Hours === 90) he90 += hoursAt1st;
          else if (overtimePercentages.upTo2Hours === 100) he100 += hoursAt1st;
          remainingOvertimeHours -= hoursAt1st;
        }
        
        // Next hour (2-3) at from2To3Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt2nd = Math.min(remainingOvertimeHours, 1);
          if (overtimePercentages.from2To3Hours === 50) he50 += hoursAt2nd;
          else if (overtimePercentages.from2To3Hours === 60) he60 += hoursAt2nd;
          else if (overtimePercentages.from2To3Hours === 70) he70 += hoursAt2nd;
          else if (overtimePercentages.from2To3Hours === 80) he80 += hoursAt2nd;
          else if (overtimePercentages.from2To3Hours === 90) he90 += hoursAt2nd;
          else if (overtimePercentages.from2To3Hours === 100) he100 += hoursAt2nd;
          remainingOvertimeHours -= hoursAt2nd;
        }
        
        // Next hour (3-4) at from3To4Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt3rd = Math.min(remainingOvertimeHours, 1);
          if (overtimePercentages.from3To4Hours === 50) he50 += hoursAt3rd;
          else if (overtimePercentages.from3To4Hours === 60) he60 += hoursAt3rd;
          else if (overtimePercentages.from3To4Hours === 70) he70 += hoursAt3rd;
          else if (overtimePercentages.from3To4Hours === 80) he80 += hoursAt3rd;
          else if (overtimePercentages.from3To4Hours === 90) he90 += hoursAt3rd;
          else if (overtimePercentages.from3To4Hours === 100) he100 += hoursAt3rd;
          remainingOvertimeHours -= hoursAt3rd;
        }
        
        // Next hour (4-5) at from4To5Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt4th = Math.min(remainingOvertimeHours, 1);
          if (overtimePercentages.from4To5Hours === 50) he50 += hoursAt4th;
          else if (overtimePercentages.from4To5Hours === 60) he60 += hoursAt4th;
          else if (overtimePercentages.from4To5Hours === 70) he70 += hoursAt4th;
          else if (overtimePercentages.from4To5Hours === 80) he80 += hoursAt4th;
          else if (overtimePercentages.from4To5Hours === 90) he90 += hoursAt4th;
          else if (overtimePercentages.from4To5Hours === 100) he100 += hoursAt4th;
          remainingOvertimeHours -= hoursAt4th;
        }
        
        // Remaining hours (5+) at over5Hours percentage
        if (remainingOvertimeHours > 0) {
          if (overtimePercentages.over5Hours === 50) he50 += remainingOvertimeHours;
          else if (overtimePercentages.over5Hours === 60) he60 += remainingOvertimeHours;
          else if (overtimePercentages.over5Hours === 70) he70 += remainingOvertimeHours;
          else if (overtimePercentages.over5Hours === 80) he80 += remainingOvertimeHours;
          else if (overtimePercentages.over5Hours === 90) he90 += remainingOvertimeHours;
          else if (overtimePercentages.over5Hours === 100) he100 += remainingOvertimeHours;
        }
      }
    });
    
    return { he50, he60, he70, he80, he90, he100 };
  };

  // Calculate progressive overtime breakdown for a single day with grouped percentages
  const calculateDayOvertimeBreakdown = (overtimeDayHours: number, overtimeNightHours: number, overtimePercentages: OvertimePercentages, isRestDay: boolean = false): string => {
    const totalOvertimeHours = overtimeDayHours + overtimeNightHours;
    
    if (totalOvertimeHours <= 0) return '-';
    
    if (isRestDay) {
      return `${formatHoursToTime(totalOvertimeHours)} (${overtimePercentages.restDay}%)`;
    }
    
    // Group hours by percentage
    const hoursGroupedByPercentage = new Map<number, number>();
    let remainingHours = totalOvertimeHours;
    
    // First 2 hours at upTo2Hours percentage
    if (remainingHours > 0) {
      const hoursAt50 = Math.min(remainingHours, 2);
      const currentHours = hoursGroupedByPercentage.get(overtimePercentages.upTo2Hours) || 0;
      hoursGroupedByPercentage.set(overtimePercentages.upTo2Hours, currentHours + hoursAt50);
      remainingHours -= hoursAt50;
    }
    
    // Next hour (2-3) at from2To3Hours percentage
    if (remainingHours > 0) {
      const hoursAt2To3 = Math.min(remainingHours, 1);
      const currentHours = hoursGroupedByPercentage.get(overtimePercentages.from2To3Hours) || 0;
      hoursGroupedByPercentage.set(overtimePercentages.from2To3Hours, currentHours + hoursAt2To3);
      remainingHours -= hoursAt2To3;
    }
    
    // Next hour (3-4) at from3To4Hours percentage
    if (remainingHours > 0) {
      const hoursAt3To4 = Math.min(remainingHours, 1);
      const currentHours = hoursGroupedByPercentage.get(overtimePercentages.from3To4Hours) || 0;
      hoursGroupedByPercentage.set(overtimePercentages.from3To4Hours, currentHours + hoursAt3To4);
      remainingHours -= hoursAt3To4;
    }
    
    // Next hour (4-5) at from4To5Hours percentage
    if (remainingHours > 0) {
      const hoursAt4To5 = Math.min(remainingHours, 1);
      const currentHours = hoursGroupedByPercentage.get(overtimePercentages.from4To5Hours) || 0;
      hoursGroupedByPercentage.set(overtimePercentages.from4To5Hours, currentHours + hoursAt4To5);
      remainingHours -= hoursAt4To5;
    }
    
    // Remaining hours (5+) at over5Hours percentage
    if (remainingHours > 0) {
      const currentHours = hoursGroupedByPercentage.get(overtimePercentages.over5Hours) || 0;
      hoursGroupedByPercentage.set(overtimePercentages.over5Hours, currentHours + remainingHours);
    }
    
    // Convert grouped hours to breakdown string
    const breakdown: string[] = [];
    for (const [percentage, hours] of hoursGroupedByPercentage.entries()) {
      if (hours > 0) {
        breakdown.push(`${formatHoursToTime(hours)} (${percentage}%)`);
      }
    }
    
    return breakdown.join(' + ');
  };

  // Extract employee name from description (first part before " - ")
  const getEmployeeName = (description: string): string => {
    const parts = description.split(' - ');
    return parts[0] || 'Funcionário';
  };
  
  // Calculate progressive overtime hours for all months combined
  const progressiveHours = calculateProgressiveOvertimeHours(dayResults, calculation.overtime_percentages);
  
  // Get all configured percentage values to show in reports
  const getAllConfiguredPercentages = (overtimePercentages: OvertimePercentages) => {
    const percentages = new Set<number>();
    percentages.add(overtimePercentages.upTo2Hours);
    percentages.add(overtimePercentages.from2To3Hours);
    percentages.add(overtimePercentages.from3To4Hours);
    percentages.add(overtimePercentages.from4To5Hours);
    percentages.add(overtimePercentages.over5Hours);
    percentages.add(overtimePercentages.restDay);
    return Array.from(percentages).sort((a, b) => a - b);
  };

  const configuredPercentages = getAllConfiguredPercentages(calculation?.overtime_percentages);

  // Helper function to get color for percentage
  const getColorForPercentage = (percentage: number) => {
    switch (percentage) {
      case 50: return '#059669';
      case 60: return '#0891b2';
      case 70: return '#d97706';
      case 80: return '#9333ea';
      case 90: return '#e11d48';
      case 100: return '#dc2626';
      default: return '#666';
    }
  };
  const getHoursForPercentage = (percentage: number, hours: any) => {
    switch (percentage) {
      case 50: return hours.he50 || 0;
      case 60: return hours.he60 || 0;
      case 70: return hours.he70 || 0;
      case 80: return hours.he80 || 0;
      case 90: return hours.he90 || 0;
      case 100: return hours.he100 || 0;
      default: return 0;
    }
  };
  
  // Calculate overall totals (all months combined)
  const totals = dayResults.reduce((acc, result) => ({
    workedHours: acc.workedHours + result.workedHours,
    regularHours: acc.regularHours + result.regularHours,
    overtimeHours: acc.overtimeHours + result.overtimeHours,
    overtimeDayHours: acc.overtimeDayHours + result.overtimeDayHours,
    overtimeNightHours: acc.overtimeNightHours + result.overtimeNightHours,
    nightHours: acc.nightHours + result.nightHours
  }), { workedHours: 0, regularHours: 0, overtimeHours: 0, overtimeDayHours: 0, overtimeNightHours: 0, nightHours: 0 });

  // Count absences
  const absenceCounts = calculation.day_entries.reduce((acc, entry) => {
    if (entry.type === 'absence') acc.unjustified++;
    else if (entry.type === 'justified-absence') acc.justified++;
    return acc;
  }, { unjustified: 0, justified: 0 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4;
              margin: 1.5cm;
            }
            
            .print-page-break {
              page-break-before: always;
            }
            
            .print-header {
              display: block !important;
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            
            .print-month-header {
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              color: #333;
            }
            
            .print-summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin: 15px 0;
            }
            
            .print-summary-card {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: center;
              border-radius: 4px;
            }
            
            .print-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
              margin: 15px 0;
            }
            
            .print-table th,
            .print-table td {
              border: 1px solid #ddd;
              padding: 4px;
              text-align: left;
            }
            
            .print-table th {
              background-color: #f5f5f5;
              font-weight: bold;
              font-size: 8px;
            }
            
            .print-config {
              margin-top: 20px;
              font-size: 10px;
              border: 1px solid #ddd;
              padding: 10px;
            }
            
            .print-config-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            
            .screen-only {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }
          }
          
          .screen-only {
            display: block;
          }
          
          .print-only {
            display: none;
          }
        `
      }} />

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm screen-only">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Resultado do Cálculo
              </h1>
               <p className="text-sm text-muted-foreground">
                {calculation.description} • {format(parseISO(calculation.start_date + 'T00:00:00'), 'dd/MM/yyyy')} - {format(parseISO(calculation.end_date + 'T00:00:00'), 'dd/MM/yyyy')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="dashboard" onClick={onBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 screen-only">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Print Header */}
          <div className="hidden print:block mb-8">
            <h1 className="text-2xl font-bold text-center mb-2">
              Sistema de Horas Extras - Resultado do Cálculo
            </h1>
            <p className="text-center text-muted-foreground">
              Funcionário: {getEmployeeName(calculation.description)}
            </p>
             <p className="text-center text-sm text-muted-foreground">
               Período: {format(parseISO(calculation.start_date + 'T00:00:00'), "dd/MM/yyyy")} - {format(parseISO(calculation.end_date + 'T00:00:00'), "dd/MM/yyyy")}
             </p>
          </div>

          {/* Absence Information */}
          {(absenceCounts.unjustified > 0 || absenceCounts.justified > 0) && (
            <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">Informações de Faltas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {absenceCounts.unjustified}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Faltas Injustificadas
                    </p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {absenceCounts.justified}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Faltas Justificadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Trabalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatHoursToTime(totals.workedHours)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Horas totais trabalhadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Horas Normais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatHoursToTime(totals.regularHours)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Dentro da jornada contratual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">H. Noturnas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatHoursToTime(totals.nightHours)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Horário noturno trabalhado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">H.E. Diurnas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {formatHoursToTime(totals.overtimeDayHours)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Horas extras diurnas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">H.E. Noturnas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatHoursToTime(totals.overtimeNightHours)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Horas extras noturnas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Horas Extras</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold text-orange-600">
                   {formatHoursToTime(totals.overtimeDayHours + totals.overtimeNightHours)}
                 </div>
                <p className="text-sm text-muted-foreground">
                  Excedente da jornada
                </p>
              </CardContent>
            </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">H.E. por Percentual</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-1">
                     {configuredPercentages
                       .filter(percentage => {
                         const hours = getHoursForPercentage(percentage, progressiveHours);
                         return hours > 0;
                       })
                       .map(percentage => {
                         const hours = getHoursForPercentage(percentage, progressiveHours);
                         return (
                           <div key={percentage} className="flex justify-between text-sm">
                             <span>{percentage}%:</span>
                             <span className="font-mono">{formatHoursToTime(hours)}</span>
                           </div>
                         );
                       })}
                   </div>
                </CardContent>
              </Card>
          </div>

          {/* Monthly Results - Only show when multiple months */}
          {Object.keys(resultsByMonth).length > 1 && Object.entries(resultsByMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, monthResults]) => {
              const monthTotals = calculateMonthTotals(monthResults);
              const monthProgressiveHours = calculateProgressiveOvertimeHours(monthResults, calculation.overtime_percentages);
              const monthName = format(parseISO(monthKey + '-01T00:00:00'), 'MMMM/yyyy', { locale: ptBR });
              const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
              
              return (
                <Card key={monthKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      {monthNameCapitalized}
                    </CardTitle>
                    <CardDescription>
                      Resultado detalhado do cálculo de horas extras para {monthNameCapitalized.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     {/* Month Summary Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Trabalhado</p>
                        <p className="text-xl font-bold text-primary">
                          {formatHoursToTime(monthTotals.workedHours)}
                        </p>
                      </div>
                       <div className="text-center p-3 bg-muted/50 rounded-lg">
                         <p className="text-sm text-muted-foreground">Horas Normais</p>
                         <p className="text-xl font-bold text-green-600">
                           {formatHoursToTime(monthTotals.regularHours)}
                         </p>
                       </div>
                       <div className="text-center p-3 bg-muted/50 rounded-lg">
                         <p className="text-sm text-muted-foreground">H. Noturnas</p>
                         <p className="text-xl font-bold text-blue-600">
                           {formatHoursToTime(monthTotals.nightHours)}
                         </p>
                       </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">H.E. Diurnas</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatHoursToTime(monthTotals.overtimeDayHours)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">H.E. Noturnas</p>
                        <p className="text-xl font-bold text-purple-600">
                          {formatHoursToTime(monthTotals.overtimeNightHours)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Horas Extras</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatHoursToTime(monthTotals.overtimeDayHours + monthTotals.overtimeNightHours)}
                        </p>
                      </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">H.E. por %</p>
                          <div className="space-y-1">
                            {configuredPercentages
                              .filter(percentage => {
                                const hours = getHoursForPercentage(percentage, monthProgressiveHours);
                                return hours > 0;
                              })
                              .map(percentage => {
                                const hours = getHoursForPercentage(percentage, monthProgressiveHours);
                                return (
                                  <div key={percentage} className="flex justify-between text-xs">
                                    <span>{percentage}%:</span>
                                    <span className="font-mono">{formatHoursToTime(hours)}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                    </div>
                    
                    {/* Month Details Table */}
                    <div className="overflow-x-auto">
                      <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead>Data</TableHead>
                             <TableHead>Dia</TableHead>
                             <TableHead>Tipo</TableHead>
                             <TableHead>Entrada</TableHead>
                             <TableHead>Início Int.</TableHead>
                             <TableHead>Fim Int.</TableHead>
                             <TableHead>Saída</TableHead>
                             <TableHead className="text-right">H. Trab.</TableHead>
                             <TableHead className="text-right">H. Contr.</TableHead>
                             <TableHead className="text-right">H. Normais</TableHead>
                             <TableHead className="text-right">H. Noturnas</TableHead>
                             <TableHead className="text-right">H. Extras</TableHead>
                             <TableHead className="text-right">H.E. Diurnas</TableHead>
                             <TableHead className="text-right">H.E. Noturnas</TableHead>
                             <TableHead>Discriminação H.E.</TableHead>
                           </TableRow>
                         </TableHeader>
                        <TableBody>
                          {monthResults.map((result) => (
                            <TableRow key={result.date}>
                              <TableCell>{format(parseISO(result.date + 'T00:00:00'), "dd/MM")}</TableCell>
                              <TableCell className="capitalize">
                                {result.weekday}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getTypeBadgeVariant(result.type)}>
                                  {result.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{result.entry}</TableCell>
                              <TableCell>{result.intervalStart}</TableCell>
                              <TableCell>{result.intervalEnd}</TableCell>
                              <TableCell>{result.exit}</TableCell>
                               <TableCell className="text-right font-mono">
                                 {formatHoursToTime(result.workedHours)}
                               </TableCell>
                               <TableCell className="text-right font-mono">
                                 {formatHoursToTime(result.contractualHours)}
                               </TableCell>
                               <TableCell className="text-right font-mono">
                                 {formatHoursToTime(result.regularHours)}
                               </TableCell>
                               <TableCell className="text-right font-mono">
                                 {result.nightHours > 0 ? (
                                   <span className="text-blue-600 font-semibold">
                                     {formatHoursToTime(result.nightHours)}
                                   </span>
                                 ) : (
                                   '00:00'
                                 )}
                               </TableCell>
                                <TableCell className="text-right font-mono">
                                  {(result.overtimeDayHours + result.overtimeNightHours) > 0 ? (
                                    <span className="text-orange-600 font-semibold">
                                      {formatHoursToTime(result.overtimeDayHours + result.overtimeNightHours)}
                                    </span>
                                  ) : (
                                    '00:00'
                                  )}
                                </TableCell>
                               <TableCell className="text-right font-mono">
                                 {result.overtimeDayHours > 0 ? (
                                   <span className="text-orange-600 font-semibold">
                                     {formatHoursToTime(result.overtimeDayHours)}
                                   </span>
                                 ) : (
                                   '00:00'
                                 )}
                               </TableCell>
                               <TableCell className="text-right font-mono">
                                 {result.overtimeNightHours > 0 ? (
                                   <span className="text-purple-600 font-semibold">
                                     {formatHoursToTime(result.overtimeNightHours)}
                                   </span>
                                 ) : (
                                   '00:00'
                                 )}
                               </TableCell>
                              <TableCell>
                                <div className="text-xs font-mono">
                                   {calculateDayOvertimeBreakdown(
                                     result.overtimeDayHours,
                                     result.overtimeNightHours, 
                                     calculation.overtime_percentages,
                                     result.type === 'Dia de Descanso'
                                   )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {/* Overall Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Geral do Período</CardTitle>
              <CardDescription>
                Totalizações de todos os meses calculados
              </CardDescription>
            </CardHeader>
            <CardContent>
               {/* Overall Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-8 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Trabalhado</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatHoursToTime(totals.workedHours)}
                  </p>
                </div>
                 <div className="text-center">
                   <p className="text-sm text-muted-foreground">Horas Normais</p>
                   <p className="text-2xl font-bold text-green-600">
                     {formatHoursToTime(totals.regularHours)}
                   </p>
                 </div>
                 <div className="text-center">
                   <p className="text-sm text-muted-foreground">H. Noturnas</p>
                   <p className="text-2xl font-bold text-blue-600">
                     {formatHoursToTime(totals.nightHours)}
                   </p>
                 </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Horas Extras</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatHoursToTime(totals.overtimeDayHours + totals.overtimeNightHours)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">H.E. Diurnas</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatHoursToTime(totals.overtimeDayHours)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">H.E. Noturnas</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatHoursToTime(totals.overtimeNightHours)}
                  </p>
                </div>
                 <div className="text-center">
                   <p className="text-sm text-muted-foreground">H.E. por %</p>
                   <div className="space-y-1">
                     {configuredPercentages.map(percentage => {
                       const hours = getHoursForPercentage(percentage, progressiveHours);
                       return (
                         <div key={percentage} className="flex justify-between text-xs">
                           <span>{percentage}%:</span>
                           <span className="font-mono">{formatHoursToTime(hours)}</span>
                         </div>
                       );
                     })}
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Summary */}
          <Card className="print:break-before-page">
            <CardHeader>
              <CardTitle>Configurações Utilizadas</CardTitle>
              <CardDescription>
                Parâmetros aplicados neste cálculo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <dt className="font-medium">Horas Contratuais</dt>
                  {(() => {
                    const groupedHours = new Map<string, string[]>();
                    const dayNames = {
                      monday: 'seg',
                      tuesday: 'ter',
                      wednesday: 'qua',
                      thursday: 'qui',
                      friday: 'sex',
                      saturday: 'sáb',
                      sunday: 'dom'
                    };
                    
                    const weekdayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    
                    Object.entries(calculation.working_hours).forEach(([day, hours]) => {
                      if (day !== 'rest') {
                        const hoursStr = `${hours}h`;
                        const dayName = dayNames[day as keyof typeof dayNames];
                        if (!groupedHours.has(hoursStr)) {
                          groupedHours.set(hoursStr, []);
                        }
                        groupedHours.get(hoursStr)!.push(dayName);
                      }
                    });
                    
                    // Sort days within each group by weekday order
                    groupedHours.forEach((days, hours) => {
                      days.sort((a, b) => {
                        const dayAIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === a);
                        const dayBIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === b);
                        return dayAIndex - dayBIndex;
                      });
                    });
                    
                    // Sort groups by the first day's position in the week
                    const sortedEntries = Array.from(groupedHours.entries()).sort(([, daysA], [, daysB]) => {
                      const firstDayAIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === daysA[0]);
                      const firstDayBIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === daysB[0]);
                      return firstDayAIndex - firstDayBIndex;
                    });
                    
                    return sortedEntries.map(([hours, days]) => (
                      <dd key={hours}>{hours} ({days.join('-')})</dd>
                    ));
                  })()}
                </div>
                
                <div className="space-y-1">
                  <dt className="font-medium">Percentuais de Hora Extra</dt>
                  <dd>Até 2h: {calculation.overtime_percentages.upTo2Hours}%</dd>
                  <dd>2-3h: {calculation.overtime_percentages.from2To3Hours}%</dd>
                  <dd>3-4h: {calculation.overtime_percentages.from3To4Hours}%</dd>
                  <dd>4-5h: {calculation.overtime_percentages.from4To5Hours}%</dd>
                  <dd>+5h: {calculation.overtime_percentages.over5Hours}%</dd>
                  <dd>Folga: {calculation.overtime_percentages.restDay}%</dd>
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <dt className="font-medium">Configuração de Horário Noturno</dt>
                  <dd>
                    <strong>Período:</strong> {((calculation as any).night_shift_start?.replace(':00', '') || '22:00')} às {((calculation as any).night_shift_end?.replace(':00', '') || '05:00')}
                  </dd>
                  <dd>
                    <strong>Prorrogação (Súmula 60 TST):</strong> {((calculation as any).extend_night_hours ?? true) ? 'Sim' : 'Não'}
                  </dd>
                  <dd>
                    <strong>Fator de redução aplicado:</strong> {((calculation as any).apply_night_reduction ?? true) ? 'Sim' : 'Não'}
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Professional Print Layout */}
      <div className="print-only">
        {Object.entries(resultsByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, monthResults], index) => {
            const monthTotals = calculateMonthTotals(monthResults);
            const monthProgressiveHours = calculateProgressiveOvertimeHours(monthResults, calculation.overtime_percentages);
            const monthName = format(parseISO(monthKey + '-01T00:00:00'), 'MMMM/yyyy', { locale: ptBR });
            const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            
            return (
              <div key={monthKey} className={index > 0 ? "print-page-break" : ""}>
                {/* Professional Header */}
                <div className="print-header">
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                    RELATÓRIO DE HORAS EXTRAS
                  </h1>
                  <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                    <strong>Funcionário:</strong> {getEmployeeName(calculation.description)}<br/>
                    <strong>Período:</strong> {format(parseISO(calculation.start_date + 'T00:00:00'), "dd/MM/yyyy")} - {format(parseISO(calculation.end_date + 'T00:00:00'), "dd/MM/yyyy")}<br/>
                    <strong>Mês de Referência:</strong> {monthNameCapitalized}
                  </div>
                </div>

                {/* Absence Information - if present */}
                {monthResults.some(r => r.type === 'Falta' || r.type === 'Falta Justificada') && (
                  <div style={{ 
                    backgroundColor: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '4px', 
                    padding: '10px', 
                    marginBottom: '15px' 
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#92400e' }}>
                      Informações de Faltas
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                          {monthResults.filter(r => r.type === 'Falta').length}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>Faltas Injustificadas</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c' }}>
                          {monthResults.filter(r => r.type === 'Falta Justificada').length}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>Faltas Justificadas</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Month Summary */}
                <div className="print-summary-grid">
                  <div className="print-summary-card">
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Trabalhado</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatHoursToTime(monthTotals.workedHours)}</div>
                  </div>
                  <div className="print-summary-card">
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Horas Normais</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a' }}>{formatHoursToTime(monthTotals.regularHours)}</div>
                  </div>
                  <div className="print-summary-card">
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>H.E. Diurnas</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ea580c' }}>{formatHoursToTime(monthTotals.overtimeDayHours)}</div>
                  </div>
                  <div className="print-summary-card">
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>H.E. Noturnas</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9333ea' }}>{formatHoursToTime(monthTotals.overtimeNightHours)}</div>
                  </div>
                  <div className="print-summary-card">
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Horas Extras</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ea580c' }}>{formatHoursToTime(monthTotals.overtimeDayHours + monthTotals.overtimeNightHours)}</div>
                  </div>
                  <div className="print-summary-card">
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Horas Noturnas</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>{formatHoursToTime(monthTotals.nightHours)}</div>
                  </div>
                </div>

                {/* Progressive Hours as Cards */}
                <div className="print-summary-grid" style={{ marginBottom: '15px' }}>
                  {configuredPercentages
                    .filter(percentage => {
                      const hours = getHoursForPercentage(percentage, monthProgressiveHours);
                      return hours > 0;
                    })
                    .map(percentage => {
                      const hours = getHoursForPercentage(percentage, monthProgressiveHours);
                      const color = getColorForPercentage(percentage);
                      return (
                        <div key={percentage} className="print-summary-card">
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>H.E. {percentage}%</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color }}>{formatHoursToTime(hours)}</div>
                        </div>
                      );
                    })}
                </div>

                {/* Detailed Table */}
                <table className="print-table">
                   <thead>
                     <tr>
                       <th>Data</th>
                       <th>Dia</th>
                       <th>Tipo</th>
                       <th>Entrada</th>
                       <th>Iní. Int.</th>
                       <th>Fim Int.</th>
                       <th>Saída</th>
                       <th>H. Trab.</th>
                       <th>H. Contr.</th>
                       <th>H. Norm.</th>
                       <th>H. Not.</th>
                       <th>H. Ext.</th>
                       <th>H.E. Diur.</th>
                       <th>H.E. Not.</th>
                     </tr>
                   </thead>
                  <tbody>
                    {monthResults.map((result) => (
                      <tr key={result.date}>
                        <td>{format(parseISO(result.date + 'T00:00:00'), "dd/MM")}</td>
                        <td style={{ textTransform: 'capitalize' }}>{result.weekday.substring(0, 3)}</td>
                        <td>{result.type === 'Dia de Trabalho' ? 'Trabalho' : 
                             result.type === 'Dia de Descanso' ? 'Descanso' :
                             result.type === 'Falta' ? 'Falta' : 'F. Just.'}</td>
                        <td>{result.entry}</td>
                        <td>{result.intervalStart}</td>
                        <td>{result.intervalEnd}</td>
                        <td>{result.exit}</td>
                         <td>{formatHoursToTime(result.workedHours)}</td>
                         <td>{formatHoursToTime(result.contractualHours)}</td>
                         <td>{formatHoursToTime(result.regularHours)}</td>
                         <td style={{ color: '#2563eb' }}>{formatHoursToTime(result.nightHours)}</td>
                         <td style={{ fontWeight: 'bold' }}>{formatHoursToTime(result.overtimeDayHours + result.overtimeNightHours)}</td>
                         <td style={{ color: '#ea580c' }}>{formatHoursToTime(result.overtimeDayHours)}</td>
                         <td style={{ color: '#9333ea' }}>{formatHoursToTime(result.overtimeNightHours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Configuration */}
                <div className="print-config">
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>CONFIGURAÇÕES UTILIZADAS</div>
                  <div className="print-config-grid">
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Horas Contratuais:</div>
                      <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                        {(() => {
                          const groupedHours = new Map<string, string[]>();
                          const dayNames = {
                            monday: 'Segunda',
                            tuesday: 'Terça',
                            wednesday: 'Quarta',
                            thursday: 'Quinta',
                            friday: 'Sexta',
                            saturday: 'Sábado',
                            sunday: 'Domingo'
                          };
                          
                          const weekdayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                          
                          Object.entries(calculation.working_hours).forEach(([day, hours]) => {
                            if (day !== 'rest') {
                              const hoursStr = `${hours}h`;
                              const dayName = dayNames[day as keyof typeof dayNames];
                              if (!groupedHours.has(hoursStr)) {
                                groupedHours.set(hoursStr, []);
                              }
                              groupedHours.get(hoursStr)!.push(dayName);
                            }
                          });
                          
                          // Sort days within each group by weekday order
                          groupedHours.forEach((days, hours) => {
                            days.sort((a, b) => {
                              const dayAIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === a);
                              const dayBIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === b);
                              return dayAIndex - dayBIndex;
                            });
                          });
                          
                          // Sort groups by the first day's position in the week
                          const sortedEntries = Array.from(groupedHours.entries()).sort(([, daysA], [, daysB]) => {
                            const firstDayAIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === daysA[0]);
                            const firstDayBIndex = weekdayOrder.findIndex(day => dayNames[day as keyof typeof dayNames] === daysB[0]);
                            return firstDayAIndex - firstDayBIndex;
                          });
                          
                          return sortedEntries.map(([hours, days], index) => (
                            <span key={hours}>
                              {days.join('/')}: {hours}
                              {index < sortedEntries.length - 1 && <br/>}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Percentuais H.E.:</div>
                      <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                        Até 2h: {calculation.overtime_percentages.upTo2Hours}% | 
                        2-3h: {calculation.overtime_percentages.from2To3Hours}%<br/>
                        3-4h: {calculation.overtime_percentages.from3To4Hours}% | 
                        4-5h: {calculation.overtime_percentages.from4To5Hours}%<br/>
                        +5h: {calculation.overtime_percentages.over5Hours}% | 
                        Folga: {calculation.overtime_percentages.restDay}%
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '9px' }}>
                    <strong>Horário Noturno:</strong> {((calculation as any).night_shift_start?.replace(':00', '') || '22:00')} às {((calculation as any).night_shift_end?.replace(':00', '') || '05:00')} | 
                    <strong>Súmula 60:</strong> {((calculation as any).extend_night_hours ?? true) ? 'Sim' : 'Não'} | 
                    <strong>Redução:</strong> {((calculation as any).apply_night_reduction ?? true) ? 'Sim' : 'Não'}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};