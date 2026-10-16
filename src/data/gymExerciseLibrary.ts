import type {
  ConfiguredDayRoutine,
  ConfiguredExerciseSlot,
  ExerciseCode,
  GymDaysCount,
  GymLibraryExercise,
} from '../types/workout.ts';

const FREE_DB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

function freeDbPair(folder: string): [string, string] {
  return [`${FREE_DB_BASE}/${folder}/0.jpg`, `${FREE_DB_BASE}/${folder}/1.jpg`];
}

export interface OpenExerciseSourceInfo {
  id: string;
  name: string;
  license: string;
  url: string;
  apiOrRawUrl: string;
  exerciseCount: string;
  visualFormat: string;
  offlineCapable: boolean;
  description: string;
}

/**
 * Fuentes abiertas y sin derechos de autor (Dominio Público / Open Source)
 * para obtener listas de ejercicios de gimnasio con representación gráfica.
 */
export const OPEN_EXERCISE_SOURCES: OpenExerciseSourceInfo[] = [
  {
    id: 'free-exercise-db',
    name: 'free-exercise-db (GitHub: yuhonas)',
    license: 'Unlicense (Dominio Público — 100% libre de derechos de autor)',
    url: 'https://github.com/yuhonas/free-exercise-db',
    apiOrRawUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
    exerciseCount: '+870 ejercicios',
    visualFormat: 'Fotos Paso 1 (0.jpg) y Paso 2 (1.jpg) animables como GIF + JSON',
    offlineCapable: true,
    description:
      'Base de datos en Dominio Público alojada en GitHub CDN. No requiere API Key ni pago. Cada ejercicio incluye 2 imágenes (inicio y final del movimiento) que al alternarse muestran la técnica exacta.',
  },
  {
    id: 'svg-kinematic-engine',
    name: 'Motor SVG Cinemático Integrado (Local en la App)',
    license: 'Dominio Público / Nativo en la App',
    url: 'local://svg-kinematic-visualizer',
    apiOrRawUrl: 'Integrado en src/components/ExerciseVisualModal.tsx',
    exerciseCount: '21 patrones biomecánicos vectoriales',
    visualFormat: 'Animación vectorial SVG con vectores de fuerza y músculos activos',
    offlineCapable: true,
    description:
      'Ilustraciones técnicas vectoriales animadas embebidas directamente en el APK/PWA. Funcionan 100% sin internet dentro del gimnasio y resaltan el grupo muscular primario y el recorrido.',
  },
  {
    id: 'wger-open-api',
    name: 'wger Workout Manager REST API',
    license: 'Open Source (AGPLv3 / Contenido CC-BY-SA)',
    url: 'https://wger.de/en/software/api',
    apiOrRawUrl: 'https://wger.de/api/v2/exerciseinfo/?limit=50',
    exerciseCount: '+400 ejercicios con anatomía',
    visualFormat: 'Diagramas musculares SVG frontales/posteriores + imágenes de ejecución',
    offlineCapable: false,
    description:
      'API REST pública europea de código abierto. Permite consultar ejercicios, traducciones al español e ilustraciones anatómicas sin necesidad de registro para peticiones GET.',
  },
  {
    id: 'wrkout-json',
    name: 'wrkout / exercises.json (Open Dataset)',
    license: 'Unlicense (Dominio Público)',
    url: 'https://github.com/wrkout/exercises.json',
    apiOrRawUrl: 'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises.json',
    exerciseCount: '+850 ejercicios estructurados',
    visualFormat: 'Esquema JSON por equipamiento, músculo primario y secundario',
    offlineCapable: true,
    description:
      'Catálogo ligero en JSON libre de derechos ideal para autocompletado instantáneo y filtrado por equipamiento (barra, mancuernas, polea, máquina).',
  },
];

/**
 * Biblioteca completa de ejercicios de gimnasio (incluye todos los ejercicios base enviados por el usuario
 * + ejercicios adicionales para rutinas de 2, 4 y 5 días) con su guía biomecánica y enlaces a free-exercise-db.
 */
