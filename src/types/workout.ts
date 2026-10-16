export type DayType = 'push' | 'legs' | 'pull';

export type ExerciseCode = 'E0' | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6';

export type MuscleGroup =
  | 'chest'      // Pecho
  | 'back'       // Espalda
  | 'shoulders'  // Hombros
  | 'arms'       // Brazos (Bíceps / Tríceps)
  | 'legs'       // Piernas (Cuádriceps / Isquios / Gemelos / Aductores)
  | 'core';      // Core / Abdominales / Lumbares

export type WeekState =
  | 'accumulation'   // Acumulación / Sobrecarga Progresiva
  | 'active_deload'  // Descarga Activa (-30~40% volumen o -10% carga)
  | 'full_deload'    // Descarga Total (Descanso / Movilidad)
  | 'reactivation';  // Reactivación (Retorno post-descarga al ~92.5% o consolidación)

export type PulleyType = 'single' | 'double' | 'standard';

export interface ExerciseCatalogItem {
  dayType: DayType;
  code: ExerciseCode;
  defaultName: string;
  allowedVariants?: string[];
  muscleGroup: MuscleGroup;
  targetSets: number;
  repRange: [number, number];
  weightIncrementKg: number;
  isOptional?: boolean;
  supportsDropSet?: boolean;
  supportsPulleySelector?: boolean;
}

export interface ExerciseSet {
  setOrder: number;
  weightKg: number;
  reps: number;
  volumeKg: number;
  estimated1RM: number;
  isDropSetStep?: boolean;
}

export interface ParsedExerciseEntry {
  code: ExerciseCode;
  rawInput: string;
  isSkipped: boolean;
  customVariantName?: string;
  isSubstituted: boolean;
  isPerSideWeight: boolean;
  enteredWeightPerSideKg?: number;
  pulleyType: PulleyType;
  isDropSet: boolean;
  sets: ExerciseSet[];
  totalVolumeKg: number;
  totalReps: number;
  maxWeightKg: number;
  bestEstimated1RM: number;
}

export type PRType = 'max_weight' | 'max_volume' | 'max_1rm';

export interface PRBadge {
  type: PRType;
  label: string;
  previousValue: number;
  newValue: number;
  deltaPercent: number;
}

export type ProgressionAction =
  | 'increase_weight'
  | 'increase_reps'
  | 'consolidate_weight'
  | 'deload_active'
  | 'deload_full'
  | 'reactivate'
  | 'baseline';

export interface ExerciseRoadmapRecommendation {
  code: ExerciseCode;
  exerciseName: string;
  weekState: WeekState;
  action: ProgressionAction;
  recommendedWeightKg: number;
  recommendedSets: number;
  recommendedRepsTarget: string;
  coachMessage: string;
  previousSessionSummary?: string;
  pulleyType: PulleyType;
}

export interface DailyNutritionInput {
  date: string;
  caloriesConsumed: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  steps: number;
  activeMinutes: number;
  activeBurnedKcal: number;
  baseWeightKg?: number;
  baseBmrKcal?: number;
}

export type EnergyPhaseClassification =
  | 'clean_deficit'      // Déficit Limpio
  | 'glycogen_refeed'    // Refeed de Glucógeno / Superávit controlado
  | 'maintenance'        // Mantenimiento
  | 'aggressive_deficit' // Déficit Agresivo
  | 'high_surplus';      // Superávit Alto

export interface DailyNutritionAnalysis {
  tdeeKcal: number;
  energyBalanceKcal: number;
  proteinPerKg: number;
  isProteinOptimal: boolean;
  classification: EnergyPhaseClassification;
  classificationLabel: string;
  summaryMessage: string;
}

export type GymDaysCount = 2 | 3 | 4 | 5;

export type ExtendedDayId = 'push' | 'legs' | 'pull' | 'day4' | 'day5' | 'upper' | 'lower';

export type VisualMovementPattern =
  | 'russian_twist'
  | 'bench_press'
  | 'incline_press'
  | 'pec_deck'
  | 'rear_delt_fly'
  | 'overhead_press'
  | 'skullcrusher'
  | 'tricep_pushdown'
  | 'leg_press'
  | 'leg_extension'
  | 'leg_curl'
  | 'calf_raise'
  | 'hip_adduction'
  | 'lat_pulldown'
  | 'seated_row'
  | 'back_extension'
  | 'lateral_raise'
  | 'incline_curl'
  | 'cable_curl'
  | 'romanian_deadlift'
  | 'hip_thrust';

export interface GymLibraryExercise {
  id: string;
  name: string;
  aliases: string[];
  muscleGroup: MuscleGroup;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  movementPattern: VisualMovementPattern;
  defaultSets: number;
  defaultRepRange: [number, number];
  defaultWeightIncrementKg: number;
  supportsDropSet?: boolean;
  supportsPulleySelector?: boolean;
  isBaseExercise: boolean;
  baseOriginLabel?: string;
  executionSteps: [string, string, string];
  commonMistake: string;
  freeExerciseDbFolder: string;
  freeExerciseDbUrls: [string, string];
}

export interface ConfiguredExerciseSlot {
  code: ExerciseCode;
  libraryExerciseId: string;
  customName: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  repRange: [number, number];
  weightIncrementKg: number;
  isOptional?: boolean;
  supportsDropSet?: boolean;
  supportsPulleySelector?: boolean;
}

export interface ConfiguredDayRoutine {
  dayId: ExtendedDayId;
  dayNumber: number;
  baseDayType: DayType;
  title: string;
  subtitle: string;
  exercises: ConfiguredExerciseSlot[];
}

export type HeroPRCategory = 'chest' | 'legs' | 'back';

export interface HeroPRCardData {
  category: HeroPRCategory;
  categoryLabel: string;
  emoji: string;
  exerciseId: string;
  exerciseName: string;
  maxWeightKg: number;
  repsAtMaxWeight: number;
  bestSetFormatted: string;
  estimated1RMKg: number;
  bestSessionVolumeKg: number;
  achievedWeekLabel: string;
  pulleyNote?: string;
  nextTargetChallenge: string;
  cycleDeltaPercent: number;
}

export interface WeekLogSnapshot {
  weekNumber: number;
  weekLabel: string;
  weekState: WeekState;
  logsByDayId: Partial<Record<ExtendedDayId, string>>;
}

export interface WeeklyDashboardSummary {
  weeks: Array<{
    weekNumber: number;
    weekLabel: string;
    weekState: WeekState;
    totalVolumeKg: number;
    totalSets: number;
    totalReps: number;
    deltaVsPrevWeekPercent: number | null;
  }>;
  dayLoadComparison: Array<{
    dayId: ExtendedDayId;
    dayTitle: string;
    volumesByWeek: number[];
    setsByWeek: number[];
    deltaCyclePercent: number;
  }>;
  muscleVolumeTrends: Array<{
    muscleGroup: MuscleGroup;
    label: string;
    volumesByWeek: number[];
    setsByWeek: number[];
    deltaLastWeekPercent: number;
    deltaCyclePercent: number;
  }>;
  keyExerciseProgression: Array<{
    slotKey: string;
    exerciseName: string;
    muscleGroup: MuscleGroup;
    peakWeightByWeek: number[];
    estimated1RMByWeek: number[];
    weightDeltaPercent: number;
    oneRmDeltaPercent: number;
  }>;
}

