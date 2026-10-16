import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  AwardIcon,
  BarChartIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  DumbbellIcon,
  EyeIcon,
  FlameIcon,
  FootprintsIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  TrophyIcon,
  UtensilsIcon,
  ZapIcon,
} from './components/FitnessIcons.tsx';
import { ExerciseKinematicSvg, ExerciseVisualModal } from './components/ExerciseVisualModal.tsx';
import { RoutineConfigurator } from './components/RoutineConfigurator.tsx';
import { WeeklyDashboardView } from './components/WeeklyDashboardView.tsx';
import { analyzeDailyNutrition, calculateEpley1RM } from './core/metrics.ts';
import { parseWorkoutLog } from './core/nlpParser.ts';
import { detectPersonalRecords, generateConfiguredDayRoadmap } from './core/progressionEngine.ts';
import {
  INITIAL_4WEEK_SNAPSHOTS,
  computeHeroBig3PRs,
  computeWeeklyDashboardSummary,
  safeParseLog,
} from './core/weeklyDashboard.ts';
import { MUSCLE_GROUP_LABELS } from './data/exerciseCatalog.ts';
import {
  GYM_EXERCISE_LIBRARY,
  OPEN_EXERCISE_SOURCES,
  buildDefaultSplitRoutine,
  findLibraryExerciseByNameOrCode,
  getLibraryExerciseById,
} from './data/gymExerciseLibrary.ts';
import type {
  ConfiguredDayRoutine,
  ConfiguredExerciseSlot,
  ExerciseCode,
  ExtendedDayId,
  GymDaysCount,
  GymLibraryExercise,
  HeroPRCategory,
  WeekLogSnapshot,
  WeekState,
} from './types/workout.ts';

type MainViewTab =
  | 'home_dashboard'
  | 'workout_session'
  | 'hero_prs'
  | 'routine_config'
  | 'visual_library';

const STORAGE_KEY = 'hypertrophy_tracker_state_v1';

interface PersistedAppState {
  daysCount: GymDaysCount;
  routineDays: ConfiguredDayRoutine[];
  weeksData: WeekLogSnapshot[];
  preferredPRIds: Record<HeroPRCategory, string>;
}

function loadPersistedState(): Partial<PersistedAppState> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedAppState>;
  } catch {
    return {};
  }
}

