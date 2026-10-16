import { MUSCLE_GROUP_LABELS } from '../data/exerciseCatalog.ts';
import { buildDefaultSplitRoutine, getLibraryExerciseById } from '../data/gymExerciseLibrary.ts';
import { round2 } from './metrics.ts';
import { parseWorkoutLog } from './nlpParser.ts';
import type {
  ConfiguredDayRoutine,
  ConfiguredExerciseSlot,
  HeroPRCardData,
  HeroPRCategory,
  MuscleGroup,
  ParsedExerciseEntry,
  WeekLogSnapshot,
  WeeklyDashboardSummary,
} from '../types/workout.ts';

export const INITIAL_4WEEK_SNAPSHOTS: WeekLogSnapshot[] = [
  {
    weekNumber: 1,
    weekLabel: 'Semana 1 (Base)',
    weekState: 'accumulation',
    logsByDayId: {
      push: [
        'E0 = ruso 10kg 3x7',
        'E1 55kg 8,8,8',
        'E2 67.5kg 8,8,7',
        'E3 40kg 10,10,10',
        'E4 press militar 17.5 por lado 3x8',
        'E5 27.5kg 10,10,10',
        'E6 22.5kg 10,10,10',
      ].join('\n'),
      legs: [
        'E0 = ruso 10kg 3x7',
        'E1 140kg 10,10,8',
        'E2 60kg 10,10,10',
        'E3 50kg 10,10,8',
        'E4 dropset 55kg 12 -> 45kg 10 -> 35kg 10',
        'E5 45kg 12,12,12',
      ].join('\n'),
      pull: [
        'E0 = ruso 10kg 3x7',
        'E1 doble polea más pesada 65kg 8,8,6',
        'E2 60kg 8,8,8',
        'E3 10kg 10,10,10',
        'E4 10kg 12,12,12',
        'E5 12kg 10,10,8',
        'E6 22.5kg 10,10,10',
      ].join('\n'),
      day4: [
        'E0 = ruso 10kg 3x7',
        'E1 35kg 8,8,8',
        'E2 60kg 8,8,8',
        'E3 65kg 8,8,8',
        'E4 10kg 12,12,10',
        'E5 12kg 10,10,10',
        'E6 22.5kg 10,10,10',
      ].join('\n'),
      day5: [
        'E0 = ruso 10kg 3x7',
        'E1 80kg 8,8,8',
        'E2 90kg 10,10,10',
        'E3 100kg 8,8,8',
        'E4 50kg 10,10,10',
        'E5 55kg 12,12,12',
      ].join('\n'),
      upper: [
        'E0 = ruso 10kg 3x7',
        'E1 55kg 8,8,8',
        'E2 67.5kg 8,8,7',
        'E3 doble polea más pesada 65kg 8,8,6',
        'E4 60kg 8,8,8',
        'E5 press militar 17.5 por lado 3x8',
        'E6 27.5kg 10,10,10',
      ].join('\n'),
      lower: [
        'E0 = ruso 10kg 3x7',
        'E1 140kg 10,10,8',
        'E2 60kg 10,10,10',
        'E3 50kg 10,10,8',
        'E4 dropset 55kg 12 -> 45kg 10 -> 35kg 10',
        'E5 10kg 12,12,12',
        'E6 12kg 10,10,8',
      ].join('\n'),
    },
  },
  {
    weekNumber: 2,
    weekLabel: 'Semana 2 (Carga)',
    weekState: 'accumulation',
    logsByDayId: {
      push: [
        'E0 = ruso 10kg 3x8',
        'E1 57.5kg 8,8,7',
        'E2 70kg 8,8,6',
        'E3 42.5kg 10,10,10',
        'E4 press militar 18.75 por lado 3x8',
        'E5 30kg 10,10,9',
        'E6 25kg 10,9,9',
      ].join('\n'),
      legs: [
        'E0 = ruso 10kg 3x8',
        'E1 150kg 10,10,8',
        'E2 62.5kg 11,10,10',
        'E3 52.5kg 10,10,10',
        'E4 dropset 60kg 12 -> 50kg 10 -> 40kg 10',
        'E5 47.5kg 12,12,12',
      ].join('\n'),
      pull: [
        'E0 = ruso 10kg 3x8',
        'E1 doble polea más pesada 67.5kg 8,8,7',
        'E2 62.5kg 9,9,8',
        'E3 10kg 12,10,10',
        'E4 12kg 10,10,10',
        'E5 12kg 12,12,10',
        'E6 25kg 10,10,9',
      ].join('\n'),
      day4: [
        'E0 = ruso 10kg 3x8',
        'E1 37.5kg 8,8,8',
        'E2 62.5kg 8,8,8',
        'E3 67.5kg 8,8,8',
        'E4 12kg 10,10,10',
        'E5 14kg 10,10,8',
        'E6 25kg 10,10,10',
      ].join('\n'),
      day5: [
        'E0 = ruso 10kg 3x8',
        'E1 85kg 8,8,8',
        'E2 95kg 10,10,10',
        'E3 105kg 8,8,8',
        'E4 52.5kg 10,10,10',
        'E5 60kg 12,12,12',
      ].join('\n'),
      upper: [
        'E0 = ruso 10kg 3x8',
        'E1 57.5kg 8,8,7',
        'E2 70kg 8,8,6',
        'E3 doble polea más pesada 67.5kg 8,8,7',
        'E4 62.5kg 9,9,8',
        'E5 press militar 18.75 por lado 3x8',
        'E6 30kg 10,10,9',
      ].join('\n'),
      lower: [
        'E0 = ruso 10kg 3x8',
        'E1 150kg 10,10,8',
        'E2 62.5kg 11,10,10',
        'E3 52.5kg 10,10,10',
        'E4 dropset 60kg 12 -> 50kg 10 -> 40kg 10',
        'E5 12kg 10,10,10',
        'E6 12kg 12,12,10',
      ].join('\n'),
    },
  },
  {
    weekNumber: 3,
    weekLabel: 'Semana 3 (Prev)',
    weekState: 'accumulation',
    logsByDayId: {
      push: [
        'E0 = ruso 10kg 3x7',
        'E1 60kg 8,8,6',
        'E2 75kg 5 70kg 8, 8, 6',
        'E3 no',
        'E4 press militar 20 por lado 3x8',
        'E5 30kg 12,12,12',
        'E6 25kg 10,10,9',
      ].join('\n'),
      legs: [
        'E0 = ruso 10kg 3x8',
        'E1 160kg 10,10,8',
        'E2 65kg 12,12,10',
        'E3 55kg 10,10,10',
        'E4 dropset 60kg 12 -> 50kg 10 -> 40kg 10',
        'E5 no',
      ].join('\n'),
      pull: [
        'E0 = ruso 10kg 3x8',
        'E1 doble polea más pesada 70kg 8,8,6',
        'E2 65kg 10,10,10',
        'E3 10kg 12,12,12',
        'E4 12kg 12,12,10',
        'E5 14kg 10,10,8',
        'E6 25kg 12,10,10',
      ].join('\n'),
      day4: [
        'E0 = ruso 10kg 3x8',
        'E1 40kg 8,8,7',
        'E2 65kg 8,8,8',
        'E3 70kg 8,8,8',
        'E4 12kg 12,12,10',
        'E5 14kg 10,10,10',
        'E6 25kg 11,10,10',
      ].join('\n'),
      day5: [
        'E0 = ruso 10kg 3x8',
        'E1 90kg 8,8,8',
        'E2 100kg 10,10,10',
        'E3 110kg 8,8,8',
        'E4 55kg 10,10,10',
        'E5 60kg 12,12,12',
      ].join('\n'),
      upper: [
        'E0 = ruso 10kg 3x7',
        'E1 60kg 8,8,6',
        'E2 75kg 5 70kg 8, 8, 6',
        'E3 doble polea más pesada 70kg 8,8,6',
        'E4 65kg 10,10,10',
        'E5 press militar 20 por lado 3x8',
        'E6 30kg 12,12,12',
      ].join('\n'),
      lower: [
        'E0 = ruso 10kg 3x8',
        'E1 160kg 10,10,8',
        'E2 65kg 12,12,10',
        'E3 55kg 10,10,10',
        'E4 dropset 60kg 12 -> 50kg 10 -> 40kg 10',
        'E5 12kg 12,12,10',
        'E6 14kg 10,10,8',
      ].join('\n'),
    },
  },
  {
    weekNumber: 4,
    weekLabel: 'Semana 4 (Actual)',
    weekState: 'accumulation',
    logsByDayId: {
      push: [
        'E0 = ruso 10kg 3x8',
        'E1 60kg 8,8,8',
        'E2 75kg 8,8,8',
        'E3 45kg 10,10,10',
        'E4 press militar 20 por lado 3x9',
        'E5 32.5kg 8,8,8',
        'E6 25kg 11,10,10',
      ].join('\n'),
      legs: [
        'E0 = ruso 10kg 3x9',
        'E1 160kg 10,10,10',
        'E2 65kg 12,12,12',
        'E3 55kg 12,10,10',
        'E4 dropset 65kg 12 -> 50kg 10 -> 40kg 10',
        'E5 50kg 12,12,12',
      ].join('\n'),
      pull: [
        'E0 = ruso 10kg 3x9',
        'E1 doble polea más pesada 70kg 9,8,8',
        'E2 70kg 8,8,8',
        'E3 10kg 14,12,12',
        'E4 12kg 12,12,12',
        'E5 14kg 10,10,10',
        'E6 25kg 12,12,10',
      ].join('\n'),
      day4: [
        'E0 = ruso 10kg 3x9',
        'E1 40kg 9,8,8',
        'E2 67.5kg 8,8,8',
        'E3 72.5kg 8,8,8',
        'E4 12kg 12,12,12',
        'E5 14kg 12,10,10',
        'E6 25kg 12,12,10',
      ].join('\n'),
      day5: [
        'E0 = ruso 10kg 3x9',
        'E1 95kg 8,8,8',
        'E2 105kg 10,10,10',
        'E3 115kg 8,8,8',
        'E4 55kg 12,10,10',
        'E5 65kg 12,12,12',
      ].join('\n'),
      upper: [
        'E0 = ruso 10kg 3x8',
        'E1 60kg 8,8,8',
        'E2 75kg 8,8,8',
        'E3 doble polea más pesada 70kg 9,8,8',
        'E4 70kg 8,8,8',
        'E5 press militar 20 por lado 3x9',
        'E6 32.5kg 8,8,8',
      ].join('\n'),
      lower: [
        'E0 = ruso 10kg 3x9',
        'E1 160kg 10,10,10',
        'E2 65kg 12,12,12',
        'E3 55kg 12,10,10',
        'E4 dropset 65kg 12 -> 50kg 10 -> 40kg 10',
        'E5 12kg 12,12,12',
        'E6 14kg 10,10,10',
      ].join('\n'),
    },
  },
];

