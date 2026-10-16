import { BarChartIcon, FlameIcon, LayersIcon, TrendingUpIcon, TrophyIcon, ZapIcon } from './FitnessIcons.tsx';
import type { WeekState, WeeklyDashboardSummary } from '../types/workout.ts';

const WEEK_STATE_BADGES: Record<
  WeekState,
  { label: string; shortLabel: string; colorClass: string; dotColor: string }
> = {
  accumulation: {
    label: 'Acumulación / Sobrecarga',
    shortLabel: 'Sobrecarga',
    colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  active_deload: {
    label: 'Descarga Activa (-10%)',
    shortLabel: 'Descarga Activa',
    colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  full_deload: {
    label: 'Descarga Total',
    shortLabel: 'Descanso / Total',
    colorClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  reactivation: {
    label: 'Reactivación (~95%)',
    shortLabel: 'Reactivación',
    colorClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dotColor: 'bg-purple-400',
  },
};

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-[11px] font-mono text-zinc-500 font-medium">Base</span>;
  }
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
        isPositive
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : isZero
          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
      }`}
    >
      {isPositive && <TrendingUpIcon size={11} className="inline" />}
      {isPositive ? `+${value}%` : `${value}%`}
    </span>
  );
}

interface WeeklyDashboardViewProps {
  dashboard: WeeklyDashboardSummary;
  selectedWeekIdx: number;
  onSelectWeekIdx: (idx: number) => void;
}

export function WeeklyDashboardView({
  dashboard,
  selectedWeekIdx,
  onSelectWeekIdx,
}: WeeklyDashboardViewProps) {
  const maxWeeklyVolume = Math.max(...dashboard.weeks.map((w) => w.totalVolumeKg), 1);
  const activeWeek = dashboard.weeks[selectedWeekIdx] ?? dashboard.weeks[dashboard.weeks.length - 1];

  return (
    <div className="space-y-6">
      {/* 1. Gráfico de Barras de Volumen Semanal Total en kg (Ventana Móvil 4 Semanas) */}
      <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <BarChartIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black tracking-tight text-zinc-100">
                  Volumen Semanal Total
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  4 Semanas
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ventana móvil del mesociclo • Toca una barra para inspeccionar o editar esa semana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
              <ZapIcon size={14} className="text-amber-400" />
              Pico del Ciclo: {maxWeeklyVolume.toLocaleString('es-AR')} kg
            </span>
          </div>
        </div>

        {/* Mini KPI Highlights de la semana seleccionada */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              Semana Activa
            </span>
            <div className="text-base font-extrabold text-zinc-100 mt-0.5 flex items-center gap-1.5">
              <span>{activeWeek.weekLabel}</span>
              <span className={`w-2 h-2 rounded-full ${WEEK_STATE_BADGES[activeWeek.weekState].dotColor}`} />
            </div>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              Tonelaje Total
            </span>
            <div className="text-base font-extrabold font-mono text-emerald-400 mt-0.5">
              {activeWeek.totalVolumeKg.toLocaleString('es-AR')} <span className="text-xs font-normal text-zinc-400">kg</span>
            </div>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              Series Efectivas
            </span>
            <div className="text-base font-extrabold font-mono text-zinc-100 mt-0.5">
              {activeWeek.totalSets} <span className="text-xs font-normal text-zinc-400">series</span>
            </div>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              Δ% vs Anterior
            </span>
            <div className="mt-1">
              <DeltaBadge value={activeWeek.deltaVsPrevWeekPercent} />
            </div>
          </div>
        </div>

        {/* Barras Interactivas del Mesociclo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {dashboard.weeks.map((w, idx) => {
            const heightPct = Math.max(16, Math.round((w.totalVolumeKg / maxWeeklyVolume) * 100));
            const isSelected = idx === selectedWeekIdx;
            const stateBadge = WEEK_STATE_BADGES[w.weekState];

            return (
              <button
                key={w.weekNumber}
                onClick={() => onSelectWeekIdx(idx)}
                className={`text-left rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-emerald-500/15 via-zinc-900 to-zinc-950 border-emerald-500/80 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-500/50'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/60'
                }`}
              >
                {/* Header de la tarjeta de barra */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-zinc-200">{w.weekLabel}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <DeltaBadge value={w.deltaVsPrevWeekPercent} />
                </div>

                {/* Gráfico de Barra Vertical */}
                <div className="h-32 bg-zinc-900/90 rounded-xl p-2.5 flex items-end border border-zinc-800/60 relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-lg transition-all duration-500 relative ${
                      isSelected
                        ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/30'
                        : 'bg-gradient-to-t from-zinc-700 to-zinc-500 hover:from-emerald-700/60 hover:to-emerald-500/60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-white/70 rounded-full" />
                    )}
                  </div>
                </div>

                {/* Métricas al pie de la barra */}
                <div className="space-y-1.5 w-full">
                  <div className="text-lg font-black font-mono text-emerald-400 leading-tight">
                    {w.totalVolumeKg.toLocaleString('es-AR')}{' '}
                    <span className="text-xs font-bold text-zinc-400">kg</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>{w.totalSets} series</span>
                    <span>{w.totalReps} reps</span>
                  </div>
                  <div
                    className={`text-[10px] px-2 py-0.5 rounded-full border inline-block font-semibold ${stateBadge.colorClass}`}
                  >
                    {stateBadge.shortLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tabla Comparativa de Carga por Día y Estado de la Semana */}
      <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <LayersIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-100">
                Carga por Día y Estado del Mesociclo
              </h3>
              <p className="text-xs text-zinc-400">
                Tonelaje acumulado (kg) y series efectivas distribuidas según tus días configurados
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800 hidden sm:inline">
            4 Semanas
          </span>
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                <th className="py-3 pr-4 font-bold uppercase tracking-wider">Día Configurado</th>
                {dashboard.weeks.map((w) => (
                  <th key={w.weekNumber} className="py-3 px-3 font-bold uppercase tracking-wider">
                    <div>{w.weekLabel}</div>
                    <div className="text-[10px] font-normal text-emerald-400 lowercase first-letter:uppercase">
                      {WEEK_STATE_BADGES[w.weekState].shortLabel}
                    </div>
                  </th>
                ))}
                <th className="py-3 pl-4 font-bold uppercase tracking-wider text-right">Δ% Ciclo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {dashboard.dayLoadComparison.map((row) => (
                <tr key={row.dayId} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 pr-4 font-bold text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                    {row.dayTitle}
                  </td>
                  {row.volumesByWeek.map((vol, i) => (
                    <td key={i} className="py-3 px-3 font-mono">
                      <span className="text-zinc-100 font-extrabold text-xs block">
                        {vol.toLocaleString('es-AR')} kg
                      </span>
                      <span className="text-zinc-500 text-[10px]">
                        {row.setsByWeek[i]} series
                      </span>
                    </td>
                  ))}
                  <td className="py-3 pl-4 text-right">
                    <DeltaBadge value={row.deltaCyclePercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Tabla de Volumen por Grupo Muscular con Tendencia Porcentual Δ% */}
      <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <FlameIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-100">
                Volumen por Grupo Muscular (6 Grupos) & Tendencia
              </h3>
              <p className="text-xs text-zinc-400">
                Monitoreo de sobrecarga para evitar desbalances entre Pecho, Espalda, Piernas, Hombros, Brazos y Core
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800 hidden sm:inline">
            6 Grupos
          </span>
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                <th className="py-3 pr-4 font-bold uppercase tracking-wider">Grupo Muscular</th>
                {dashboard.weeks.map((w) => (
                  <th key={w.weekNumber} className="py-3 px-3 font-bold uppercase tracking-wider">
                    {w.weekLabel}
                  </th>
                ))}
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-right">Δ% Últ. Semana</th>
                <th className="py-3 pl-4 font-bold uppercase tracking-wider text-right">Δ% Ciclo (4 Sem)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {dashboard.muscleVolumeTrends.map((m) => (
                <tr key={m.muscleGroup} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 pr-4 font-bold text-zinc-200">{m.label}</td>
                  {m.volumesByWeek.map((v, i) => (
                    <td key={i} className="py-3 px-3 font-mono">
                      <span className="text-emerald-400 font-extrabold text-xs block">
                        {v.toLocaleString('es-AR')} kg
                      </span>
                      <span className="text-zinc-500 text-[10px]">
                        {m.setsByWeek[i]} series
                      </span>
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right">
                    <DeltaBadge value={m.deltaLastWeekPercent} />
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <DeltaBadge value={m.deltaCyclePercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Tabla de Evolución de Cargas Pico y 1RM Estimado en Ejercicios Principales */}
      <div className="fitness-card rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <TrophyIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-100">
                Evolución de Cargas Pico & 1RM Epley
              </h3>
              <p className="text-xs text-zinc-400">
                Progreso de fuerza absoluta y 1RM estimado en los ejercicios clave del mesociclo
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800 hidden sm:inline">
            Cargas Clave
          </span>
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                <th className="py-3 pr-4 font-bold uppercase tracking-wider">Ejercicio Principal</th>
                {dashboard.weeks.map((w) => (
                  <th key={w.weekNumber} className="py-3 px-3 font-bold uppercase tracking-wider">
                    {w.weekLabel}
                  </th>
                ))}
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-right">Δ% Carga</th>
                <th className="py-3 pl-4 font-bold uppercase tracking-wider text-right">Δ% 1RM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {dashboard.keyExerciseProgression.map((ex) => (
                <tr key={ex.slotKey} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 pr-4 font-bold text-zinc-100">{ex.exerciseName}</td>
                  {ex.peakWeightByWeek.map((wKg, i) => (
                    <td key={i} className="py-3 px-3 font-mono">
                      <span className="text-zinc-100 font-black text-xs block">
                        {wKg} kg
                      </span>
                      <span className="text-amber-400 text-[10px] font-semibold">
                        1RM: {ex.estimated1RMByWeek[i]} kg
                      </span>
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right">
                    <DeltaBadge value={ex.weightDeltaPercent} />
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <DeltaBadge value={ex.oneRmDeltaPercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
