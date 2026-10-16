import { EXERCISE_CATALOG, MUSCLE_GROUP_LABELS } from '../data/exerciseCatalog.ts';
import type {
  DailyNutritionAnalysis,
  DailyNutritionInput,
  DayType,
  EnergyPhaseClassification,
  MuscleGroup,
  ParsedExerciseEntry,
} from '../types/workout.ts';

export const DEFAULT_BASE_WEIGHT_KG = 70.5;
export const DEFAULT_BASE_BMR_KCAL = 1650;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Volumen de una serie = Peso (kg) * Repeticiones
 */
export function calculateSetVolume(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return round2(weightKg * reps);
}

/**
 * 1RM Estimado (Fórmula de Epley): Peso * (1 + Reps / 30)
 */
export function calculateEpley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return round2(weightKg * (1 + reps / 30));
}

export interface MuscleDistributionItem {
  muscleGroup: MuscleGroup;
  label: string;
  volumeKg: number;
  setsCount: number;
  volumePercentage: number;
  setsPercentage: number;
}

/**
 * Calcula la distribución de volumen y series en los 6 grupos musculares.
 */
export function calculateMuscleDistribution(
  entries: Array<{ entry: ParsedExerciseEntry; dayType: DayType }>
): MuscleDistributionItem[] {
  const allGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
  const totals: Record<MuscleGroup, { volumeKg: number; setsCount: number }> = {
    chest: { volumeKg: 0, setsCount: 0 },
    back: { volumeKg: 0, setsCount: 0 },
    shoulders: { volumeKg: 0, setsCount: 0 },
    arms: { volumeKg: 0, setsCount: 0 },
    legs: { volumeKg: 0, setsCount: 0 },
    core: { volumeKg: 0, setsCount: 0 },
  };

  let grandTotalVolume = 0;
  let grandTotalSets = 0;

  for (const { entry, dayType } of entries) {
    if (entry.isSkipped) continue;
    const catalogItem = EXERCISE_CATALOG[dayType]?.[entry.code];
    const group: MuscleGroup = catalogItem ? catalogItem.muscleGroup : 'core';
    const validSets = entry.sets.filter((s) => s.reps > 0);
    totals[group].volumeKg = round2(totals[group].volumeKg + entry.totalVolumeKg);
    totals[group].setsCount += validSets.length;
    grandTotalVolume = round2(grandTotalVolume + entry.totalVolumeKg);
    grandTotalSets += validSets.length;
  }

  return allGroups.map((group) => {
    const { volumeKg, setsCount } = totals[group];
    return {
      muscleGroup: group,
      label: MUSCLE_GROUP_LABELS[group],
      volumeKg,
      setsCount,
      volumePercentage: grandTotalVolume > 0 ? round2((volumeKg / grandTotalVolume) * 100) : 0,
      setsPercentage: grandTotalSets > 0 ? round2((setsCount / grandTotalSets) * 100) : 0,
    };
  });
}

/**
 * Analiza la nutrición diaria + actividad de Samsung Health:
 * TDEE = BMR (1650 kcal) + Kcal activas del reloj
 * Ratio proteína/kg sobre peso base (70.5 kg)
 */
export function analyzeDailyNutrition(input: DailyNutritionInput): DailyNutritionAnalysis {
  const baseWeightKg = input.baseWeightKg && input.baseWeightKg > 0 ? input.baseWeightKg : DEFAULT_BASE_WEIGHT_KG;
  const baseBmrKcal = input.baseBmrKcal && input.baseBmrKcal > 0 ? input.baseBmrKcal : DEFAULT_BASE_BMR_KCAL;

  const tdeeKcal = round2(baseBmrKcal + Math.max(0, input.activeBurnedKcal));
  const energyBalanceKcal = round2(input.caloriesConsumed - tdeeKcal);
  const proteinPerKg = round2(input.proteinG / baseWeightKg);
  const isProteinOptimal = proteinPerKg >= 1.8 && proteinPerKg <= 2.6;

  let classification: EnergyPhaseClassification;
  let classificationLabel: string;

  if (energyBalanceKcal < -500) {
    classification = 'aggressive_deficit';
    classificationLabel = 'Déficit Agresivo';
  } else if (energyBalanceKcal <= -150) {
    classification = 'clean_deficit';
    classificationLabel = 'Déficit Limpio';
  } else if (energyBalanceKcal <= 100) {
    classification = 'maintenance';
    classificationLabel = 'Mantenimiento Normocalórico';
  } else if (energyBalanceKcal <= 450) {
    classification = 'glycogen_refeed';
    classificationLabel = 'Refeed de Glucógeno';
  } else {
    classification = 'high_surplus';
    classificationLabel = 'Superávit Alto';
  }

  const sign = energyBalanceKcal > 0 ? '+' : '';
  const summaryMessage = `TDEE: ${tdeeKcal} kcal | Balance: ${sign}${energyBalanceKcal} kcal (${classificationLabel}) | Proteína: ${proteinPerKg} g/kg (${isProteinOptimal ? 'Óptimo' : 'Revisar rango 1.8-2.6 g/kg'})`;

  return {
    tdeeKcal,
    energyBalanceKcal,
    proteinPerKg,
    isProteinOptimal,
    classification,
    classificationLabel,
    summaryMessage,
  };
}