export function safeParseLog(rawLog?: string): ParsedExerciseEntry[] {
  if (!rawLog || !rawLog.trim()) return [];
  const results: ParsedExerciseEntry[] = [];
  const lines = rawLog
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    try {
      const parsed = parseWorkoutLog(line);
      results.push(...parsed);
    } catch {
      // Ignorar líneas incompletas mientras el usuario escribe
    }
  }
  return results;
}

function calculateDeltaPercent(current: number, baseline: number): number {
  if (baseline <= 0) return current > 0 ? 100 : 0;
  return round2(((current - baseline) / baseline) * 100);
}

/**
 * Extrae los 3 Récords Personales Insignia (Big 3 PRs) para mostrar en la cabecera de la Pantalla Principal:
 * - Exactamente 1 ejercicio de Pecho (chest)
 * - Exactamente 1 ejercicio de Piernas (legs)
 * - Exactamente 1 ejercicio de Espalda (back)
 *
 * Permite opcionalmente elegir qué ejercicio específico de esa categoría destacar (por defecto:
 * Press Plano/Banca en Pecho, Prensa Inclinada en Piernas, Jalón al Pecho en Espalda).
 */
export function computeHeroBig3PRs(
  weeks: WeekLogSnapshot[],
  routineDays: ConfiguredDayRoutine[],
  preferredExerciseIds?: Partial<Record<HeroPRCategory, string>>
): HeroPRCardData[] {
  const categories: Array<{
    category: HeroPRCategory;
    label: string;
    defaultExerciseId: string;
  }> = [
    { category: 'chest', label: 'Pecho', defaultExerciseId: 'press_plano' },
    { category: 'legs', label: 'Piernas', defaultExerciseId: 'prensa_inclinada' },
    { category: 'back', label: 'Espalda', defaultExerciseId: 'jalon_pecho' },
  ];

  // Rutinas canónicas de respaldo para encontrar logs de ejercicios fuera del split activo (ej. RDL, Hip Thrust, Dominadas en modo 3d o Mariposa en modo 2d)
  const canonicalFallbackDays = [
    ...buildDefaultSplitRoutine(5),
    ...buildDefaultSplitRoutine(2),
  ];

  return categories.map(({ category, label, defaultExerciseId }) => {
    const explicitPreferredId = preferredExerciseIds?.[category];
    let targetExId = explicitPreferredId || defaultExerciseId;

    // 1. Buscar TODOS los slots en la rutina activa que correspondan a targetExId (soporta frecuencia 2 en 4d/5d)
    let matchedSlots: Array<{ day: ConfiguredDayRoutine; slot: ConfiguredExerciseSlot }> = [];

    for (const day of routineDays) {
      for (const slot of day.exercises) {
        if (slot.libraryExerciseId === targetExId && slot.muscleGroup === category) {
          matchedSlots.push({ day, slot });
        }
      }
    }

    // 2. Si no está en la rutina activa y el usuario NO forzó un ejercicio específico, usar el primer ejercicio de esa categoría en routineDays
    if (matchedSlots.length === 0 && !explicitPreferredId) {
      let fallbackCategoryExId: string | undefined;
      for (const day of routineDays) {
        for (const slot of day.exercises) {
          if (slot.muscleGroup === category) {
            if (!fallbackCategoryExId) {
              fallbackCategoryExId = slot.libraryExerciseId;
              targetExId = fallbackCategoryExId;
            }
            if (slot.libraryExerciseId === fallbackCategoryExId) {
              matchedSlots.push({ day, slot });
            }
          }
        }
      }
    }

    // 3. Si el usuario eligió un ejercicio del catálogo que no está en los días activos, buscar su slot en los días canónicos para extraer su PR histórico
    if (matchedSlots.length === 0) {
      for (const day of canonicalFallbackDays) {
        for (const slot of day.exercises) {
          if (slot.libraryExerciseId === targetExId && slot.muscleGroup === category) {
            matchedSlots.push({ day, slot });
          }
        }
      }
    }

    const fallbackLib = getLibraryExerciseById(targetExId);
    const primaryMatch = matchedSlots[0];
    const exerciseId = primaryMatch?.slot.libraryExerciseId ?? fallbackLib.id;
    const exerciseName = primaryMatch?.slot.customName ?? fallbackLib.name;
    const incrementKg = primaryMatch?.slot.weightIncrementKg ?? fallbackLib.defaultWeightIncrementKg;
    const repRange = primaryMatch?.slot.repRange ?? fallbackLib.defaultRepRange;

    let bestWeightKg = 0;
    let repsAtMaxWeight = 0;
    let estimated1RMKg = 0;
    let bestSessionVolumeKg = 0;
    let achievedWeekLabel = 'Sin registro';
    let pulleyNote: string | undefined;
    let firstWeekMaxWeight = 0;

    for (const week of weeks) {
      for (const { day, slot } of matchedSlots) {
        const entries = safeParseLog(week.logsByDayId[day.dayId]);
        for (const entry of entries) {
          if (entry.code !== slot.code) continue;
          if (entry.isSkipped || entry.sets.length === 0) continue;

          if (firstWeekMaxWeight === 0 && entry.maxWeightKg > 0) {
            firstWeekMaxWeight = entry.maxWeightKg;
          }

          if (entry.totalVolumeKg > bestSessionVolumeKg) {
            bestSessionVolumeKg = entry.totalVolumeKg;
          }
          if (entry.bestEstimated1RM > estimated1RMKg) {
            estimated1RMKg = entry.bestEstimated1RM;
          }

          const topSets = entry.sets.filter((s) => s.weightKg === entry.maxWeightKg);
          const bestRepsForThisEntry =
            topSets.length > 0 ? Math.max(...topSets.map((s) => s.reps)) : 0;

          if (
            entry.maxWeightKg > bestWeightKg ||
            (entry.maxWeightKg === bestWeightKg && bestRepsForThisEntry > repsAtMaxWeight)
          ) {
            bestWeightKg = entry.maxWeightKg;
            repsAtMaxWeight = bestRepsForThisEntry;
            achievedWeekLabel = week.weekLabel;
            if (entry.pulleyType === 'double') {
              pulleyNote = 'Doble Polea';
            } else if (entry.pulleyType === 'single') {
              pulleyNote = 'Polea Simple';
            }
          }
        }
      }
    }

    const nextWeightTarget = round2(bestWeightKg + incrementKg);
    const nextRepTarget = Math.min(repRange[1], repsAtMaxWeight + 1);
    const nextTargetChallenge =
      bestWeightKg > 0
        ? repsAtMaxWeight >= repRange[1]
          ? `¡Tope de ${repRange[1]} reps logrado! Superar subiendo a ${nextWeightTarget}kg × ${repRange[0]} reps`
          : `Superar haciendo ${bestWeightKg}kg × ${nextRepTarget} reps o tentar ${nextWeightTarget}kg`
        : `Registrar primera marca base (${repRange[0]}-${repRange[1]} reps)`;

    const cycleDeltaPercent =
      firstWeekMaxWeight > 0 && bestWeightKg > 0
        ? calculateDeltaPercent(bestWeightKg, firstWeekMaxWeight)
        : 0;

    return {
      category,
      categoryLabel: label,
      emoji: '🏆',
      exerciseId,
      exerciseName,
      maxWeightKg: bestWeightKg,
      repsAtMaxWeight,
      bestSetFormatted:
        bestWeightKg > 0 ? `${bestWeightKg}kg × ${repsAtMaxWeight} reps` : 'Sin series aún',
      estimated1RMKg,
      bestSessionVolumeKg,
      achievedWeekLabel,
      pulleyNote,
      nextTargetChallenge,
      cycleDeltaPercent,
    };
  });
}