export default function App() {
  const initialSaved = useMemo(() => loadPersistedState(), []);

  // 1. Cantidad de días configurados (2, 3, 4 o 5 días) + Rutina activa
  const [daysCount, setDaysCount] = useState<GymDaysCount>(() => initialSaved.daysCount ?? 3);
  const [routineDays, setRoutineDays] = useState<ConfiguredDayRoutine[]>(
    () => initialSaved.routineDays ?? buildDefaultSplitRoutine(initialSaved.daysCount ?? 3)
  );
  const [activeDayId, setActiveDayId] = useState<ExtendedDayId>(
    () => initialSaved.routineDays?.[0]?.dayId ?? 'push'
  );

  // 2. Ventana móvil de 4 semanas (Mesociclo)
  const [weeksData, setWeeksData] = useState<WeekLogSnapshot[]>(
    () => initialSaved.weeksData ?? INITIAL_4WEEK_SNAPSHOTS
  );
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(() =>
    Math.max(0, (initialSaved.weeksData ?? INITIAL_4WEEK_SNAPSHOTS).length - 1)
  );

  // 3. Selección de ejercicio favorito para cada una de las 3 tarjetas de PR (Pecho, Piernas, Espalda)
  const [preferredPRIds, setPreferredPRIds] = useState<Record<HeroPRCategory, string>>(
    () =>
      initialSaved.preferredPRIds ?? {
        chest: 'press_plano',
        legs: 'prensa_inclinada',
        back: 'jalon_pecho',
      }
  );

  // 4. Pestaña activa y modal de demostración gráfica
  const [activeTab, setActiveTab] = useState<MainViewTab>('home_dashboard');
  const [inspectedExercise, setInspectedExercise] = useState<GymLibraryExercise | null>(null);
  const [libraryFilterGroup, setLibraryFilterGroup] = useState<string>('all');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload: PersistedAppState = {
          daysCount,
          routineDays,
          weeksData,
          preferredPRIds,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Ignorar errores de cuota en modo privado
    }
  }, [daysCount, routineDays, weeksData, preferredPRIds]);

  const handleDaysCountChange = (newCount: GymDaysCount) => {
    setDaysCount(newCount);
    const nextRoutine = buildDefaultSplitRoutine(newCount);
    setRoutineDays(nextRoutine);
    if (!nextRoutine.some((d) => d.dayId === activeDayId)) {
      setActiveDayId(nextRoutine[0].dayId);
    }
  };

  const handleUpdateSlot = (
    dayIndex: number,
    code: ExerciseCode,
    updatedSlot: ConfiguredExerciseSlot
  ) => {
    setRoutineDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((s) => (s.code === code ? updatedSlot : s)),
            }
          : day
      )
    );
  };

  const handleResetToBaseDefaults = () => {
    setRoutineDays(buildDefaultSplitRoutine(daysCount));
  };

  const currentWeek = weeksData[selectedWeekIdx] ?? weeksData[weeksData.length - 1];
  const previousWeek =
    selectedWeekIdx > 0 ? weeksData[selectedWeekIdx - 1] : undefined;

  const activeDayRoutine =
    routineDays.find((d) => d.dayId === activeDayId) ?? routineDays[0];

  const rawInputForActiveDay = currentWeek.logsByDayId[activeDayRoutine.dayId] ?? '';

  const handleRawInputChange = (value: string) => {
    setWeeksData((prev) =>
      prev.map((w, idx) =>
        idx === selectedWeekIdx
          ? {
              ...w,
              logsByDayId: {
                ...w.logsByDayId,
                [activeDayRoutine.dayId]: value,
              },
            }
          : w
      )
    );
  };

  const handleWeekStateChange = (newState: WeekState) => {
    setWeeksData((prev) =>
      prev.map((w, idx) => (idx === selectedWeekIdx ? { ...w, weekState: newState } : w))
    );
  };

  // Cálculo en tiempo real de los 3 PRs Insignia (1 Pecho, 1 Piernas, 1 Espalda)
  const heroBig3PRs = useMemo(
    () => computeHeroBig3PRs(weeksData, routineDays, preferredPRIds),
    [weeksData, routineDays, preferredPRIds]
  );

  // Cálculo en tiempo real del Dashboard Semanal (ventana móvil de 4 semanas)
  const weeklyDashboard = useMemo(
    () => computeWeeklyDashboardSummary(weeksData, routineDays),
    [weeksData, routineDays]
  );

  // Entradas de la sesión inmediata anterior para la Hoja de Ruta (Doble Progresión)
  const previousDayEntries = useMemo(() => {
    const rawPrev = previousWeek?.logsByDayId[activeDayRoutine.dayId] ?? '';
    return safeParseLog(rawPrev);
  }, [previousWeek, activeDayRoutine.dayId]);

  // Historial acumulado de todas las semanas previas para el Detector de Récords (🏆)
  const historicalDayEntries = useMemo(() => {
    const priorWeeks = weeksData.slice(0, selectedWeekIdx);
    return priorWeeks.flatMap((w) => safeParseLog(w.logsByDayId[activeDayRoutine.dayId]));
  }, [weeksData, selectedWeekIdx, activeDayRoutine.dayId]);

  // Hoja de Ruta adaptada al día configurado
  const roadmap = useMemo(
    () =>
      generateConfiguredDayRoadmap(
        activeDayRoutine,
        currentWeek.weekState,
        previousDayEntries
      ),
    [activeDayRoutine, currentWeek.weekState, previousDayEntries]
  );

  // Parseo en vivo de la sesión actual
  const parsedCurrent = useMemo(() => {
    try {
      return { entries: parseWorkoutLog(rawInputForActiveDay), error: null };
    } catch (err) {
      return {
        entries: safeParseLog(rawInputForActiveDay),
        error: err instanceof Error ? err.message : 'Error de formato',
      };
    }
  }, [rawInputForActiveDay]);

  // Historial completo de todos los récords personales (🏆) batidos a lo largo de las 4 semanas para el Salón de la Fama
  const allHistoricalPRs = useMemo(() => {
    const recordsList: Array<{
      id: string;
      weekLabel: string;
      dayTitle: string;
      exerciseCode: string;
      exerciseName: string;
      prType: string;
      label: string;
      newValue: number;
      previousValue: number;
      deltaPercent: number;
    }> = [];

    for (let wIdx = 0; wIdx < weeksData.length; wIdx++) {
      const week = weeksData[wIdx];
      const priorWeeks = weeksData.slice(0, wIdx);

      for (const day of routineDays) {
        const currentEntries = safeParseLog(week.logsByDayId[day.dayId] ?? '');
        const historicalEntries = priorWeeks.flatMap((w) =>
          safeParseLog(w.logsByDayId[day.dayId] ?? '')
        );

        for (const entry of currentEntries) {
          const prs = detectPersonalRecords(entry, historicalEntries);
          const slot = day.exercises.find((s) => s.code === entry.code);
          const name = entry.customVariantName || slot?.customName || entry.code;

          for (const pr of prs) {
            recordsList.push({
              id: `${week.weekNumber}-${day.dayId}-${entry.code}-${pr.type}`,
              weekLabel: week.weekLabel,
              dayTitle: day.title,
              exerciseCode: entry.code,
              exerciseName: name,
              prType: pr.type,
              label: pr.label,
              newValue: pr.newValue,
              previousValue: pr.previousValue,
              deltaPercent: pr.deltaPercent,
            });
          }
        }
      }
    }
    return recordsList;
  }, [weeksData, routineDays]);

  const sampleNutrition = useMemo(
    () =>
      analyzeDailyNutrition({
        date: new Date().toISOString().slice(0, 10),
        caloriesConsumed: 2450,
        proteinG: 165,
        carbsG: 280,
        fatG: 62,
        steps: 12450,
        activeMinutes: 75,
        activeBurnedKcal: 1150,
      }),
    []
  );

  const filteredLibraryExercises = useMemo(() => {
    if (libraryFilterGroup === 'all') return GYM_EXERCISE_LIBRARY;
    return GYM_EXERCISE_LIBRARY.filter((ex) => ex.muscleGroup === libraryFilterGroup);
  }, [libraryFilterGroup]);

  // Quick insertion helpers for NLP textarea
  const handleQuickInsert = (snippet: string) => {
    const separator = rawInputForActiveDay.trim().length > 0 ? '\n' : '';
    handleRawInputChange(`${rawInputForActiveDay}${separator}${snippet}`);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/30 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,16px))] md:pb-12">
        {/* CABECERA ATHLETIC FITNESS APP + QUICK SPLIT SELECTOR */}
        <header className="fitness-card rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-emerald-500/25 shrink-0">
              <DumbbellIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>OVERLOAD</span>
                  <span className="text-emerald-400 font-extrabold text-sm tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    PRO
                  </span>
                </h1>
                <span className="text-[11px] font-bold text-zinc-400 hidden sm:inline">
                  • Atleta 70.5kg
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Hipertrofia & Sobrecarga Progresiva</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-300 font-semibold">{currentWeek.weekLabel}</span>
              </p>
            </div>
          </div>

          {/* Quick Frequency Selector (2, 3, 4, 5 Días) */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-1.5">
            <span className="text-xs font-bold text-zinc-400 px-2.5">
              Frecuencia:
            </span>
            <div className="flex gap-1">
              {([2, 3, 4, 5] as GymDaysCount[]).map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => handleDaysCountChange(cnt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    daysCount === cnt
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`}
                >
                  {cnt}D
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* NAVEGACIÓN DESKTOP SUPERIOR (COMPLEMENTA A LA BOTTOM NAV) */}
        <nav className="hidden md:flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          {(
            [
              ['home_dashboard', '📊 Dashboard Semanal', BarChartIcon],
              ['workout_session', '⚡ Entrenar Hoy', FlameIcon],
              ['hero_prs', '🏆 Récords PR (Big 3)', TrophyIcon],
              ['routine_config', `⚙️ Rutina (${daysCount}d)`, CalendarIcon],
              ['visual_library', '🏋️ Biblioteca Gráfica', BookOpenIcon],
            ] as Array<[MainViewTab, string, typeof BarChartIcon]>
          ).map(([tabId, label, IconComponent]) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                activeTab === tabId
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900/60 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <IconComponent size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* =========================================================================
            VISTA 1: DASHBOARD SEMANAL Y HOME (PANEL EJECUTIVO DEL ATLETA)
           ========================================================================= */}
        {activeTab === 'home_dashboard' && (
          <section className="space-y-6">
            {/* Tarjeta de Acción Rápida: Sesión sugerida de hoy */}
            <div className="fitness-card-volt rounded-2xl md:rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <FlameIcon size={12} />
                    <span>Tu Sesión de Hoy</span>
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {activeDayRoutine.dayNumber} de {daysCount}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-zinc-100 tracking-tight">
                  {activeDayRoutine.title}
                </h2>
                <p className="text-xs text-zinc-300">
                  {activeDayRoutine.subtitle} • {activeDayRoutine.exercises.length} ejercicios con Doble Progresión
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('workout_session');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs md:text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <span>Comenzar Entrenamiento</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>

            {/* Vitrina Destacada de los 3 PRs Insignia (1 Pecho, 1 Piernas, 1 Espalda) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <TrophyIcon size={18} />
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-zinc-100 tracking-tight">
                    Tus 3 Récords a Batir Hoy
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('hero_prs')}
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Salón de PRs</span>
                  <ArrowRightIcon size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {heroBig3PRs.map((prCard) => {
                  const categoryExercises = GYM_EXERCISE_LIBRARY.filter(
                    (ex) => ex.muscleGroup === prCard.category
                  );
                  const libExercise = getLibraryExerciseById(prCard.exerciseId);

                  return (
                    <div
                      key={prCard.category}
                      className="fitness-card-gold rounded-2xl md:rounded-3xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-200 hover:border-amber-500/60"
                    >
                      {/* Header: Categoría + Selector */}
                      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{prCard.emoji}</span>
                          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                            {prCard.categoryLabel}
                          </span>
                        </div>

                        <select
                          value={prCard.exerciseId}
                          onChange={(e) =>
                            setPreferredPRIds((prev) => ({
                              ...prev,
                              [prCard.category]: e.target.value,
                            }))
                          }
                          aria-label={`Cambiar ejercicio insignia de ${prCard.categoryLabel}`}
                          className="bg-zinc-950/90 border border-amber-500/30 rounded-xl px-2.5 py-1 text-[11px] font-bold text-amber-200 focus:outline-none focus:border-amber-400 max-w-[150px] truncate"
                        >
                          {categoryExercises.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ejercicio + Peso Grande */}
                      <div className="space-y-2">
                        <div className="text-base font-black text-zinc-100">
                          {prCard.exerciseName}
                          {prCard.pulleyNote && (
                            <span className="ml-1.5 text-xs font-semibold text-sky-300">
                              ({prCard.pulleyNote})
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <div className="text-4xl font-black font-mono text-amber-400 tracking-tight leading-none">
                              {prCard.maxWeightKg}{' '}
                              <span className="text-lg font-bold text-amber-400/80">kg</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 font-mono">
                              Mejor serie: <strong className="text-zinc-200 font-bold">{prCard.bestSetFormatted}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              1RM: {prCard.estimated1RMKg} kg
                            </span>
                            <p className="text-[10px] font-mono text-zinc-400 mt-1">
                              +{prCard.cycleDeltaPercent}% en ciclo
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Desafío motivacional destacado */}
                      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <FlameIcon size={12} className="text-amber-400" />
                            <span>Meta a batir hoy</span>
                          </span>
                          <p className="text-xs font-bold text-zinc-100 leading-snug">
                            {prCard.nextTargetChallenge}
                          </p>
                        </div>

                        <button
                          onClick={() => setInspectedExercise(libExercise)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 mt-0.5"
                          title="Ver demostración técnica del ejercicio"
                        >
                          <EyeIcon size={13} />
                          <span>Técnica</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dashboard Semanal con Ventana Móvil de 4 Semanas */}
            <WeeklyDashboardView
              dashboard={weeklyDashboard}
              selectedWeekIdx={selectedWeekIdx}
              onSelectWeekIdx={setSelectedWeekIdx}
            />

            {/* Tarjeta de Nutrición y Balance Energético (Samsung Health) */}
            <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    <UtensilsIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-100">
                      Balance Energético & Samsung Health
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Base Atleta: 70.5 kg • Tasa Metabólica Basal (BMR): 1650 kcal
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {sampleNutrition.classificationLabel}
                </span>
              </div>

              {/* 4 Mini Métricas de Actividad y Nutrición */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                    <FlameIcon size={12} className="text-amber-400" />
                    <span>Calorías / TDEE</span>
                  </span>
                  <div className="text-base font-black font-mono text-zinc-100">
                    2,450 <span className="text-xs font-normal text-zinc-400">/ 2,800 kcal</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '87.5%' }} />
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                    <SparklesIcon size={12} className="text-emerald-400" />
                    <span>Proteína Diaria</span>
                  </span>
                  <div className="text-base font-black font-mono text-emerald-400">
                    165g <span className="text-xs font-normal text-zinc-400">({sampleNutrition.proteinPerKg} g/kg)</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold block">
                    ✓ Óptimo para Hipertrofia
                  </span>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                    <FootprintsIcon size={12} className="text-sky-400" />
                    <span>Samsung Pasos</span>
                  </span>
                  <div className="text-base font-black font-mono text-zinc-100">
                    12,450 <span className="text-xs font-normal text-zinc-400">pasos</span>
                  </div>
                  <span className="text-[10px] text-sky-400 font-medium block">
                    Actividad Alta NEAT
                  </span>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                    <ZapIcon size={12} className="text-purple-400" />
                    <span>Gasto Activo</span>
                  </span>
                  <div className="text-base font-black font-mono text-purple-400">
                    1,150 <span className="text-xs font-normal text-zinc-400">kcal quemadas</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    75 min activos
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl text-xs md:text-sm text-emerald-300 font-medium leading-relaxed">
                {sampleNutrition.summaryMessage}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            VISTA 2: ENTRENAR HOY (SESIÓN ACTIVA CON NLP Y HOJA DE RUTA)
           ========================================================================= */}
        {activeTab === 'workout_session' && (
          <section className="space-y-6">
            {/* Selector de Día Activo + Estado de Mesociclo */}
            <div className="fitness-card rounded-2xl md:rounded-3xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <FlameIcon size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                      Sesión Activa • {currentWeek.weekLabel}
                    </span>
                    <h2 className="text-base md:text-lg font-black text-zinc-100">
                      Selecciona el Día ({daysCount} Días Configurados)
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {routineDays.map((d) => (
                    <button
                      key={d.dayId}
                      onClick={() => setActiveDayId(d.dayId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                        activeDayRoutine.dayId === d.dayId
                          ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25'
                          : 'bg-zinc-950/80 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {d.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Estado de Semana (Mesociclo) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-zinc-800/80 text-xs">
                <span className="text-zinc-400 font-semibold">
                  Estado de {currentWeek.weekLabel}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['accumulation', 'Acumulación / Sobrecarga'],
                      ['active_deload', 'Descarga Activa (-10%)'],
                      ['full_deload', 'Descarga Total'],
                      ['reactivation', 'Reactivación (~95%)'],
                    ] as Array<[WeekState, string]>
                  ).map(([stateKey, label]) => (
                    <button
                      key={stateKey}
                      onClick={() => handleWeekStateChange(stateKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentWeek.weekState === stateKey
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hoja de Ruta del Día con recomendaciones del Motor de Doble Progresión */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <TargetIcon size={16} />
                  </div>
                  <h3 className="text-base font-black text-zinc-100">
                    Hoja de Ruta de Hoy — {activeDayRoutine.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('routine_config')}
                  className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CalendarIcon size={13} />
                  <span>Configurar Split</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {roadmap.map((item) => {
                  const slot =
                    activeDayRoutine.exercises.find((s) => s.code === item.code) ??
                    activeDayRoutine.exercises[0];
                  const libExercise =
                    item.exerciseName !== slot.customName
                      ? findLibraryExerciseByNameOrCode(
                          activeDayRoutine.baseDayType,
                          item.code,
                          item.exerciseName
                        )
                      : getLibraryExerciseById(slot.libraryExerciseId);

                  return (
                    <div
                      key={item.code}
                      className="fitness-card rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs border border-emerald-500/30">
                              {item.code}
                            </span>
                            <span className="text-sm font-black text-zinc-100">
                              {item.exerciseName}
                              {item.pulleyType === 'double'
                                ? ' (Doble Polea)'
                                : item.pulleyType === 'single'
                                ? ' (Polea Simple)'
                                : ''}
                            </span>
                          </div>

                          <button
                            onClick={() => setInspectedExercise(libExercise)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Ver cómo se hace el ejercicio"
                          >
                            <EyeIcon size={12} />
                            <span>Técnica</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-950 font-mono text-zinc-300 border border-zinc-800">
                            Objetivo: {slot.repRange[0]}-{slot.repRange[1]} reps • {slot.targetSets} series
                          </span>
                        </div>

                        {item.previousSessionSummary && (
                          <div className="text-xs text-zinc-400 bg-zinc-950/60 p-2 rounded-lg font-mono">
                            Sesión Anterior: <span className="text-zinc-200">{item.previousSessionSummary}</span>
                          </div>
                        )}

                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold leading-relaxed flex items-start gap-2">
                          <SparklesIcon size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item.coachMessage}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consola NLP + Series Interpretadas con Trofeos PR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* NLP Input Console */}
              <div className="fitness-card rounded-2xl md:rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <ZapIcon size={16} />
                    </div>
                    <h3 className="text-base font-black text-zinc-100">
                      Entrada Rápida NLP
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {activeDayRoutine.title}
                  </span>
                </div>

                {/* Quick insertion helper chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider self-center mr-1">
                    Atajos:
                  </span>
                  <button
                    onClick={() => handleQuickInsert('E1 60kg 8,8,6')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[11px] font-mono text-emerald-400 border border-zinc-800 cursor-pointer"
                  >
                    E1 60kg 8,8,6
                  </button>
                  <button
                    onClick={() => handleQuickInsert('E2 75kg 5 70kg 8, 8, 6')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[11px] font-mono text-emerald-400 border border-zinc-800 cursor-pointer"
                  >
                    E2 75kg 5 70kg 8,8,6
                  </button>
                  <button
                    onClick={() => handleQuickInsert('E3 no')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[11px] font-mono text-zinc-400 border border-zinc-800 cursor-pointer"
                  >
                    E3 no
                  </button>
                  <button
                    onClick={() => handleQuickInsert('E4 press 20 por lado 3x8')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[11px] font-mono text-emerald-400 border border-zinc-800 cursor-pointer"
                  >
                    E4 20/lado 3x8
                  </button>
                </div>

                <textarea
                  value={rawInputForActiveDay}
                  onChange={(e) => handleRawInputChange(e.target.value)}
                  rows={7}
                  className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 font-mono text-xs md:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition leading-relaxed"
                  placeholder="Escribe tu sesión como quieras:&#10;E1 60kg 8,8,6&#10;E2 75kg 5 70kg 8, 8, 6&#10;E3 no&#10;E4 press militar 20 por lado 3x8"
                />

                {parsedCurrent.error && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                    {parsedCurrent.error}
                  </p>
                )}
              </div>

              {/* Series Interpretadas + Detector de PRs */}
              <div className="fitness-card rounded-2xl md:rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <TrophyIcon size={16} />
                    </div>
                    <h3 className="text-base font-black text-zinc-100">
                      Series Interpretadas & Trofeos PR
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {parsedCurrent.entries.length} ejercicios
                  </span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {parsedCurrent.entries.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                      <DumbbellIcon size={32} className="opacity-40 mb-2" />
                      <p className="text-xs">Sin registros para {activeDayRoutine.title}.</p>
                      <p className="text-[11px] text-zinc-600 mt-1">
                        Escribe arriba o usa los atajos rápidos para ver el cálculo en vivo.
                      </p>
                    </div>
                  ) : (
                    parsedCurrent.entries.map((entry, idx) => {
                      const prs = detectPersonalRecords(entry, historicalDayEntries);
                      const slot = activeDayRoutine.exercises.find((s) => s.code === entry.code);
                      return (
                        <div
                          key={`${entry.code}-${idx}`}
                          className="bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-3.5 text-xs space-y-2 transition"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-zinc-100">
                              <span className="font-mono text-emerald-400 mr-1.5 font-black">
                                {entry.code}
                              </span>
                              {entry.customVariantName || slot?.customName || entry.code}
                              {entry.pulleyType === 'double'
                                ? ' [Doble Polea]'
                                : entry.pulleyType === 'single'
                                ? ' [Polea Simple]'
                                : ''}
                              {entry.isPerSideWeight
                                ? ` [${entry.enteredWeightPerSideKg}kg/lado = ${entry.maxWeightKg}kg total]`
                                : ''}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold text-xs">
                              {entry.totalVolumeKg} kg vol • 1RM: {entry.bestEstimated1RM} kg
                            </span>
                          </div>

                          {entry.isSkipped ? (
                            <p className="text-zinc-500 italic text-[11px]">Ejercicio omitido en esta sesión</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.sets.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-200"
                                >
                                  {s.weightKg}kg × {s.reps}
                                </span>
                              ))}
                            </div>
                          )}

                          {prs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-900">
                              {prs.map((pr) => (
                                <span
                                  key={pr.type}
                                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1 shadow-sm"
                                >
                                  <TrophyIcon size={12} className="text-amber-400" />
                                  <span>
                                    {pr.label}: {pr.newValue}kg (+{pr.deltaPercent}%)
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            VISTA 3: SALÓN DE RÉCORDS PR & PROYECCIÓN 1RM (BIG 3)
           ========================================================================= */}
        {activeTab === 'hero_prs' && (
          <section className="space-y-6">
            {/* Vitrina Destacada de los 3 PRs Insignia (Pecho, Piernas, Espalda) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <TrophyIcon size={18} />
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-zinc-100 tracking-tight">
                    Tus 3 Récords Insignia a Batir
                  </h2>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  1 Pecho • 1 Piernas • 1 Espalda
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {heroBig3PRs.map((prCard) => {
                  const categoryExercises = GYM_EXERCISE_LIBRARY.filter(
                    (ex) => ex.muscleGroup === prCard.category
                  );
                  const libExercise = getLibraryExerciseById(prCard.exerciseId);

                  return (
                    <div
                      key={prCard.category}
                      className="fitness-card-gold rounded-2xl md:rounded-3xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-200 hover:border-amber-500/60"
                    >
                      {/* Header: Categoría + Selector */}
                      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{prCard.emoji}</span>
                          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                            {prCard.categoryLabel}
                          </span>
                        </div>

                        <select
                          value={prCard.exerciseId}
                          onChange={(e) =>
                            setPreferredPRIds((prev) => ({
                              ...prev,
                              [prCard.category]: e.target.value,
                            }))
                          }
                          aria-label={`Cambiar ejercicio insignia de ${prCard.categoryLabel}`}
                          className="bg-zinc-950/90 border border-amber-500/30 rounded-xl px-2.5 py-1 text-[11px] font-bold text-amber-200 focus:outline-none focus:border-amber-400 max-w-[150px] truncate"
                        >
                          {categoryExercises.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ejercicio + Peso Grande */}
                      <div className="space-y-2">
                        <div className="text-base font-black text-zinc-100">
                          {prCard.exerciseName}
                          {prCard.pulleyNote && (
                            <span className="ml-1.5 text-xs font-semibold text-sky-300">
                              ({prCard.pulleyNote})
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <div className="text-4xl font-black font-mono text-amber-400 tracking-tight leading-none">
                              {prCard.maxWeightKg}{' '}
                              <span className="text-lg font-bold text-amber-400/80">kg</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 font-mono">
                              Mejor serie: <strong className="text-zinc-200 font-bold">{prCard.bestSetFormatted}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              1RM: {prCard.estimated1RMKg} kg
                            </span>
                            <p className="text-[10px] font-mono text-zinc-400 mt-1">
                              +{prCard.cycleDeltaPercent}% en ciclo
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Desafío motivacional destacado */}
                      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <FlameIcon size={12} className="text-amber-400" />
                            <span>Meta a batir hoy</span>
                          </span>
                          <p className="text-xs font-bold text-zinc-100 leading-snug">
                            {prCard.nextTargetChallenge}
                          </p>
                        </div>

                        <button
                          onClick={() => setInspectedExercise(libExercise)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 mt-0.5"
                          title="Ver demostración técnica del ejercicio"
                        >
                          <EyeIcon size={13} />
                          <span>Técnica</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Matriz Interactiva de Equivalencias de Repeticiones y Cargas (Fórmula Epley) */}
            <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <TargetIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-100">
                    Matriz de Proyección 1RM Epley (Tus 3 Ejercicios Insignia)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Cargas estimadas según repeticiones objetivo usando la fórmula biomecánica estándar (1RM = Peso × (1 + Reps/30))
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                      <th className="py-2.5 pr-4 uppercase tracking-wider font-bold">Ejercicio Insignia</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-bold text-amber-400">1RM (100%)</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-bold">3 reps (91%)</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-bold">5 reps (86%)</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-bold">8 reps (79%)</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-bold">10 reps (75%)</th>
                      <th className="py-2.5 pl-3 uppercase tracking-wider font-bold">12 reps (71%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {heroBig3PRs.map((pr) => {
                      const oneRm = pr.estimated1RMKg;
                      const calcWeightForReps = (reps: number) => {
                        if (oneRm <= 0) return 0;
                        return Math.round((oneRm / (1 + reps / 30)) * 2) / 2;
                      };

                      return (
                        <tr key={pr.category} className="hover:bg-zinc-800/30 transition-colors font-mono">
                          <td className="py-3 pr-4 font-bold text-zinc-100 font-sans flex items-center gap-2">
                            <span>{pr.emoji}</span>
                            <span>{pr.exerciseName}</span>
                          </td>
                          <td className="py-3 px-3 text-amber-400 font-black text-xs">
                            {oneRm} kg
                          </td>
                          <td className="py-3 px-3 text-zinc-200">
                            {calcWeightForReps(3)} kg
                          </td>
                          <td className="py-3 px-3 text-zinc-200">
                            {calcWeightForReps(5)} kg
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">
                            {calcWeightForReps(8)} kg
                          </td>
                          <td className="py-3 px-3 text-zinc-300">
                            {calcWeightForReps(10)} kg
                          </td>
                          <td className="py-3 pl-3 text-zinc-400">
                            {calcWeightForReps(12)} kg
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Salón de la Fama: Todos los Récords Personales Batidos en el Mesociclo */}
            <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <AwardIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-100">
                      Salón de la Fama de Récords Personales (🏆)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Todos los récords de carga, volumen y 1RM batidos progresivamente en el mesociclo
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {allHistoricalPRs.length} Hitos Logrados
                </span>
              </div>

              {allHistoricalPRs.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                  <TrophyIcon size={28} className="opacity-40 mb-2" />
                  <p className="text-xs">Los récords aparecerán aquí conforme superes tus marcas previas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allHistoricalPRs.map((record) => (
                    <div
                      key={record.id}
                      className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-3.5 space-y-2 hover:border-amber-500/60 transition"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <TrophyIcon size={11} className="text-amber-400" />
                          <span>{record.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {record.weekLabel}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-zinc-100 flex items-center gap-1.5">
                          <span className="font-mono text-emerald-400">{record.exerciseCode}</span>
                          <span>{record.exerciseName}</span>
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {record.dayTitle}
                        </p>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-zinc-900 font-mono text-xs">
                        <span className="text-zinc-400">
                          {record.previousValue > 0 ? `${record.previousValue}kg ->` : 'Marca inicial:'}
                        </span>
                        <span className="text-amber-400 font-bold">
                          {record.newValue} kg{' '}
                          <span className="text-emerald-400 text-[11px]">
                            (+{record.deltaPercent}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* =========================================================================
            VISTA 4: CONFIGURADOR DE DÍAS (2, 3, 4, 5 DÍAS) Y EJERCICIOS BASE
           ========================================================================= */}
        {activeTab === 'routine_config' && (
          <section className="space-y-6">
            <RoutineConfigurator
              daysCount={daysCount}
              onChangeDaysCount={handleDaysCountChange}
              routineDays={routineDays}
              onUpdateSlot={handleUpdateSlot}
              onResetToBaseDefaults={handleResetToBaseDefaults}
              onInspectExercise={(ex) => setInspectedExercise(ex)}
            />
          </section>
        )}

        {/* =========================================================================
            VISTA 5: BIBLIOTECA GRÁFICA DE EJERCICIOS + RECURSOS SIN DERECHOS
           ========================================================================= */}
        {activeTab === 'visual_library' && (
          <section className="space-y-6">
            {/* Explicación de fuentes abiertas sin derechos de autor */}
            <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <BookOpenIcon size={22} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-zinc-100">
                    Biblioteca Gráfica Libre de Copyright
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Motor Cinemático SVG Offline + Fotos de Repositorios en Dominio Público (Unlicense)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OPEN_EXERCISE_SOURCES.map((src) => (
                  <div
                    key={src.id}
                    className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-100">{src.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {src.license}
                      </span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">{src.description}</p>
                    <div className="text-[11px] font-mono text-amber-300 break-all pt-1">
                      {src.apiOrRawUrl}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro por grupo muscular */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setLibraryFilterGroup('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  libraryFilterGroup === 'all'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900/60 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                Todos ({GYM_EXERCISE_LIBRARY.length})
              </button>
              {Object.entries(MUSCLE_GROUP_LABELS).map(([groupKey, label]) => (
                <button
                  key={groupKey}
                  onClick={() => setLibraryFilterGroup(groupKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    libraryFilterGroup === groupKey
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900/60 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tarjetas gráficas de cada ejercicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLibraryExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="fitness-card rounded-2xl md:rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                      </span>
                      {ex.isBaseExercise && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          ⭐ Base Original
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-zinc-100">{ex.name}</h4>
                    <ExerciseKinematicSvg pattern={ex.movementPattern} phase={1} />
                    <p className="text-xs text-zinc-400">
                      <strong>Músculos:</strong> {ex.primaryMuscles.join(', ')}
                    </p>
                  </div>

                  <button
                    onClick={() => setInspectedExercise(ex)}
                    className="w-full py-2.5 rounded-xl bg-zinc-950/80 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 border border-emerald-500/30 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <EyeIcon size={14} />
                    <span>Ver Animación & Fotos Paso a Paso</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* =========================================================================
          BARRA DE NAVEGACIÓN MÓVIL (BOTTOM NAV BAR) DOCKED / ERGONÓMICA
         ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090a0f]/95 backdrop-blur-2xl border-t border-zinc-800/80 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {(
            [
              ['home_dashboard', 'Dashboard', BarChartIcon],
              ['workout_session', 'Entrenar', FlameIcon],
              ['hero_prs', 'PRs Big 3', TrophyIcon],
              ['routine_config', 'Rutina', CalendarIcon],
              ['visual_library', 'Ejercicios', BookOpenIcon],
            ] as Array<[MainViewTab, string, typeof BarChartIcon]>
          ).map(([tabId, label, IconComponent]) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => {
                  setActiveTab(tabId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex-1 max-w-[72px] sm:max-w-none flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer relative ${
                  isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 border border-emerald-500/30 shadow-md shadow-emerald-500/20 scale-105'
                      : ''
                  }`}
                >
                  <IconComponent size={20} />
                </div>
                <span className="text-[10px] font-black tracking-tight mt-0.5 truncate w-full text-center">
                  {label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5 shadow-sm shadow-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL INTERACTIVO DE DEMOSTRACIÓN GRÁFICA DE EJERCICIO */}
      <ExerciseVisualModal
        exercise={inspectedExercise}
        onClose={() => setInspectedExercise(null)}
      />
    </div>
  );
}