export const GYM_EXERCISE_LIBRARY: GymLibraryExercise[] = [
  // ================= BASE DÍA 1: EMPUJE =================
  {
    id: 'abs_giro_ruso',
    name: 'Abs + Giro Ruso',
    aliases: ['Giro Ruso', 'Crunch Polea', 'Russian Twist'],
    muscleGroup: 'core',
    primaryMuscles: ['Oblicuos', 'Recto Abdominal'],
    secondaryMuscles: ['Transverso Abdominal', 'Flexores de Cadera'],
    equipment: 'Disco / Mancuerna / Peso Corporal',
    movementPattern: 'russian_twist',
    defaultSets: 3,
    defaultRepRange: [7, 12],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base E0 (Todos los días)',
    executionSteps: [
      'Siéntate en el suelo con el torso inclinado a 45° y rodillas semiflexionadas.',
      'Sujeta el disco o mancuerna frente al pecho activando el abdomen.',
      'Rota el torso de lado a lado de forma controlada sin arquear la zona lumbar.',
    ],
    commonMistake: 'Mover solo los brazos sin rotar la caja torácica ni controlar la bajada.',
    freeExerciseDbFolder: 'Russian_Twist',
    freeExerciseDbUrls: freeDbPair('Russian_Twist'),
  },
  {
    id: 'press_plano',
    name: 'Press Plano (Banca)',
    aliases: ['Press Banca', 'Press Plano con Barra', 'Press Plano Mancuernas'],
    muscleGroup: 'chest',
    primaryMuscles: ['Pectoral Mayor (Porción Esternal)'],
    secondaryMuscles: ['Deltoides Anterior', 'Tríceps Braquial'],
    equipment: 'Barra Olímpica o Mancuernas + Banco Plano',
    movementPattern: 'bench_press',
    defaultSets: 3,
    defaultRepRange: [6, 10],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 1 Empuje (E1)',
    executionSteps: [
      'Retrae y deprime las escápulas contra el banco, apoyando firme los pies en el suelo.',
      'Desciende la barra de forma controlada hacia la línea media-baja del esternón (codos a ~45-60°).',
      'Empuja explosivamente hacia arriba manteniendo los glúteos y hombros pegados al banco.',
    ],
    commonMistake: 'Abrir los codos a 90° respecto al torso o despegar los hombros al empujar.',
    freeExerciseDbFolder: 'Barbell_Bench_Press_-_Medium_Grip',
    freeExerciseDbUrls: freeDbPair('Barbell_Bench_Press_-_Medium_Grip'),
  },
  {
    id: 'press_inclinado',
    name: 'Press Inclinado',
    aliases: ['Press Inclinado Mancuernas', 'Press Inclinado Barra', 'Press Inclinado Multipower'],
    muscleGroup: 'chest',
    primaryMuscles: ['Pectoral Mayor Superior (Clavicular)'],
    secondaryMuscles: ['Deltoides Anterior', 'Tríceps Braquial'],
    equipment: 'Banco Inclinado (30°-45°) + Barra o Mancuernas',
    movementPattern: 'incline_press',
    defaultSets: 3,
    defaultRepRange: [8, 10],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 1 Empuje (E2)',
    executionSteps: [
      'Ajusta el banco a 30° de inclinación y fija las escápulas contra el respaldo.',
      'Baja el peso hasta la parte alta del pecho logrando un estiramiento profundo del pectoral.',
      'Empuja verticalmente sin chocar las mancuernas arriba para mantener la tensión constante.',
    ],
    commonMistake: 'Usar un banco demasiado vertical (>60°) convirtiendo el ejercicio en press de hombros.',
    freeExerciseDbFolder: 'Incline_Dumbbell_Press',
    freeExerciseDbUrls: freeDbPair('Incline_Dumbbell_Press'),
  },
  {
    id: 'mariposa_pec_deck',
    name: 'Mariposa / Pec Deck',
    aliases: ['Pec Deck', 'Aperturas en Máquina', 'Contractor Pectoral'],
    muscleGroup: 'chest',
    primaryMuscles: ['Pectoral Mayor (Aducción Horizontal)'],
    secondaryMuscles: ['Deltoides Anterior'],
    equipment: 'Máquina Pec Deck / Contractor',
    movementPattern: 'pec_deck',
    defaultSets: 3,
    defaultRepRange: [10, 12],
    defaultWeightIncrementKg: 5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 1 Empuje (E3)',
    executionSteps: [
      'Ajusta el asiento para que los agarres queden a la altura media del pecho.',
      'Junta los brazos en un arco amplio imaginando que abrazas un árbol, con codos apenas flexionados.',
      'Sostén 1 segundo en máxima contracción y regresa lento sin que las placas choquen.',
    ],
    commonMistake: 'Adelantar los hombros al cerrar quitándole tensión al pectoral.',
    freeExerciseDbFolder: 'Butterfly',
    freeExerciseDbUrls: freeDbPair('Butterfly'),
  },
  {
    id: 'hombro_posterior',
    name: 'Hombro Posterior',
    aliases: ['Pájaros en Máquina', 'Pec Deck Inverso', 'Vuelos Posteriores'],
    muscleGroup: 'shoulders',
    primaryMuscles: ['Deltoides Posterior'],
    secondaryMuscles: ['Trapecio Medio', 'Romboides'],
    equipment: 'Máquina Pec Deck Inverso o Mancuernas',
    movementPattern: 'rear_delt_fly',
    defaultSets: 3,
    defaultRepRange: [8, 12],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 1 Empuje (E4)',
    executionSteps: [
      'Apoya el pecho contra el respaldo de la máquina mirando hacia adentro.',
      'Abre los brazos hacia atrás guiando el movimiento con los codos a la altura del hombro.',
      'Controla el retorno durante 2 segundos sin juntar del todo las manos.',
    ],
    commonMistake: 'Juntar las escápulas en exceso usando el trapecio en vez de aislar el deltoides posterior.',
    freeExerciseDbFolder: 'Reverse_Machine_Flyes',
    freeExerciseDbUrls: freeDbPair('Reverse_Machine_Flyes'),
  },
  {
    id: 'press_militar',
    name: 'Press Militar',
    aliases: ['Press de Hombros', 'Press Militar con Barra', 'Press Hombros Mancuernas'],
    muscleGroup: 'shoulders',
    primaryMuscles: ['Deltoides Anterior', 'Deltoides Lateral'],
    secondaryMuscles: ['Tríceps Braquial', 'Haz Clavicular Pectoral'],
    equipment: 'Barra, Multipower o Mancuernas',
    movementPattern: 'overhead_press',
    defaultSets: 3,
    defaultRepRange: [8, 12],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Variante Día 1 (E4)',
    executionSteps: [
      'Coloca las manos ligeramente más anchas que los hombros con antebrazos verticales.',
      'Empuja el peso verticalmente pasando cerca del rostro hasta extender los brazos arriba.',
      'Desciende de forma controlada hasta la altura de la barbilla/clavícula.',
    ],
    commonMistake: 'Hiperextender la espalda baja por falta de rigidez en abdomen y glúteos.',
    freeExerciseDbFolder: 'Standing_Military_Press',
    freeExerciseDbUrls: freeDbPair('Standing_Military_Press'),
  },
  {
    id: 'press_frances',
    name: 'Press Francés',
    aliases: ['Rompecráneos', 'Extensión Tríceps Barra EZ', 'Skullcrusher'],
    muscleGroup: 'arms',
    primaryMuscles: ['Tríceps Braquial (Cabeza Larga y Lateral)'],
    secondaryMuscles: ['Ancóneo'],
    equipment: 'Barra EZ o Mancuernas + Banco Plano',
    movementPattern: 'skullcrusher',
    defaultSets: 3,
    defaultRepRange: [8, 12],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 1 Empuje (E5)',
    executionSteps: [
      'Acuéstate en el banco sosteniendo la barra EZ con los brazos levemente inclinados hacia atrás.',
      'Flexiona únicamente los codos bajando la barra hacia la frente o detrás de la cabeza.',
      'Extiende los codos manteniendo los húmeros fijos hasta volver a la posición inicial.',
    ],
    commonMistake: 'Abrir los codos hacia afuera o mover los hombros como si fuera un pullover.',
    freeExerciseDbFolder: 'Lying_Triceps_Press',
    freeExerciseDbUrls: freeDbPair('Lying_Triceps_Press'),
  },
  {
    id: 'triceps_polea',
    name: 'Tríceps en Polea',
    aliases: ['Extensión de Tríceps en Polea Alta', 'Tríceps con Soga', 'Pushdown'],
    muscleGroup: 'arms',
    primaryMuscles: ['Tríceps Braquial (Cabeza Lateral y Medial)'],
    secondaryMuscles: ['Ancóneo'],
    equipment: 'Polea Alta con Barra o Soga',
    movementPattern: 'tricep_pushdown',
    defaultSets: 3,
    defaultRepRange: [10, 12],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 1 Empuje (E6)',
    executionSteps: [
      'Pega los codos a las costillas e inclina el torso apenas 15° hacia adelante.',
      'Extiende los antebrazos hacia abajo hasta bloquear suavemente los codos al final.',
      'Sube lento hasta que el antebrazo supere apenas los 90° sin despegar el codo del cuerpo.',
    ],
    commonMistake: 'Balancear el torso y subir los codos en la fase excéntrica.',
    freeExerciseDbFolder: 'Triceps_Pushdown',
    freeExerciseDbUrls: freeDbPair('Triceps_Pushdown'),
  },

  // ================= BASE DÍA 2: PIERNAS =================
  {
    id: 'prensa_inclinada',
    name: 'Prensa Inclinada 45°',
    aliases: ['Prensa Inclinada', 'Prensa de Piernas', 'Leg Press'],
    muscleGroup: 'legs',
    primaryMuscles: ['Cuádriceps (Vasto Externo, Interno y Recto Femoral)', 'Glúteo Mayor'],
    secondaryMuscles: ['Isquiosurales', 'Aductores'],
    equipment: 'Máquina Prensa 45°',
    movementPattern: 'leg_press',
    defaultSets: 3,
    defaultRepRange: [8, 12],
    defaultWeightIncrementKg: 10,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 2 Piernas (E1)',
    executionSteps: [
      'Apoya toda la espalda y el sacro firmemente contra el respaldo; pies al ancho de hombros.',
      'Quita los seguros y baja la plataforma flexionando rodillas hasta ~90° o máxima flexión sin despegar la cadera.',
      'Empuja con toda la planta del pie sin bloquear bruscamente las rodillas al final.',
    ],
    commonMistake: 'Despegar la zona lumbar del asiento al bajar demasiado o empujar con las manos en las rodillas.',
    freeExerciseDbFolder: 'Leg_Press',
    freeExerciseDbUrls: freeDbPair('Leg_Press'),
  },
  {
    id: 'sillon_cuadriceps',
    name: 'Sillón de Cuádriceps',
    aliases: ['Sillón Cuádriceps', 'Extensión de Cuádriceps', 'Leg Extension'],
    muscleGroup: 'legs',
    primaryMuscles: ['Cuádriceps (Recto Femoral y Vastos)'],
    secondaryMuscles: [],
    equipment: 'Máquina de Extensión de Cuádriceps',
    movementPattern: 'leg_extension',
    defaultSets: 3,
    defaultRepRange: [10, 12],
    defaultWeightIncrementKg: 5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 2 Piernas (E2)',
    executionSteps: [
      'Alinea el eje de giro de la máquina exactamente con tu articulación de la rodilla.',
      'Extiende las piernas por completo y mantén 1 segundo de contracción isométrica arriba.',
      'Baja de forma controlada sin dejar caer las placas de golpe.',
    ],
    commonMistake: 'Levantar la cadera del asiento usando inercia para mover más peso.',
    freeExerciseDbFolder: 'Leg_Extensions',
    freeExerciseDbUrls: freeDbPair('Leg_Extensions'),
  },
  {
    id: 'isquios_camilla',
    name: 'Isquios en Camilla',
    aliases: ['Curl Femoral Tumbado', 'Camilla Femorales', 'Lying Leg Curl'],
    muscleGroup: 'legs',
    primaryMuscles: ['Isquiosurales (Bíceps Femoral, Semitendinoso, Semimembranoso)'],
    secondaryMuscles: ['Gastrocnemio (Gemelos)'],
    equipment: 'Camilla de Curl Femoral',
    movementPattern: 'leg_curl',
    defaultSets: 3,
    defaultRepRange: [10, 12],
    defaultWeightIncrementKg: 5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 2 Piernas (E3)',
    executionSteps: [
      'Acuéstate boca abajo manteniendo la pelvis presionada contra el banco en todo momento.',
      'Flexiona las rodillas llevando el rodillo hacia los glúteos con control.',
      'Desciende en 2-3 segundos estirando por completo los isquiosurales.',
    ],
    commonMistake: 'Arquear la espalda y levantar los glúteos al subir el peso.',
    freeExerciseDbFolder: 'Lying_Leg_Curls',
    freeExerciseDbUrls: freeDbPair('Lying_Leg_Curls'),
  },
  {
    id: 'gemelos_sentado',
    name: 'Gemelos Sentado',
    aliases: ['Sóleo en Máquina Sentado', 'Elevación de Talones Sentado', 'Seated Calf Raise'],
    muscleGroup: 'legs',
    primaryMuscles: ['Sóleo', 'Gastrocnemio'],
    secondaryMuscles: [],
    equipment: 'Máquina de Gemelos Sentado',
    movementPattern: 'calf_raise',
    defaultSets: 3,
    defaultRepRange: [10, 15],
    defaultWeightIncrementKg: 5,
    supportsDropSet: true,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 2 Piernas (E4 - Soporta Drop Set)',
    executionSteps: [
      'Apoya el metatarso (punta de los pies) en el borde y deja que el talón baje al máximo estiramiento.',
      'Sube el talón lo más alto posible contrayendo fuerte durante 1 segundo arriba.',
      'En caso de Drop Set, reduce 15-20% el peso inmediatamente al llegar al fallo y continúa.',
    ],
    commonMistake: 'Rebotar rápido en la parte baja aprovechando el tendón de Aquiles sin pausa.',
    freeExerciseDbFolder: 'Seated_Calf_Raise',
    freeExerciseDbUrls: freeDbPair('Seated_Calf_Raise'),
  },
  {
    id: 'aductores_abductores',
    name: 'Aductores / Abductores',
    aliases: ['Máquina de Aductores', 'Máquina de Abductores'],
    muscleGroup: 'legs',
    primaryMuscles: ['Aductor Mayor, Largo y Corto', 'Glúteo Medio (en Abducción)'],
    secondaryMuscles: ['Estabilizadores de Cadera'],
    equipment: 'Máquina de Aducción / Abducción',
    movementPattern: 'hip_adduction',
    defaultSets: 3,
    defaultRepRange: [12, 15],
    defaultWeightIncrementKg: 5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 2 Piernas (E5 Opcional)',
    executionSteps: [
      'Siéntate con la espalda bien apoyada y selecciona una apertura inicial cómoda pero exigente.',
      'Cierra (o abre) las piernas de manera fluida y sostén 1 segundo al final del recorrido.',
      'Regresa despacio controlando el estiramiento sin rebotar.',
    ],
    commonMistake: 'Usar recorridos muy cortos con exceso de carga.',
    freeExerciseDbFolder: 'Thigh_Adductor',
    freeExerciseDbUrls: freeDbPair('Thigh_Adductor'),
  },

  // ================= BASE DÍA 3: TIRÓN =================
  {
    id: 'jalon_pecho',
    name: 'Jalón al Pecho',
    aliases: ['Polea Alta al Pecho', 'Lat Pulldown', 'Jalón Polea Simple / Doble'],
    muscleGroup: 'back',
    primaryMuscles: ['Dorsal Ancho', 'Redondo Mayor'],
    secondaryMuscles: ['Bíceps Braquial', 'Romboides', 'Trapecio Inferior'],
    equipment: 'Polea Alta (Simple o Doble Polea)',
    movementPattern: 'lat_pulldown',
    defaultSets: 3,
    defaultRepRange: [8, 10],
    defaultWeightIncrementKg: 5,
    supportsPulleySelector: true,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 3 Tirón (E1 - Selector Simple/Doble Polea)',
    executionSteps: [
      'Sujeta la barra un poco más ancho que los hombros y fija los muslos bajo el rodillo.',
      'Deprime las escápulas e inclina el torso ~15° atrás llevando la barra hacia la clavícula/pecho alto.',
      'Extiende los brazos arriba dejando que las escápulas se eleven ligeramente sin perder control.',
    ],
    commonMistake: 'Tirar hacia el abdomen balanceando todo el cuerpo hacia atrás.',
    freeExerciseDbFolder: 'Wide-Grip_Lat_Pulldown',
    freeExerciseDbUrls: freeDbPair('Wide-Grip_Lat_Pulldown'),
  },
  {
    id: 'remo_polea_maquina',
    name: 'Remo en Polea / Máquina',
    aliases: ['Remo Gironda', 'Remo Baja en Polea', 'Remo Sentado en Máquina'],
    muscleGroup: 'back',
    primaryMuscles: ['Dorsal Ancho', 'Trapecio Medio', 'Romboides'],
    secondaryMuscles: ['Deltoides Posterior', 'Bíceps y Braquiorradial'],
    equipment: 'Polea Baja con Triángulo o Máquina de Remo',
    movementPattern: 'seated_row',
    defaultSets: 3,
    defaultRepRange: [8, 10],
    defaultWeightIncrementKg: 5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 3 Tirón (E2)',
    executionSteps: [
      'Siéntate con el torso erguido, pecho alto y rodillas semiflexionadas.',
      'Tracciona el agarre hacia el abdomen bajo llevando los codos pegados al cuerpo hacia atrás.',
      'Aprieta las escápulas 1 segundo y estira los brazos adelante sin encorvar la columna lumbar.',
    ],
    commonMistake: 'Usar el impulso lumbar columpiando el torso en cada repetición.',
    freeExerciseDbFolder: 'Seated_Cable_Rows',
    freeExerciseDbUrls: freeDbPair('Seated_Cable_Rows'),
  },
  {
    id: 'extensiones_lumbares',
    name: 'Extensiones Lumbares',
    aliases: ['Banco Lumbar 45°', 'Hiperextensiones', 'Back Extension'],
    muscleGroup: 'core',
    primaryMuscles: ['Erectores Espinales (Lumbares)', 'Glúteo Mayor'],
    secondaryMuscles: ['Isquiosurales'],
    equipment: 'Banco Lumbar 45° + Disco en el pecho',
    movementPattern: 'back_extension',
    defaultSets: 3,
    defaultRepRange: [10, 15],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 3 Tirón (E3)',
    executionSteps: [
      'Ajusta el soporte a la altura del pliegue de la cadera para permitir flexión libre.',
      'Desciende el torso manteniendo la espalda neutra hasta sentir estiramiento en isquios y lumbar.',
      'Sube hasta quedar alineado en línea recta con las piernas (evita hiperextender hacia atrás).',
    ],
    commonMistake: 'Subir demasiado arqueando la columna lumbar por encima de la línea neutral.',
    freeExerciseDbFolder: 'Hyperextensions_(Back_Extensions)',
    freeExerciseDbUrls: freeDbPair('Hyperextensions_(Back_Extensions)'),
  },
  {
    id: 'vuelos_laterales',
    name: 'Vuelos Laterales',
    aliases: ['Elevaciones Laterales', 'Vuelos Laterales con Mancuernas'],
    muscleGroup: 'shoulders',
    primaryMuscles: ['Deltoides Lateral (Medio)'],
    secondaryMuscles: ['Supraespinoso', 'Trapecio Superior'],
    equipment: 'Mancuernas o Polea Baja',
    movementPattern: 'lateral_raise',
    defaultSets: 3,
    defaultRepRange: [10, 15],
    defaultWeightIncrementKg: 2,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 3 Tirón (E4)',
    executionSteps: [
      'De pie, inclina el torso apenas hacia adelante y lleva las mancuernas en el plano escapular (~20° adelante).',
      'Eleva los brazos guiando con los codos hasta la altura de los hombros.',
      'Baja de forma controlada en 2 segundos manteniendo tensión antes de tocar los muslos.',
    ],
    commonMistake: 'Encoger los hombros hacia las orejas (trapecio) o usar envión de cadera.',
    freeExerciseDbFolder: 'Side_Lateral_Raise',
    freeExerciseDbUrls: freeDbPair('Side_Lateral_Raise'),
  },
  {
    id: 'curl_biceps_inclinado',
    name: 'Curl Bíceps Inclinado',
    aliases: ['Curl con Mancuernas en Banco Inclinado', 'Incline Dumbbell Curl'],
    muscleGroup: 'arms',
    primaryMuscles: ['Bíceps Braquial (Énfasis Cabeza Larga en estiramiento)'],
    secondaryMuscles: ['Braquial Anterior', 'Braquiorradial'],
    equipment: 'Mancuernas + Banco Inclinado (45°-60°)',
    movementPattern: 'incline_curl',
    defaultSets: 3,
    defaultRepRange: [8, 12],
    defaultWeightIncrementKg: 2,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 3 Tirón (E5)',
    executionSteps: [
      'Recuéstate en el banco inclinado dejando caer los brazos totalmente perpendiculares al suelo.',
      'Flexiona los codos supinando las muñecas sin adelantar los hombros.',
      'Baja lento hasta estirar el bíceps por completo en la posición inferior.',
    ],
    commonMistake: 'Llevar los codos hacia adelante al subir, perdiendo la ventaja del banco inclinado.',
    freeExerciseDbFolder: 'Incline_Dumbbell_Curl',
    freeExerciseDbUrls: freeDbPair('Incline_Dumbbell_Curl'),
  },
  {
    id: 'biceps_polea_prono',
    name: 'Bíceps en Polea Prono',
    aliases: ['Curl Inverso en Polea', 'Curl Prono Barra Recta', 'Reverse Cable Curl'],
    muscleGroup: 'arms',
    primaryMuscles: ['Braquiorradial', 'Braquial Anterior', 'Bíceps Braquial'],
    secondaryMuscles: ['Extensores del Antebrazo'],
    equipment: 'Polea Baja con Barra Recta o EZ',
    movementPattern: 'cable_curl',
    defaultSets: 3,
    defaultRepRange: [10, 12],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: true,
    baseOriginLabel: 'Base Día 3 Tirón (E6)',
    executionSteps: [
      'Toma la barra en polea baja con agarre prono (palmas mirando hacia abajo) y codos pegados al torso.',
      'Sube la barra contrayendo antebrazos y braquial manteniendo las muñecas firmes y rectas.',
      'Desciende en 2 segundos hasta extender los brazos sin soltar la tensión del cable.',
    ],
    commonMistake: 'Doblar las muñecas hacia abajo o abrir los codos para levantar más carga.',
    freeExerciseDbFolder: 'Standing_Biceps_Cable_Curl',
    freeExerciseDbUrls: freeDbPair('Standing_Biceps_Cable_Curl'),
  },

  // ================= EJERCICIOS EXTRA DE GYM (PARA 2, 4 Y 5 DÍAS) =================
  {
    id: 'peso_muerto_rumano',
    name: 'Peso Muerto Rumano (RDL)',
    aliases: ['RDL con Barra', 'Peso Muerto Rumano Mancuernas'],
    muscleGroup: 'legs',
    primaryMuscles: ['Isquiosurales', 'Glúteo Mayor'],
    secondaryMuscles: ['Erectores Espinales', 'Dorsal Ancho (Isométrico)'],
    equipment: 'Barra Olímpica o Mancuernas',
    movementPattern: 'romanian_deadlift',
    defaultSets: 3,
    defaultRepRange: [8, 10],
    defaultWeightIncrementKg: 5,
    isBaseExercise: false,
    executionSteps: [
      'Con rodillas desbloqueadas (~15° de flexión fija), lleva la cadera hacia atrás como si cerraras una puerta con el glúteo.',
      'Desliza la barra pegada a los muslos y tibias hasta la mitad de la espinilla manteniendo espalda neutra.',
      'Extiende la cadera empujando el suelo con los talones hasta quedar erguido.',
    ],
    commonMistake: 'Bajar doblando la espalda lumbar o separar la barra de las piernas.',
    freeExerciseDbFolder: 'Romanian_Deadlift',
    freeExerciseDbUrls: freeDbPair('Romanian_Deadlift'),
  },
  {
    id: 'hip_thrust',
    name: 'Hip Thrust con Barra',
    aliases: ['Empuje de Cadera', 'Hip Thrust en Máquina'],
    muscleGroup: 'legs',
    primaryMuscles: ['Glúteo Mayor', 'Glúteo Medio'],
    secondaryMuscles: ['Isquiosurales', 'Cuádriceps'],
    equipment: 'Barra con Almohadilla + Banco',
    movementPattern: 'hip_thrust',
    defaultSets: 3,
    defaultRepRange: [8, 12],
    defaultWeightIncrementKg: 5,
    isBaseExercise: false,
    executionSteps: [
      'Apoya el borde inferior de las escápulas en el banco y coloca los pies a una distancia donde las tibias queden verticales arriba.',
      'Empuja con los talones extendiendo la cadera hasta formar una mesa horizontal con el torso.',
      'Mantén la mirada al frente (mentón recogido) y aprieta el glúteo 1 segundo arriba.',
    ],
    commonMistake: 'Arquear la espalda baja en lugar de hacer retroversión pélvica arriba.',
    freeExerciseDbFolder: 'Barbell_Glute_Bridge',
    freeExerciseDbUrls: freeDbPair('Barbell_Glute_Bridge'),
  },
  {
    id: 'sentadilla_hack',
    name: 'Sentadilla Hack / Multipower',
    aliases: ['Hack Squat', 'Sentadilla en Máquina Hack'],
    muscleGroup: 'legs',
    primaryMuscles: ['Cuádriceps', 'Glúteo Mayor'],
    secondaryMuscles: ['Aductores'],
    equipment: 'Máquina Hack Squat',
    movementPattern: 'leg_press',
    defaultSets: 3,
    defaultRepRange: [8, 10],
    defaultWeightIncrementKg: 5,
    isBaseExercise: false,
    executionSteps: [
      'Apoya toda la espalda y hombros en los soportes con los pies en la parte media-baja de la plataforma.',
      'Desciende controladamente logrando máxima flexión de rodilla sin despegar el sacro.',
      'Empuja firme hacia arriba manteniendo las rodillas alineadas con la punta de los pies.',
    ],
    commonMistake: 'Colapsar las rodillas hacia adentro (valgo) al salir del fondo.',
    freeExerciseDbFolder: 'Hack_Squat',
    freeExerciseDbUrls: freeDbPair('Hack_Squat'),
  },
  {
    id: 'dominadas_neutras',
    name: 'Dominadas / Jalón Agarre Neutro',
    aliases: ['Dominadas Asistidas', 'Jalón al Pecho Cerrado Neutro'],
    muscleGroup: 'back',
    primaryMuscles: ['Dorsal Ancho', 'Redondo Mayor'],
    secondaryMuscles: ['Braquial', 'Bíceps'],
    equipment: 'Barra de Dominadas o Polea con Triángulo',
    movementPattern: 'lat_pulldown',
    defaultSets: 3,
    defaultRepRange: [8, 10],
    defaultWeightIncrementKg: 2.5,
    isBaseExercise: false,
    executionSteps: [
      'Toma el agarre neutro (palmas enfrentadas) e inicia el movimiento deprimiendo los hombros.',
      'Lleva los codos hacia abajo y pegados al torso hasta acercar el esternón al agarre.',
      'Desciende controlado estirando completamente el dorsal abajo.',
    ],
    commonMistake: 'Acortar el rango de movimiento sin estirar los brazos arriba.',
    freeExerciseDbFolder: 'Close-Grip_Front_Lat_Pulldown',
    freeExerciseDbUrls: freeDbPair('Close-Grip_Front_Lat_Pulldown'),
  },
  {
    id: 'curl_martillo',
    name: 'Curl Martillo con Mancuernas',
    aliases: ['Hammer Curl', 'Curl Neutro en Polea con Soga'],
    muscleGroup: 'arms',
    primaryMuscles: ['Braquial Anterior', 'Braquiorradial', 'Bíceps'],
    secondaryMuscles: ['Antebrazo'],
    equipment: 'Mancuernas o Polea con Soga',
    movementPattern: 'cable_curl',
    defaultSets: 3,
    defaultRepRange: [10, 12],
    defaultWeightIncrementKg: 2,
    isBaseExercise: false,
    executionSteps: [
      'Sostén las mancuernas con agarre neutro (palmas mirándose entre sí) y codos fijos a los lados.',
      'Sube el peso flexionando el codo sin girar la muñeca.',
      'Baja de forma controlada evitando balancear el tronco.',
    ],
    commonMistake: 'Impulsar las mancuernas con la cadera al final de la serie.',
    freeExerciseDbFolder: 'Hammer_Curls',
    freeExerciseDbUrls: freeDbPair('Hammer_Curls'),
  },
];