/**
 * Calcula los 4 bloques analíticos del Dashboard Semanal (ventana móvil de 4 semanas):
 * 1. Gráfico de barras de Volumen Semanal Total en kg
 * 2. Tabla comparativa de Carga por Día y estado de la semana
 * 3. Tabla de Volumen por Grupo Muscular con cálculo de tendencia porcentual Δ% entre semanas
 * 4. Tabla de Evolución de Cargas Pico y 1RM Estimado en los ejercicios principales con Δ% del ciclo
 */
export function computeWeeklyDashboardSummary(
  weeksInput: WeekLogSnapshot[],
  routineDays: ConfiguredDayRoutine[]
): WeeklyDashboardSummary {
  const windowWeeks = weeksInput.slice(-4);
  const allMuscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];

  // Estructura intermedia por semana
  const weeklyTotals: Array<{
    weekNumber: number;
    weekLabel: string;
    weekState: WeekLogSnapshot['weekState'];
    totalVolumeKg: number;
    totalSets: number;
    totalReps: number;
    deltaVsPrevWeekPercent: number | null;
  }> = [];

  const dayVolumeMatrix: Record<string, { volumes: number[]; sets: number[] }> = {};
  for (const day of routineDays) {
    dayVolumeMatrix[day.dayId] = { volumes: [], sets: [] };
  }

  const muscleMatrix: Record<MuscleGroup, { volumes: number[]; sets: number[] }> = {
    chest: { volumes: [], sets: [] },
    back: { volumes: [], sets: [] },
    shoulders: { volumes: [], sets: [] },
    arms: { volumes: [], sets: [] },
    legs: { volumes: [], sets: [] },
    core: { volumes: [], sets: [] },
  };

  // Identificar los ejercicios principales (E1 y E2 de cada día configurado)
  const keySlots: Array<{
    slotKey: string;
    dayId: ConfiguredDayRoutine['dayId'];
    code: ConfiguredExerciseSlot['code'];
    exerciseName: string;
    muscleGroup: MuscleGroup;
  }> = [];

  for (const day of routineDays) {
    for (const slot of day.exercises) {
      if (slot.code === 'E1' || slot.code === 'E2') {
        keySlots.push({
          slotKey: `${day.dayId}:${slot.code}`,
          dayId: day.dayId,
          code: slot.code,
          exerciseName: `${slot.customName} (D${day.dayNumber})`,
          muscleGroup: slot.muscleGroup,
        });
      }
    }
  }

  const keyProgressionMatrix: Record<
    string,
    { peakWeights: number[]; best1RMs: number[] }
  > = {};
  for (const ks of keySlots) {
    keyProgressionMatrix[ks.slotKey] = { peakWeights: [], best1RMs: [] };
  }

  for (let wIdx = 0; wIdx < windowWeeks.length; wIdx++) {
    const week = windowWeeks[wIdx];
    let weekVolumeKg = 0;
    let weekSets = 0;
    let weekReps = 0;

    const weekMuscleVol: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      arms: 0,
      legs: 0,
      core: 0,
    };
    const weekMuscleSets: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      arms: 0,
      legs: 0,
      core: 0,
    };

    const parsedByDay: Record<string, ParsedExerciseEntry[]> = {};

    for (const day of routineDays) {
      const entries = safeParseLog(week.logsByDayId[day.dayId]);
      parsedByDay[day.dayId] = entries;

      let dayVol = 0;
      let daySets = 0;

      for (const entry of entries) {
        if (entry.isSkipped) continue;
        const validSetsCount = entry.sets.filter((s) => s.reps > 0).length;
        dayVol = round2(dayVol + entry.totalVolumeKg);
        daySets += validSetsCount;
        weekReps += entry.totalReps;

        const configuredSlot = day.exercises.find((s) => s.code === entry.code);
        const group: MuscleGroup = configuredSlot ? configuredSlot.muscleGroup : 'core';
        weekMuscleVol[group] = round2(weekMuscleVol[group] + entry.totalVolumeKg);
        weekMuscleSets[group] += validSetsCount;
      }

      dayVolumeMatrix[day.dayId].volumes.push(dayVol);
      dayVolumeMatrix[day.dayId].sets.push(daySets);

      weekVolumeKg = round2(weekVolumeKg + dayVol);
      weekSets += daySets;
    }

    for (const group of allMuscleGroups) {
      muscleMatrix[group].volumes.push(weekMuscleVol[group]);
      muscleMatrix[group].sets.push(weekMuscleSets[group]);
    }

    for (const ks of keySlots) {
      const entries = parsedByDay[ks.dayId] ?? [];
      const matching = entries.find((e) => e.code === ks.code && !e.isSkipped);
      keyProgressionMatrix[ks.slotKey].peakWeights.push(matching ? matching.maxWeightKg : 0);
      keyProgressionMatrix[ks.slotKey].best1RMs.push(matching ? matching.bestEstimated1RM : 0);
    }

    const prevWeekVol = wIdx > 0 ? weeklyTotals[wIdx - 1].totalVolumeKg : null;
    const deltaVsPrev =
      prevWeekVol !== null && prevWeekVol > 0
        ? calculateDeltaPercent(weekVolumeKg, prevWeekVol)
        : null;

    weeklyTotals.push({
      weekNumber: week.weekNumber,
      weekLabel: week.weekLabel,
      weekState: week.weekState,
      totalVolumeKg: weekVolumeKg,
      totalSets: weekSets,
      totalReps: weekReps,
      deltaVsPrevWeekPercent: deltaVsPrev,
    });
  }

  const lastWeekIsFullDeload =
    windowWeeks.length > 0 && windowWeeks[windowWeeks.length - 1].weekState === 'full_deload';

  const dayLoadComparison = routineDays.map((day) => {
    const vols = dayVolumeMatrix[day.dayId].volumes;
    const sets = dayVolumeMatrix[day.dayId].sets;
    const firstNonZero = vols.find((v) => v > 0) ?? 0;
    const rawLastVol = vols[vols.length - 1] ?? 0;
    const effectiveLastVol =
      rawLastVol > 0 || lastWeekIsFullDeload
        ? rawLastVol
        : ([...vols].reverse().find((v) => v > 0) ?? 0);
    return {
      dayId: day.dayId,
      dayTitle: day.title,
      volumesByWeek: vols,
      setsByWeek: sets,
      deltaCyclePercent:
        firstNonZero > 0 ? calculateDeltaPercent(effectiveLastVol, firstNonZero) : 0,
    };
  });

  const muscleVolumeTrends = allMuscleGroups.map((group) => {
    const vols = muscleMatrix[group].volumes;
    const sets = muscleMatrix[group].sets;
    const rawLastVol = vols[vols.length - 1] ?? 0;
    const effectiveLastVol =
      rawLastVol > 0 || lastWeekIsFullDeload
        ? rawLastVol
        : ([...vols].reverse().find((v) => v > 0) ?? 0);
    const prevVol = vols.length >= 2 ? vols[vols.length - 2] : effectiveLastVol;
    const firstNonZero = vols.find((v) => v > 0) ?? 0;
    return {
      muscleGroup: group,
      label: MUSCLE_GROUP_LABELS[group],
      volumesByWeek: vols,
      setsByWeek: sets,
      deltaLastWeekPercent: prevVol > 0 ? calculateDeltaPercent(rawLastVol, prevVol) : 0,
      deltaCyclePercent:
        firstNonZero > 0 ? calculateDeltaPercent(effectiveLastVol, firstNonZero) : 0,
    };
  });

  const keyExerciseProgression = keySlots.map((ks) => {
    const weights = keyProgressionMatrix[ks.slotKey].peakWeights;
    const oneRMs = keyProgressionMatrix[ks.slotKey].best1RMs;
    const firstWeight = weights.find((w) => w > 0) ?? 0;
    const lastWeight = [...weights].reverse().find((w) => w > 0) ?? 0;
    const first1RM = oneRMs.find((r) => r > 0) ?? 0;
    const last1RM = [...oneRMs].reverse().find((r) => r > 0) ?? 0;

    return {
      slotKey: ks.slotKey,
      exerciseName: ks.exerciseName,
      muscleGroup: ks.muscleGroup,
      peakWeightByWeek: weights,
      estimated1RMByWeek: oneRMs,
      weightDeltaPercent: firstWeight > 0 ? calculateDeltaPercent(lastWeight, firstWeight) : 0,
      oneRmDeltaPercent: first1RM > 0 ? calculateDeltaPercent(last1RM, first1RM) : 0,
    };
  });

  return {
    weeks: weeklyTotals,
    dayLoadComparison,
    muscleVolumeTrends,
    keyExerciseProgression,
  };
}
