import { useEffect, useState } from 'react';
import { MUSCLE_GROUP_LABELS } from '../data/exerciseCatalog.ts';
import { OPEN_EXERCISE_SOURCES } from '../data/gymExerciseLibrary.ts';
import type { GymLibraryExercise, VisualMovementPattern } from '../types/workout.ts';

interface KinematicSvgProps {
  pattern: VisualMovementPattern;
  phase: 0 | 1; // 0 = inicio/estiramiento, 1 = contracción máxima
}

/**
 * Ilustrador Cinemático Vectorial (100% Offline, sin derechos de autor).
 * Dibuja la postura biomecánica, el equipamiento, el músculo objetivo iluminado y el vector de fuerza.
 */
export function ExerciseKinematicSvg({ pattern, phase }: KinematicSvgProps) {
  const isContracted = phase === 1;

  const renderScene = () => {
    switch (pattern) {
      case 'russian_twist': {
        const plateX = isContracted ? 94 : 62;
        const plateY = isContracted ? 74 : 84;
        return (
          <g>
            {/* Colchoneta de suelo */}
            <rect x="36" y="114" width="128" height="5" rx="2.5" fill="#3f3f46" />
            {/* Piernas en V-sit semiflexionadas */}
            <polyline
              points="86,110 116,92 140,113"
              fill="none"
              stroke="#a1a1aa"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            {/* Torso inclinado a 45° */}
            <line
              x1="86"
              y1="110"
              x2="66"
              y2="72"
              stroke="#e4e4e7"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Oblicuos y Recto Abdominal iluminados */}
            <ellipse
              cx="77"
              cy="91"
              rx="10"
              ry="6"
              transform="rotate(-28 77 91)"
              fill="#10b981"
              opacity="0.9"
            />
            {/* Cabeza */}
            <circle cx="60" cy="60" r="7" fill="#d4d4d8" />
            {/* Brazos rotando con disco */}
            <polyline
              points={`72,78 ${plateX},${plateY}`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx={plateX} cy={plateY} r="8" fill="#fbbf24" stroke="#18181b" strokeWidth="2" />
            {/* Arco de rotación torácica */}
            <path
              d="M 56 72 Q 78 56 102 68"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="3,2"
              fill="none"
            />
          </g>
        );
      }

      case 'bench_press': {
        const barY = isContracted ? 46 : 74;
        const elbowY = isContracted ? 62 : 84;
        return (
          <g>
            {/* Banco plano */}
            <rect x="40" y="92" width="120" height="8" rx="3" fill="#3f3f46" />
            <rect x="55" y="100" width="8" height="25" fill="#52525b" />
            <rect x="135" y="100" width="8" height="25" fill="#52525b" />
            {/* Torso y Pectoral iluminado */}
            <line x1="65" y1="88" x2="125" y2="88" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="90" cy="84" rx="14" ry="5" fill="#10b981" opacity="0.85" />
            <circle cx="54" cy="85" r="7" fill="#d4d4d8" />
            {/* Piernas apoyadas */}
            <polyline points="125,88 148,92 155,122" fill="none" stroke="#a1a1aa" strokeWidth="6" strokeLinecap="round" />
            {/* Brazo y Barra */}
            <polyline
              points={`82,85 82,${elbowY} 82,${barY}`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Discos y Barra */}
            <line x1="62" y1={barY} x2="102" y2={barY} stroke="#f4f4f5" strokeWidth="3" />
            <rect x="66" y={barY - 9} width="6" height="18" rx="2" fill="#10b981" />
            <rect x="92" y={barY - 9} width="6" height="18" rx="2" fill="#10b981" />
            {/* Flecha de vector de fuerza */}
            <path
              d="M 112 76 L 112 48 M 108 53 L 112 48 L 116 53"
              stroke="#fbbf24"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        );
      }

      case 'skullcrusher': {
        const handX = isContracted ? 78 : 50;
        const handY = isContracted ? 44 : 70;
        return (
          <g>
            {/* Banco plano */}
            <rect x="40" y="92" width="120" height="8" rx="3" fill="#3f3f46" />
            <rect x="55" y="100" width="8" height="25" fill="#52525b" />
            <rect x="135" y="100" width="8" height="25" fill="#52525b" />
            {/* Torso apoyado */}
            <line x1="65" y1="88" x2="125" y2="88" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            <circle cx="54" cy="85" r="7" fill="#d4d4d8" />
            <polyline points="125,88 148,92 155,122" fill="none" stroke="#a1a1aa" strokeWidth="6" strokeLinecap="round" />
            {/* Húmero fijo con Tríceps iluminado */}
            <line x1="80" y1="85" x2="74" y2="60" stroke="#10b981" strokeWidth="7" strokeLinecap="round" />
            {/* Antebrazo articulando desde el codo */}
            <line x1="74" y1="60" x2={handX} y2={handY} stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
            {/* Barra EZ */}
            <circle cx={handX} cy={handY} r="6" fill="#fbbf24" />
            <path
              d="M 52 58 Q 62 42 78 40"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="3,2"
              fill="none"
            />
          </g>
        );
      }

      case 'incline_press': {
        const handY = isContracted ? 42 : 70;
        return (
          <g>
            {/* Banco inclinado 35° */}
            <line x1="52" y1="62" x2="105" y2="102" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            <line x1="105" y1="102" x2="132" y2="96" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            <line x1="75" y1="82" x2="75" y2="124" stroke="#52525b" strokeWidth="6" />
            <line x1="120" y1="100" x2="120" y2="124" stroke="#52525b" strokeWidth="6" />
            {/* Cuerpo apoyado */}
            <circle cx="62" cy="52" r="7" fill="#d4d4d8" />
            <line x1="68" y1="60" x2="104" y2="96" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            {/* Pectoral Clavicular iluminado */}
            <ellipse cx="82" cy="68" rx="9" ry="5" fill="#10b981" opacity="0.9" />
            <polyline points="104,96 130,94 142,122" fill="none" stroke="#a1a1aa" strokeWidth="6" strokeLinecap="round" />
            {/* Brazo empujando vertical */}
            <polyline
              points={`78,66 88,74 90,${handY}`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <rect x="82" y={handY - 4} width="16" height="8" rx="2" fill="#10b981" />
            <path d="M 108 72 L 108 44 M 104 49 L 108 44 L 112 49" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
          </g>
        );
      }

      case 'incline_curl': {
        const handX = isContracted ? 96 : 80;
        const handY = isContracted ? 66 : 108;
        return (
          <g>
            {/* Banco inclinado 45° */}
            <line x1="52" y1="60" x2="105" y2="102" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            <line x1="105" y1="102" x2="132" y2="96" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            <line x1="75" y1="80" x2="75" y2="124" stroke="#52525b" strokeWidth="6" />
            {/* Cuerpo apoyado */}
            <circle cx="62" cy="50" r="7" fill="#d4d4d8" />
            <line x1="68" y1="58" x2="104" y2="96" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            <polyline points="104,96 130,94 142,122" fill="none" stroke="#a1a1aa" strokeWidth="6" strokeLinecap="round" />
            {/* Húmero colgando perpendicular detrás del torso con Bíceps iluminado */}
            <line x1="74" y1="64" x2="74" y2="90" stroke="#10b981" strokeWidth="7" strokeLinecap="round" />
            {/* Antebrazo flexionando */}
            <line x1="74" y1="90" x2={handX} y2={handY} stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
            <rect x={handX - 6} y={handY - 3} width="12" height="7" rx="2" fill="#fbbf24" />
          </g>
        );
      }

      case 'pec_deck': {
        // En Pec Deck los brazos cierran horizontalmente hacia el centro del pecho
        const armSpread = isContracted ? 8 : 42;
        return (
          <g>
            {/* Estructura superior máquina Pec Deck */}
            <rect x="64" y="22" width="72" height="6" rx="2" fill="#52525b" />
            <rect x="86" y="54" width="28" height="48" rx="6" fill="#3f3f46" />
            <circle cx="100" cy="42" r="8" fill="#d4d4d8" />
            {/* Pectorales iluminados en aducción horizontal */}
            <ellipse cx="92" cy="68" rx="7" ry="6" fill="#10b981" />
            <ellipse cx="108" cy="68" rx="7" ry="6" fill="#10b981" />
            {/* Brazos cerrando al centro */}
            <polyline
              points={`84,66 ${100 - armSpread},68`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <polyline
              points={`116,66 ${100 + armSpread},68`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Almohadillas / Agarres */}
            <rect x={100 - armSpread - 4} y="58" width="7" height="18" rx="2" fill="#fbbf24" />
            <rect x={100 + armSpread - 3} y="58" width="7" height="18" rx="2" fill="#fbbf24" />
            {/* Flechas horizontales hacia el centro */}
            <path d="M 56 88 L 82 88 M 77 84 L 82 88 L 77 92" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <path d="M 144 88 L 118 88 M 123 84 L 118 88 L 123 92" stroke="#fbbf24" strokeWidth="2" fill="none" />
          </g>
        );
      }

      case 'rear_delt_fly': {
        // En Hombro Posterior los brazos se abren horizontalmente hacia afuera/atrás
        const armSpread = isContracted ? 44 : 10;
        return (
          <g>
            {/* Respaldo frontal apoyando el pecho */}
            <rect x="88" y="54" width="24" height="46" rx="5" fill="#3f3f46" />
            <circle cx="100" cy="42" r="8" fill="#d4d4d8" />
            {/* Deltoides Posterior iluminado */}
            <circle cx="84" cy="64" r="6.5" fill="#10b981" />
            <circle cx="116" cy="64" r="6.5" fill="#10b981" />
            {/* Brazos abriendo hacia atrás a altura de hombro */}
            <polyline
              points={`84,64 ${100 - armSpread},64`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <polyline
              points={`116,64 ${100 + armSpread},64`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx={100 - armSpread} cy="64" r="4.5" fill="#fbbf24" />
            <circle cx={100 + armSpread} cy="64" r="4.5" fill="#fbbf24" />
            {/* Flechas horizontales hacia afuera */}
            <path d="M 80 88 L 54 88 M 59 84 L 54 88 L 59 92" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <path d="M 120 88 L 146 88 M 141 84 L 146 88 L 141 92" stroke="#fbbf24" strokeWidth="2" fill="none" />
          </g>
        );
      }

      case 'overhead_press': {
        const handY = isContracted ? 24 : 58;
        return (
          <g>
            {/* Torso frontal */}
            <circle cx="100" cy="46" r="8" fill="#d4d4d8" />
            <rect x="88" y="58" width="24" height="44" rx="6" fill="#3f3f46" />
            {/* Deltoides Anterior y Lateral iluminados */}
            <circle cx="84" cy="62" r="7" fill="#10b981" />
            <circle cx="116" cy="62" r="7" fill="#10b981" />
            {/* Brazos empujando sobre la cabeza */}
            <polyline
              points={`84,62 74,48 78,${handY}`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <polyline
              points={`116,62 126,48 122,${handY}`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Barra / Mancuernas */}
            <line x1="64" y1={handY} x2="136" y2={handY} stroke="#fbbf24" strokeWidth="3.5" />
            <rect x="66" y={handY - 6} width="6" height="12" rx="1.5" fill="#10b981" />
            <rect x="128" y={handY - 6} width="6" height="12" rx="1.5" fill="#10b981" />
          </g>
        );
      }

      case 'lateral_raise': {
        const handY = isContracted ? 56 : 90;
        const handSpread = isContracted ? 42 : 18;
        return (
          <g>
            {/* Torso frontal */}
            <circle cx="100" cy="44" r="8" fill="#d4d4d8" />
            <rect x="88" y="56" width="24" height="44" rx="6" fill="#3f3f46" />
            {/* Deltoides Lateral iluminado */}
            <circle cx="84" cy="60" r="7" fill="#10b981" />
            <circle cx="116" cy="60" r="7" fill="#10b981" />
            {/* Brazos elevando lateralmente */}
            <polyline
              points={`84,60 ${100 - handSpread},${handY}`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <polyline
              points={`116,60 ${100 + handSpread},${handY}`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Mancuernas */}
            <rect x={100 - handSpread - 6} y={handY - 4} width="12" height="7" rx="2" fill="#fbbf24" />
            <rect x={100 + handSpread - 6} y={handY - 4} width="12" height="7" rx="2" fill="#fbbf24" />
          </g>
        );
      }

      case 'tricep_pushdown': {
        const handY = isContracted ? 94 : 62;
        return (
          <g>
            {/* Columna de polea alta */}
            <rect x="52" y="20" width="8" height="100" fill="#52525b" />
            <line x1="60" y1="24" x2="88" y2={handY} stroke="#fbbf24" strokeWidth="2.5" />
            {/* Figura lateral con torso apenas inclinado */}
            <circle cx="108" cy="40" r="7" fill="#d4d4d8" />
            <line x1="108" y1="50" x2="110" y2="88" stroke="#e4e4e7" strokeWidth="9" strokeLinecap="round" />
            <line x1="110" y1="88" x2="110" y2="120" stroke="#a1a1aa" strokeWidth="7" strokeLinecap="round" />
            {/* Tríceps iluminado en parte posterior del brazo */}
            <line x1="108" y1="54" x2="104" y2="74" stroke="#10b981" strokeWidth="7.5" strokeLinecap="round" />
            {/* Antebrazo extendiendo hacia abajo */}
            <line x1="104" y1="74" x2="88" y2={handY} stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
          </g>
        );
      }

      case 'cable_curl': {
        const handY = isContracted ? 56 : 92;
        return (
          <g>
            {/* Columna de polea baja */}
            <rect x="52" y="20" width="8" height="100" fill="#52525b" />
            <line x1="60" y1="114" x2="88" y2={handY} stroke="#fbbf24" strokeWidth="2.5" />
            {/* Figura lateral erguida */}
            <circle cx="108" cy="40" r="7" fill="#d4d4d8" />
            <line x1="108" y1="50" x2="108" y2="88" stroke="#e4e4e7" strokeWidth="9" strokeLinecap="round" />
            <line x1="108" y1="88" x2="108" y2="120" stroke="#a1a1aa" strokeWidth="7" strokeLinecap="round" />
            {/* Bíceps / Braquiorradial iluminado */}
            <line x1="106" y1="54" x2="104" y2="76" stroke="#10b981" strokeWidth="7.5" strokeLinecap="round" />
            {/* Antebrazo subiendo en flexión */}
            <line x1="104" y1="76" x2="88" y2={handY} stroke="#34d399" strokeWidth="5.5" strokeLinecap="round" />
          </g>
        );
      }

      case 'leg_press': {
        const sledX = isContracted ? 66 : 92;
        const sledY = isContracted ? 48 : 68;
        const kneeX = isContracted ? 98 : 114;
        const kneeY = isContracted ? 74 : 62;
        return (
          <g>
            {/* Riel 45 grados */}
            <line x1="45" y1="35" x2="125" y2="95" stroke="#3f3f46" strokeWidth="5" />
            {/* Respaldo asiento */}
            <polyline points="118,98 138,108 158,82" fill="none" stroke="#52525b" strokeWidth="7" strokeLinecap="round" />
            {/* Plataforma trineo */}
            <line
              x1={sledX - 10}
              y1={sledY + 14}
              x2={sledX + 12}
              y2={sledY - 14}
              stroke="#10b981"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle cx={sledX - 6} cy={sledY - 6} r="10" fill="#059669" />
            {/* Torso y Cuádriceps iluminado */}
            <circle cx="152" cy="72" r="7" fill="#d4d4d8" />
            <line x1="148" y1="82" x2="132" y2="104" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            {/* Muslo (Cuádriceps activo) */}
            <line x1="132" y1="104" x2={kneeX} y2={kneeY} stroke="#10b981" strokeWidth="9" strokeLinecap="round" />
            {/* Tibia hacia plataforma */}
            <line x1={kneeX} y1={kneeY} x2={sledX + 4} y2={sledY + 2} stroke="#e4e4e7" strokeWidth="6" strokeLinecap="round" />
            {/* Flecha empuje */}
            <path d="M 88 36 L 64 20 M 64 27 L 64 20 L 71 20" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
          </g>
        );
      }

      case 'leg_extension': {
        const footX = isContracted ? 142 : 112;
        const footY = isContracted ? 78 : 116;
        return (
          <g>
            {/* Silla máquina */}
            <polyline points="68,52 68,90 108,90" fill="none" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            <line x1="78" y1="90" x2="78" y2="124" stroke="#52525b" strokeWidth="6" />
            {/* Torso sentado */}
            <circle cx="78" cy="42" r="7" fill="#d4d4d8" />
            <line x1="78" y1="52" x2="78" y2="86" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            {/* Muslo con Cuádriceps iluminado */}
            <line x1="78" y1="86" x2="112" y2="86" stroke="#10b981" strokeWidth="9" strokeLinecap="round" />
            {/* Pierna que extiende */}
            <line x1="112" y1="86" x2={footX} y2={footY} stroke="#34d399" strokeWidth="7" strokeLinecap="round" />
            <circle cx={footX} cy={footY} r="5" fill="#fbbf24" />
          </g>
        );
      }

      case 'calf_raise': {
        // Gemelos sentado: rodilla flexionada a 90° bajo almohadilla, talón sube y baja sobre escalón
        const kneeY = isContracted ? 76 : 86;
        const heelY = isContracted ? 102 : 120;
        return (
          <g>
            {/* Asiento y escalón de metatarso */}
            <polyline points="64,54 64,88 102,88" fill="none" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            <line x1="74" y1="88" x2="74" y2="124" stroke="#52525b" strokeWidth="6" />
            <rect x="116" y="114" width="22" height="10" rx="2" fill="#52525b" />
            {/* Torso sentado */}
            <circle cx="74" cy="42" r="7" fill="#d4d4d8" />
            <line x1="74" y1="52" x2="74" y2="84" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            {/* Muslo y almohadilla sobre rodilla */}
            <line x1="74" y1="84" x2="114" y2={kneeY} stroke="#a1a1aa" strokeWidth="7" strokeLinecap="round" />
            <rect x="106" y={kneeY - 10} width="16" height="7" rx="3" fill="#fbbf24" />
            {/* Pantorrilla (Sóleo / Gastrocnemio iluminado) */}
            <line x1="114" y1={kneeY} x2="114" y2={heelY} stroke="#10b981" strokeWidth="8.5" strokeLinecap="round" />
            {/* Pie apoyado en metatarso elevando talón */}
            <line x1="114" y1={heelY} x2="128" y2="114" stroke="#f4f4f5" strokeWidth="5" strokeLinecap="round" />
            <path d="M 144 114 L 144 92 M 140 97 L 144 92 L 148 97" stroke="#fbbf24" strokeWidth="2" fill="none" />
          </g>
        );
      }

      case 'leg_curl': {
        const ankleX = isContracted ? 98 : 144;
        const ankleY = isContracted ? 56 : 86;
        return (
          <g>
            {/* Camilla femoral */}
            <polyline points="48,92 100,84 148,92" fill="none" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            <line x1="65" y1="90" x2="65" y2="124" stroke="#52525b" strokeWidth="6" />
            <line x1="130" y1="90" x2="130" y2="124" stroke="#52525b" strokeWidth="6" />
            {/* Cuerpo tumbado */}
            <circle cx="52" cy="78" r="7" fill="#d4d4d8" />
            <line x1="62" y1="82" x2="102" y2="78" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            {/* Isquios iluminados */}
            <line x1="102" y1="78" x2="124" y2="84" stroke="#10b981" strokeWidth="9" strokeLinecap="round" />
            {/* Tibia flexionando hacia glúteo */}
            <line x1="124" y1="84" x2={ankleX} y2={ankleY} stroke="#34d399" strokeWidth="6" strokeLinecap="round" />
            <circle cx={ankleX} cy={ankleY} r="6" fill="#fbbf24" />
          </g>
        );
      }

      case 'hip_adduction': {
        // Máquina de Aductores/Abductores sentado (vista frontal-superior)
        const legSpread = isContracted ? 12 : 42;
        return (
          <g>
            {/* Respaldo y asiento */}
            <rect x="84" y="42" width="32" height="38" rx="6" fill="#3f3f46" />
            <circle cx="100" cy="32" r="7" fill="#d4d4d8" />
            {/* Muslos con Aductores Internos iluminados cerrando hacia la línea media */}
            <line
              x1="92"
              y1="76"
              x2={100 - legSpread}
              y2="112"
              stroke="#10b981"
              strokeWidth="8.5"
              strokeLinecap="round"
            />
            <line
              x1="108"
              y1="76"
              x2={100 + legSpread}
              y2="112"
              stroke="#10b981"
              strokeWidth="8.5"
              strokeLinecap="round"
            />
            {/* Almohadillas de rodilla */}
            <circle cx={100 - legSpread} cy="112" r="6" fill="#fbbf24" />
            <circle cx={100 + legSpread} cy="112" r="6" fill="#fbbf24" />
            {/* Flechas de cierre */}
            <path d="M 52 100 L 76 100 M 71 96 L 76 100 L 71 104" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <path d="M 148 100 L 124 100 M 129 96 L 124 100 L 129 104" stroke="#fbbf24" strokeWidth="2" fill="none" />
          </g>
        );
      }

      case 'lat_pulldown': {
        const barY = isContracted ? 62 : 34;
        const elbowY = isContracted ? 78 : 48;
        const elbowSpread = isContracted ? 22 : 16;
        return (
          <g>
            {/* Torre de polea alta */}
            <line x1="100" y1="12" x2="100" y2={barY} stroke="#a1a1aa" strokeWidth="2" strokeDasharray="3,2" />
            <rect x="65" y="10" width="70" height="5" rx="2" fill="#52525b" />
            {/* Barra de jalón */}
            <path
              d={`M 64 ${barY + 4} L 76 ${barY} L 124 ${barY} L 136 ${barY + 4}`}
              stroke="#fbbf24"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            {/* Cabeza y Torso con Dorsal Ancho iluminado */}
            <circle cx="100" cy="56" r="7" fill="#d4d4d8" />
            <polygon points="86,66 114,66 107,102 93,102" fill="#10b981" opacity="0.85" />
            {/* Brazos traccionando */}
            <polyline
              points={`72,${barY + 1} ${100 - elbowSpread},${elbowY} 88,68`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <polyline
              points={`128,${barY + 1} ${100 + elbowSpread},${elbowY} 112,68`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Asiento */}
            <rect x="82" y="102" width="36" height="6" rx="2" fill="#3f3f46" />
          </g>
        );
      }

      case 'seated_row': {
        const handleX = isContracted ? 88 : 54;
        const elbowX = isContracted ? 108 : 74;
        return (
          <g>
            {/* Polea baja y cable */}
            <rect x="34" y="40" width="8" height="82" fill="#52525b" />
            <line x1="42" y1="78" x2={handleX} y2="78" stroke="#fbbf24" strokeWidth="2.5" />
            {/* Banco y piernas */}
            <rect x="40" y="96" width="110" height="6" rx="2" fill="#3f3f46" />
            <polyline points="98,94 68,88 44,94" fill="none" stroke="#a1a1aa" strokeWidth="6" strokeLinecap="round" />
            {/* Torso erguido con Espalda Media iluminada */}
            <circle cx="98" cy="48" r="7" fill="#d4d4d8" />
            <line x1="98" y1="58" x2="98" y2="94" stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
            {/* Brazo traccionando hacia atrás */}
            <polyline
              points={`98,64 ${elbowX},78 ${handleX},78`}
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        );
      }

      case 'back_extension': {
        // Banco lumbar a 45°: cadera fija en soporte, torso desciende y sube hasta alinearse con piernas
        const headX = isContracted ? 128 : 118;
        const headY = isContracted ? 48 : 98;
        const shoulderX = isContracted ? 120 : 112;
        const shoulderY = isContracted ? 56 : 90;
        return (
          <g>
            {/* Estructura de Banco Lumbar 45° */}
            <line x1="48" y1="116" x2="96" y2="78" stroke="#52525b" strokeWidth="6" strokeLinecap="round" />
            <line x1="88" y1="84" x2="104" y2="122" stroke="#3f3f46" strokeWidth="6" />
            <circle cx="52" cy="112" r="5" fill="#fbbf24" />
            <rect x="84" y="72" width="16" height="10" rx="4" fill="#3f3f46" />
            {/* Piernas ancladas */}
            <line x1="54" y1="110" x2="90" y2="78" stroke="#a1a1aa" strokeWidth="7" strokeLinecap="round" />
            {/* Torso articulando desde la cadera con Erectores Lumbares iluminados */}
            <line x1="90" y1="78" x2={shoulderX} y2={shoulderY} stroke="#10b981" strokeWidth="9" strokeLinecap="round" />
            <circle cx={headX} cy={headY} r="7" fill="#d4d4d8" />
            {/* Disco sujeto al pecho */}
            <circle cx={shoulderX - 4} cy={shoulderY + 8} r="6" fill="#fbbf24" />
          </g>
        );
      }

      case 'romanian_deadlift': {
        // Peso Muerto Rumano (RDL): bisagra de cadera con barra pegada a tibias/muslos
        const hipX = isContracted ? 102 : 76;
        const hipY = isContracted ? 76 : 78;
        const shoulderX = isContracted ? 102 : 118;
        const shoulderY = isContracted ? 44 : 68;
        const barY = isContracted ? 78 : 102;
        return (
          <g>
            {/* Suelo */}
            <line x1="45" y1="122" x2="155" y2="122" stroke="#3f3f46" strokeWidth="4" />
            {/* Tibia vertical y rodilla semiflexionada (~15°) */}
            <line x1="104" y1="120" x2="100" y2="96" stroke="#a1a1aa" strokeWidth="6.5" strokeLinecap="round" />
            {/* Isquiosurales y Glúteo iluminados */}
            <line x1="100" y1="96" x2={hipX} y2={hipY} stroke="#10b981" strokeWidth="9" strokeLinecap="round" />
            {/* Espalda neutra en bisagra */}
            <line x1={hipX} y1={hipY} x2={shoulderX} y2={shoulderY} stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
            <circle cx={shoulderX + (isContracted ? 0 : 8)} cy={shoulderY - 10} r="7" fill="#d4d4d8" />
            {/* Brazo vertical sosteniendo la barra */}
            <line x1={shoulderX} y1={shoulderY + 4} x2="112" y2={barY} stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
            {/* Barra olímpica con discos */}
            <circle cx="112" cy={barY} r="10" fill="#10b981" stroke="#fbbf24" strokeWidth="2.5" />
          </g>
        );
      }

      case 'hip_thrust': {
        // Hip Thrust: escápulas sobre banco, barra en cadera, extensión horizontal de glúteo
        const hipY = isContracted ? 76 : 106;
        return (
          <g>
            {/* Banco de apoyo escapular */}
            <rect x="42" y="78" width="28" height="42" rx="4" fill="#3f3f46" />
            {/* Cabeza y Torso puenteando */}
            <circle cx="58" cy="66" r="7" fill="#d4d4d8" />
            <line x1="64" y1="76" x2="102" y2={hipY} stroke="#e4e4e7" strokeWidth="8.5" strokeLinecap="round" />
            {/* Glúteo Mayor iluminado e Isquios */}
            <circle cx="102" cy={hipY + 3} r="8" fill="#10b981" />
            <line x1="102" y1={hipY} x2="134" y2="78" stroke="#10b981" strokeWidth="8.5" strokeLinecap="round" />
            {/* Tibia vertical al suelo */}
            <line x1="134" y1="78" x2="134" y2="120" stroke="#a1a1aa" strokeWidth="6.5" strokeLinecap="round" />
            {/* Barra con almohadilla sobre pelvis */}
            <circle cx="102" cy={hipY - 6} r="9" fill="#fbbf24" stroke="#10b981" strokeWidth="2.5" />
            <path d="M 102 114 L 102 52 M 98 57 L 102 52 L 106 57" stroke="#fbbf24" strokeWidth="2" fill="none" />
          </g>
        );
      }
    }
  };

  return (
    <svg
      viewBox="0 0 200 135"
      className="w-full h-44 bg-zinc-950 rounded-xl border border-zinc-800/80 select-none"
      role="img"
      aria-label={`Demostración biomecánica de ${pattern}`}
    >
      {/* Cuadrícula técnica de fondo */}
      <defs>
        <pattern id="techGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#27272a" strokeWidth="0.7" />
        </pattern>
      </defs>
      <rect width="200" height="135" fill="url(#techGrid)" />
      {renderScene()}
      <text x="10" y="18" fill="#a1a1aa" fontSize="8" fontFamily="monospace">
        {isContracted ? 'FASE 2: CONTRACCIÓN MÁXIMA' : 'FASE 1: POSICIÓN INICIAL / EXCÉNTRICA'}
      </text>
      <circle cx="184" cy="14" r="4" fill={isContracted ? '#10b981' : '#f59e0b'} />
    </svg>
  );
}

interface ExerciseVisualModalProps {
  exercise: GymLibraryExercise | null;
  onClose: () => void;
}

export function ExerciseVisualModal({ exercise, onClose }: ExerciseVisualModalProps) {
  const [phase, setPhase] = useState<0 | 1>(0);
  const [visualMode, setVisualMode] = useState<'svg' | 'freedb' | 'sources'>('svg');
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev === 0 ? 1 : 0));
    }, 950);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setImageLoadError(false);
  }, [exercise?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (exercise) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exercise, onClose]);

  if (!exercise) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fitness-card rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl border border-zinc-700/80 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
              </span>
              {exercise.baseOriginLabel && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {exercise.baseOriginLabel}
                </span>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-zinc-100 tracking-tight mt-1.5">
              {exercise.name}
            </h3>
            <p className="text-xs text-zinc-400">
              Equipamiento: <strong className="text-zinc-200">{exercise.equipment}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer shrink-0"
            aria-label="Cerrar modal de ejercicio"
          >
            ✕
          </button>
        </div>

        {/* Selector de modo visual estilo Segmented Controls */}
        <div className="flex bg-zinc-950/90 p-1.5 rounded-2xl border border-zinc-800/80 gap-1 overflow-x-auto">
          <button
            onClick={() => setVisualMode('svg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
              visualMode === 'svg'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🎯 Cinemática SVG (Offline)
          </button>
          <button
            onClick={() => setVisualMode('freedb')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
              visualMode === 'freedb'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📸 Fotos Paso 1 y 2 (free-db)
          </button>
          <button
            onClick={() => setVisualMode('sources')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
              visualMode === 'sources'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌐 Fuentes Sin Copyright
          </button>
        </div>

        {/* Contenido según pestaña */}
        {visualMode === 'svg' && (
          <div className="space-y-3">
            <ExerciseKinematicSvg pattern={exercise.movementPattern} phase={phase} />
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>
                Músculos primarios:{' '}
                <strong className="text-emerald-400 font-semibold">{exercise.primaryMuscles.join(', ')}</strong>
              </span>
              <button
                onClick={() => setPhase((p) => (p === 0 ? 1 : 0))}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold transition text-xs cursor-pointer"
              >
                Alternar Fase ({phase === 0 ? '1 (Inicio)' : '2 (Contracción)'})
              </button>
            </div>
          </div>
        )}

        {visualMode === 'freedb' && (
          <div className="space-y-3">
            {!imageLoadError ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-2.5 text-center space-y-1.5">
                  <img
                    src={exercise.freeExerciseDbUrls[0]}
                    alt={`${exercise.name} - Posición Inicial`}
                    onError={() => setImageLoadError(true)}
                    className={`w-full h-44 object-cover rounded-xl transition-all duration-300 ${
                      phase === 0 ? 'ring-2 ring-emerald-500 scale-[1.01]' : 'opacity-80'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-zinc-300 block">
                    Paso 1: Posición Inicial (0.jpg)
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-2.5 text-center space-y-1.5">
                  <img
                    src={exercise.freeExerciseDbUrls[1]}
                    alt={`${exercise.name} - Contracción Final`}
                    onError={() => setImageLoadError(true)}
                    className={`w-full h-44 object-cover rounded-xl transition-all duration-300 ${
                      phase === 1 ? 'ring-2 ring-emerald-500 scale-[1.01]' : 'opacity-80'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-zinc-300 block">
                    Paso 2: Contracción Máxima (1.jpg)
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  Modo sin conexión detectado: mostrando motor vectorial SVG integrado.
                </p>
                <ExerciseKinematicSvg pattern={exercise.movementPattern} phase={phase} />
              </div>
            )}
            <p className="text-[11px] text-zinc-400">
              Repositorio de Dominio Público:{' '}
              <code className="text-emerald-300 bg-zinc-950 px-2 py-0.5 rounded font-mono">
                free-exercise-db/exercises/{exercise.freeExerciseDbFolder}
              </code>{' '}
              (The Unlicense / Libre de Copyright).
            </p>
          </div>
        )}

        {visualMode === 'sources' && (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {OPEN_EXERCISE_SOURCES.map((src) => (
              <div
                key={src.id}
                className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-emerald-400">{src.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                    {src.license}
                  </span>
                </div>
                <p className="text-zinc-300">{src.description}</p>
                <div className="text-zinc-400 font-mono text-[11px] break-all pt-1">
                  Repo / API: {src.apiOrRawUrl}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guía paso a paso de técnica */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span>⚡ Técnica de Ejecución Biomecánica</span>
          </h4>
          <div className="space-y-2 text-xs text-zinc-200">
            {exercise.executionSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                  {i + 1}
                </span>
                <p className="leading-relaxed text-zinc-300">{step}</p>
              </div>
            ))}
          </div>
          <div className="pt-2.5 border-t border-zinc-800/80 text-xs text-amber-300/90 flex items-start gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <p>
              <strong className="text-amber-300">Error común a evitar:</strong> {exercise.commonMistake}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