export function getLibraryExerciseById(id: string): GymLibraryExercise {
  return GYM_EXERCISE_LIBRARY.find((ex) => ex.id === id) ?? GYM_EXERCISE_LIBRARY[0];
}

export function findLibraryExerciseByNameOrCode(
  dayType: 'push' | 'legs' | 'pull',
  code: ExerciseCode,
  customName?: string
): GymLibraryExercise {
  if (customName) {
    const lower = customName.toLowerCase();
    const matched = GYM_EXERCISE_LIBRARY.find(
      (ex) =>
        ex.name.toLowerCase().includes(lower) ||
        lower.includes(ex.name.toLowerCase()) ||
        ex.aliases.some((a) => a.toLowerCase().includes(lower) || lower.includes(a.toLowerCase()))
    );
    if (matched) return matched;
  }

  const defaultMap: Record<'push' | 'legs' | 'pull', Record<ExerciseCode, string>> = {
    push: {
      E0: 'abs_giro_ruso',
      E1: 'press_plano',
      E2: 'press_inclinado',
      E3: 'mariposa_pec_deck',
      E4: 'hombro_posterior',
      E5: 'press_frances',
      E6: 'triceps_polea',
    },
    legs: {
      E0: 'abs_giro_ruso',
      E1: 'prensa_inclinada',
      E2: 'sillon_cuadriceps',
      E3: 'isquios_camilla',
      E4: 'gemelos_sentado',
      E5: 'aductores_abductores',
      E6: 'sentadilla_hack',
    },
    pull: {
      E0: 'abs_giro_ruso',
      E1: 'jalon_pecho',
      E2: 'remo_polea_maquina',
      E3: 'extensiones_lumbares',
      E4: 'vuelos_laterales',
      E5: 'curl_biceps_inclinado',
      E6: 'biceps_polea_prono',
    },
  };

  return getLibraryExerciseById(defaultMap[dayType][code]);
}

