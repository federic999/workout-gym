import { CalendarIcon, EyeIcon, RotateCcwIcon, ZapIcon } from './FitnessIcons.tsx';
import { MUSCLE_GROUP_LABELS } from '../data/exerciseCatalog.ts';
import { GYM_EXERCISE_LIBRARY, getLibraryExerciseById } from '../data/gymExerciseLibrary.ts';
import type {
  ConfiguredDayRoutine,
  ConfiguredExerciseSlot,
  ExerciseCode,
  GymDaysCount,
  GymLibraryExercise,
} from '../types/workout.ts';

interface RoutineConfiguratorProps {
  daysCount: GymDaysCount;
  onChangeDaysCount: (count: GymDaysCount) => void;
  routineDays: ConfiguredDayRoutine[];
  onUpdateSlot: (
    dayIndex: number,
    code: ExerciseCode,
    updatedSlot: ConfiguredExerciseSlot
  ) => void;
  onResetToBaseDefaults: () => void;
  onInspectExercise: (exercise: GymLibraryExercise) => void;
}

const DAY_COUNT_DESCRIPTIONS: Record<GymDaysCount, { title: string; desc: string }> = {
  2: {
    title: 'Split Compacto (2 Días)',
    desc: 'Compacta todos tus ejercicios base en Día 1 (Tren Superior Base) y Día 2 (Piernas + Brazos Base). Máxima eficiencia para semanas ocupadas sin perder estímulo.',
  },
  3: {
    title: 'Split Clásico PPL (3 Días - Base Original)',
    desc: 'Día 1 Empuje (Pecho/Hombro/Tríceps), Día 2 Piernas (Prensa/Cuádriceps/Femoral/Gemelos) y Día 3 Tirón (Espalda/Lumbares/Bíceps). La distribución estándar dorada.',
  },
  4: {
    title: 'Split Avanzado Torso / Brazos (4 Días)',
    desc: 'Mantiene intactos tus 3 Días Base (Empuje, Piernas, Tirón) y agrega Día 4 de Torso / Puntos Débiles (Frecuencia 2 en hombro lateral, pecho superior y brazos).',
  },
  5: {
    title: 'Split Pro Especialización (5 Días)',
    desc: 'Tus 3 Días Base + Día 4 (Upper Hipertrofia) + Día 5 (Pierna Posterior & Glúteo con Peso Muerto Rumano y Hip Thrust para desarrollo completo de cadena posterior).',
  },
};

export function RoutineConfigurator({
  daysCount,
  onChangeDaysCount,
  routineDays,
  onUpdateSlot,
  onResetToBaseDefaults,
  onInspectExercise,
}: RoutineConfiguratorProps) {
  const handleSelectLibraryExercise = (
    dayIndex: number,
    slot: ConfiguredExerciseSlot,
    newLibraryId: string
  ) => {
    const lib = getLibraryExerciseById(newLibraryId);
    onUpdateSlot(dayIndex, slot.code, {
      ...slot,
      libraryExerciseId: lib.id,
      customName: lib.name,
      muscleGroup: lib.muscleGroup,
      targetSets: lib.defaultSets,
      repRange: [...lib.defaultRepRange] as [number, number],
      weightIncrementKg: lib.defaultWeightIncrementKg,
      supportsDropSet: lib.supportsDropSet,
      supportsPulleySelector: lib.supportsPulleySelector,
    });
  };

  return (
    <div className="space-y-6">
      {/* Selector de 2, 3, 4 o 5 días estilo Segmented Control de Figma */}
      <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black tracking-tight text-zinc-100">
                Frecuencia Semanal & Rutina
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Adapta el split manteniendo siempre tus ejercicios base (Empuje, Piernas, Tirón)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Control Buttons */}
            <div className="flex bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800/80">
              {([2, 3, 4, 5] as GymDaysCount[]).map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => onChangeDaysCount(cnt)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                    daysCount === cnt
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`}
                >
                  {cnt} Días {cnt === 3 ? '★' : ''}
                </button>
              ))}
            </div>

            <button
              onClick={onResetToBaseDefaults}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
              title="Restaura los ejercicios base enviados originalmente"
            >
              <RotateCcwIcon size={13} />
              <span>Restaurar Base</span>
            </button>
          </div>
        </div>

        {/* Tarjeta explicativa con diseño fitness */}
        <div className="bg-zinc-950/80 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <ZapIcon size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              {DAY_COUNT_DESCRIPTIONS[daysCount].title}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {DAY_COUNT_DESCRIPTIONS[daysCount].desc}
            </p>
          </div>
        </div>
      </div>

      {/* Editor de ejercicios por cada día configurado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {routineDays.map((day, dayIndex) => (
          <div
            key={day.dayId}
            className="fitness-card rounded-2xl md:rounded-3xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Día {day.dayNumber}
                </span>
                <h4 className="text-base font-extrabold text-zinc-100">{day.title}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{day.subtitle}</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs font-mono font-bold text-emerald-400">
                {day.exercises.length} ejercicios
              </span>
            </div>

            <div className="space-y-3">
              {day.exercises.map((slot) => {
                const libEx = getLibraryExerciseById(slot.libraryExerciseId);
                return (
                  <div
                    key={slot.code}
                    className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-3.5 space-y-3 transition text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-mono font-black text-xs border border-emerald-500/30">
                          {slot.code}
                        </span>
                        <select
                          value={slot.libraryExerciseId}
                          onChange={(e) =>
                            handleSelectLibraryExercise(dayIndex, slot, e.target.value)
                          }
                          aria-label={`Seleccionar ejercicio para ${slot.code}`}
                          className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-emerald-500 flex-1 truncate"
                        >
                          <optgroup label="⭐ Ejercicios Base Originales">
                            {GYM_EXERCISE_LIBRARY.filter((e) => e.isBaseExercise).map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name} ({MUSCLE_GROUP_LABELS[ex.muscleGroup]})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🏋️ Biblioteca Extra de Gimnasio">
                            {GYM_EXERCISE_LIBRARY.filter((e) => !e.isBaseExercise).map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name} ({MUSCLE_GROUP_LABELS[ex.muscleGroup]})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <button
                        onClick={() => onInspectExercise(libEx)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <EyeIcon size={13} />
                        <span>Técnica</span>
                      </button>
                    </div>

                    {/* Ajustes rápidos de Series, Rango de Reps e Incremento */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                          {MUSCLE_GROUP_LABELS[slot.muscleGroup]}
                        </span>
                        {slot.supportsPulleySelector && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            Polea
                          </span>
                        )}
                        {slot.supportsDropSet && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Drop Set
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 font-medium">
                          <span>Series:</span>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={slot.targetSets}
                            onChange={(e) =>
                              onUpdateSlot(dayIndex, slot.code, {
                                ...slot,
                                targetSets: Math.max(1, Number(e.target.value) || 3),
                              })
                            }
                            className="w-12 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-0.5 text-center text-zinc-100 font-mono font-bold"
                          />
                        </label>
                        <span className="font-mono text-zinc-300">
                          {slot.repRange[0]}-{slot.repRange[1]} reps
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          +{slot.weightIncrementKg}kg
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