function makeSlot(
  code: ExerciseCode,
  libraryExerciseId: string,
  overrides?: Partial<ConfiguredExerciseSlot>
): ConfiguredExerciseSlot {
  const lib = getLibraryExerciseById(libraryExerciseId);
  return {
    code,
    libraryExerciseId: lib.id,
    customName: lib.name,
    muscleGroup: lib.muscleGroup,
    targetSets: lib.defaultSets,
    repRange: [...lib.defaultRepRange] as [number, number],
    weightIncrementKg: lib.defaultWeightIncrementKg,
    supportsDropSet: lib.supportsDropSet,
    supportsPulleySelector: lib.supportsPulleySelector,
    ...overrides,
  };
}

/**
 * Construye la configuración de rutina según la cantidad de días elegida (2, 3, 4 o 5 días),
 * tomando siempre como base los ejercicios enviados por el usuario.
 */
export function buildDefaultSplitRoutine(daysCount: GymDaysCount): ConfiguredDayRoutine[] {
  const baseDay1Push: ConfiguredDayRoutine = {
    dayId: 'push',
    dayNumber: 1,
    baseDayType: 'push',
    title: 'Día 1: Empuje (Base)',
    subtitle: 'Pecho, Hombros y Tríceps',
    exercises: [
      makeSlot('E0', 'abs_giro_ruso'),
      makeSlot('E1', 'press_plano'),
      makeSlot('E2', 'press_inclinado'),
      makeSlot('E3', 'mariposa_pec_deck'),
      makeSlot('E4', 'hombro_posterior'),
      makeSlot('E5', 'press_frances'),
      makeSlot('E6', 'triceps_polea'),
    ],
  };

  const baseDay2Legs: ConfiguredDayRoutine = {
    dayId: 'legs',
    dayNumber: 2,
    baseDayType: 'legs',
    title: 'Día 2: Piernas (Base)',
    subtitle: 'Cuádriceps, Isquios, Gemelos y Aductores',
    exercises: [
      makeSlot('E0', 'abs_giro_ruso'),
      makeSlot('E1', 'prensa_inclinada'),
      makeSlot('E2', 'sillon_cuadriceps'),
      makeSlot('E3', 'isquios_camilla'),
      makeSlot('E4', 'gemelos_sentado', { supportsDropSet: true }),
      makeSlot('E5', 'aductores_abductores', { isOptional: true }),
    ],
  };

  const baseDay3Pull: ConfiguredDayRoutine = {
    dayId: 'pull',
    dayNumber: 3,
    baseDayType: 'pull',
    title: 'Día 3: Tirón (Base)',
    subtitle: 'Espalda, Lumbares, Hombro Lateral y Bíceps',
    exercises: [
      makeSlot('E0', 'abs_giro_ruso'),
      makeSlot('E1', 'jalon_pecho', { supportsPulleySelector: true }),
      makeSlot('E2', 'remo_polea_maquina'),
      makeSlot('E3', 'extensiones_lumbares'),
      makeSlot('E4', 'vuelos_laterales'),
      makeSlot('E5', 'curl_biceps_inclinado'),
      makeSlot('E6', 'biceps_polea_prono'),
    ],
  };

  if (daysCount === 2) {
    // 2 Días: Compacta los ejercicios base del usuario en Día 1 (Tren Superior Base) y Día 2 (Piernas + Accesorios Base)
    return [
      {
        dayId: 'upper',
        dayNumber: 1,
        baseDayType: 'push',
        title: 'Día 1: Tren Superior (Base Compacto)',
        subtitle: 'Pecho, Espalda, Hombros y Tríceps Base',
        exercises: [
          makeSlot('E0', 'abs_giro_ruso'),
          makeSlot('E1', 'press_plano'),
          makeSlot('E2', 'press_inclinado'),
          makeSlot('E3', 'jalon_pecho', { supportsPulleySelector: true }),
          makeSlot('E4', 'remo_polea_maquina'),
          makeSlot('E5', 'press_militar'),
          makeSlot('E6', 'press_frances'),
        ],
      },
      {
        dayId: 'lower',
        dayNumber: 2,
        baseDayType: 'legs',
        title: 'Día 2: Piernas + Tirón/Brazos (Base Compacto)',
        subtitle: 'Prensa, Cuádriceps, Isquios, Gemelos y Bíceps Base',
        exercises: [
          makeSlot('E0', 'abs_giro_ruso'),
          makeSlot('E1', 'prensa_inclinada'),
          makeSlot('E2', 'sillon_cuadriceps'),
          makeSlot('E3', 'isquios_camilla'),
          makeSlot('E4', 'gemelos_sentado', { supportsDropSet: true }),
          makeSlot('E5', 'vuelos_laterales'),
          makeSlot('E6', 'curl_biceps_inclinado'),
        ],
      },
    ];
  }

  if (daysCount === 3) {
    return [baseDay1Push, baseDay2Legs, baseDay3Pull];
  }

  const extraDay4Upper: ConfiguredDayRoutine = {
    dayId: 'day4',
    dayNumber: 4,
    baseDayType: 'push',
    title: 'Día 4: Torso & Puntos Débiles',
    subtitle: 'Frecuencia 2 de Hombros, Pecho Superior, Dorsal y Brazos',
    exercises: [
      makeSlot('E0', 'abs_giro_ruso'),
      makeSlot('E1', 'press_militar'),
      makeSlot('E2', 'dominadas_neutras'),
      makeSlot('E3', 'press_inclinado'),
      makeSlot('E4', 'vuelos_laterales'),
      makeSlot('E5', 'curl_martillo'),
      makeSlot('E6', 'triceps_polea'),
    ],
  };

  if (daysCount === 4) {
    return [baseDay1Push, baseDay2Legs, baseDay3Pull, extraDay4Upper];
  }

  // daysCount === 5
  const extraDay5Lower: ConfiguredDayRoutine = {
    dayId: 'day5',
    dayNumber: 5,
    baseDayType: 'legs',
    title: 'Día 5: Pierna Posterior & Glúteo',
    subtitle: 'Frecuencia 2 de Piernas (Isquios, Glúteos y Cuádriceps)',
    exercises: [
      makeSlot('E0', 'abs_giro_ruso'),
      makeSlot('E1', 'peso_muerto_rumano'),
      makeSlot('E2', 'hip_thrust'),
      makeSlot('E3', 'sentadilla_hack'),
      makeSlot('E4', 'isquios_camilla'),
      makeSlot('E5', 'gemelos_sentado', { supportsDropSet: true }),
    ],
  };

  return [baseDay1Push, baseDay2Legs, baseDay3Pull, extraDay4Upper, extraDay5Lower];
}
