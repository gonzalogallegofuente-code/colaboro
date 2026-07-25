// Iconos por EDAD (sistema nuevo, 2026-07): cada hijo elige Infantil o Juvenil
// (kids.theme) y con ello van el tema visual Y el juego de iconos completo.
// Los SVG viven en public/icons/{infantil|juvenil}/<slug>.svg (los copia
// scripts/copiar-iconos-edad.mjs desde las descargas de Flaticon).
// La asignación es automática: clave del catálogo → slug; si no, emoji → clave;
// si no, palabras del nombre; si no, un genérico. Ya no se elige icono a mano.
import { keyForEmoji } from '@/lib/icons'

export type Edad = 'infantil' | 'juvenil'

export function isEdad(v: string | null | undefined): v is Edad {
  return v === 'infantil' || v === 'juvenil'
}

// Clave del catálogo de tareas (Phosphor, ICON_CATALOG) → slug de concepto.
const TASK_BY_KEY: Record<string, string> = {
  // Limpieza
  broom: 'barrer',
  trash: 'basura',
  recycle: 'reciclar',
  toilet: 'bano',
  shower: 'ducha',
  bathtub: 'ducha',
  sparkle: 'fregar',
  drop: 'fregar',
  wind: 'polvo',
  feather: 'polvo',
  'hand-soap': 'cristales',
  // Cocina
  'cooking-pot': 'cocinar',
  'fork-knife': 'platos',
  'bowl-food': 'cocinar',
  coffee: 'refresco',
  hamburger: 'cocinar',
  pizza: 'cocinar',
  cake: 'cocinar',
  cookie: 'helado',
  // Ropa
  't-shirt': 'ropa',
  basket: 'lavadora',
  'washing-machine': 'lavadora',
  'coat-hanger': 'ropa',
  // Casa
  house: 'ordenar',
  door: 'ordenar',
  bed: 'cama',
  couch: 'ordenar',
  lamp: 'dormir',
  lightbulb: 'aprender',
  gift: 'regalo',
  // Naturaleza
  plant: 'regar',
  flower: 'regar',
  tree: 'regar',
  leaf: 'regar',
  sun: 'madrugar',
  moon: 'dormir',
  cloud: 'dormir',
  // Mascotas
  dog: 'perro',
  cat: 'gato',
  bird: 'perro',
  fish: 'perro',
  'paw-print': 'perro',
  bone: 'perro',
  // Cole y juego
  book: 'leer',
  books: 'leer',
  backpack: 'mochila',
  pencil: 'deberes',
  'soccer-ball': 'futbol',
  basketball: 'futbol',
  bicycle: 'bici',
  car: 'excursion',
  guitar: 'musica',
  'game-controller': 'videojuegos',
  palette: 'aprender',
  'music-notes': 'musica',
  // Cole y hábitos
  'graduation-cap': 'deberes',
  notebook: 'deberes',
  calculator: 'mates',
  brain: 'aprender',
  alarm: 'madrugar',
  clock: 'madrugar',
  tooth: 'dientes',
  barbell: 'ejercicio',
  'person-simple-run': 'ejercicio',
  'hand-heart': 'amable',
  handshake: 'amable',
  prohibit: 'palabrotas',
  'chat-circle': 'amable',
  // General
  star: 'estrella',
  heart: 'amable',
  'check-circle': 'estrella',
  'thumbs-up': 'estrella',
  smiley: 'amable',
  trophy: 'trofeo',
  medal: 'medalla',
  lightning: 'rayo',
  fire: 'fuego',
  crown: 'corona',
}

// Clave de recompensa (REWARD_CATALOG) → slug.
const REWARD_BY_KEY: Record<string, string> = {
  helado: 'helado',
  polo: 'helado',
  cupcake: 'helado',
  pizza: 'cocinar',
  hamburguesa: 'cocinar',
  palomitas: 'cine',
  refresco: 'refresco',
  fruta: 'refresco',
  tele: 'tele',
  videojuego: 'videojuegos',
  cartas: 'videojuegos',
  musica: 'musica',
  cine: 'cine',
  teatro: 'cine',
  foto: 'excursion',
  viaje: 'excursion',
  playa: 'excursion',
  acampada: 'excursion',
  coche: 'excursion',
  entrada: 'cine',
  bici: 'bici',
  tenis: 'futbol',
  pingpong: 'futbol',
  bolos: 'futbol',
  patines: 'bici',
  monopatin: 'bici',
  esqui: 'excursion',
  trofeo: 'trofeo',
  medalla: 'medalla',
  globos: 'parque',
  disco: 'musica',
  estrella: 'estrella',
  corazon: 'amable',
  dormir: 'dormir',
  mascota: 'perro',
  planta: 'regar',
}

// Emoji de medalla (badges.icon) → slug.
const BADGE_BY_EMOJI: Record<string, string> = {
  '🌱': 'primera',
  '💪': 'fuerza',
  '🏅': 'medalla',
  '🦸': 'campeon',
  '🌟': 'estrella',
  '⭐': 'estrella',
  '🔥': 'fuego',
  '⚡': 'rayo',
  '💎': 'diamante',
  '🤑': 'ganado',
  '👑': 'corona',
  '🏆': 'trofeo',
  '❤️': 'amable',
}

// Palabras del nombre de la tarea → slug (fallback para tareas sin icono
// reconocible). Se evalúan en orden; gana la primera.
const KEYWORDS: Array<[RegExp, string]> = [
  [/aspirad|aspirar/i, 'aspirar'],
  [/barrer|barre|escoba/i, 'barrer'],
  [/plato|lavavajilla|vajilla/i, 'platos'],
  [/fregar|friega|fregona/i, 'fregar'],
  [/polvo|plumero/i, 'polvo'],
  [/cristal|ventana/i, 'cristales'],
  [/v[áa]ter|inodoro|ba[ñn]o/i, 'bano'],
  [/ducha/i, 'ducha'],
  [/basura|papelera/i, 'basura'],
  [/recicl/i, 'reciclar'],
  [/diente|cepillar/i, 'dientes'],
  [/mesa/i, 'mesa'],
  [/cocin|comida|cena|desayun|merienda/i, 'cocinar'],
  [/lavadora|colada|tender/i, 'lavadora'],
  [/plancha/i, 'planchar'],
  [/ropa|armario|percha|doblar/i, 'ropa'],
  [/cama/i, 'cama'],
  [/orden|recog|habitaci[óo]n|cuarto|juguete/i, 'ordenar'],
  [/madrug|despert|levantar/i, 'madrugar'],
  [/dormir|acostar/i, 'dormir'],
  [/perro|pasear/i, 'perro'],
  [/gato|arena/i, 'gato'],
  [/planta|regar|riega|flor/i, 'regar'],
  [/deberes/i, 'deberes'],
  [/leer|lectura|libro/i, 'leer'],
  [/mates|matem[áa]t|calcul|estudi|examen/i, 'mates'],
  [/mochila/i, 'mochila'],
  [/ejercicio|deporte|correr|gimnas|entrena/i, 'ejercicio'],
  [/palabrota|taco/i, 'palabrotas'],
  [/amable|ayudar|compartir|herman/i, 'amable'],
  [/videojueg|consola|play|switch/i, 'videojuegos'],
  [/tele|peli|serie/i, 'tele'],
  [/cine/i, 'cine'],
  [/helado/i, 'helado'],
  [/m[úu]sica/i, 'musica'],
  [/f[úu]tbol|bal[óo]n/i, 'futbol'],
  [/bici|patinete/i, 'bici'],
  [/excursi[óo]n|paseo/i, 'excursion'],
  [/parque/i, 'parque'],
  [/paga|dinero/i, 'paga'],
  [/regalo|sorpresa/i, 'regalo'],
]

// Galería para "Cambiar dibujo": todos los slugs disponibles, agrupados.
export type SlugGrupo = { label: string; slugs: Array<{ slug: string; label: string }> }
export const SLUG_GRUPOS: SlugGrupo[] = [
  { label: 'Limpieza', slugs: [
    { slug: 'barrer', label: 'Barrer' }, { slug: 'fregar', label: 'Fregar' },
    { slug: 'aspirar', label: 'Aspirar' }, { slug: 'polvo', label: 'Polvo' },
    { slug: 'cristales', label: 'Cristales' }, { slug: 'bano', label: 'Baño' },
    { slug: 'ducha', label: 'Ducha' }, { slug: 'basura', label: 'Basura' },
    { slug: 'reciclar', label: 'Reciclar' }, { slug: 'dientes', label: 'Dientes' },
  ] },
  { label: 'Cocina y ropa', slugs: [
    { slug: 'cocinar', label: 'Cocinar' }, { slug: 'mesa', label: 'Mesa' },
    { slug: 'platos', label: 'Platos' }, { slug: 'lavadora', label: 'Lavadora' },
    { slug: 'planchar', label: 'Planchar' }, { slug: 'ropa', label: 'Ropa' },
  ] },
  { label: 'Casa', slugs: [
    { slug: 'cama', label: 'Cama' }, { slug: 'ordenar', label: 'Ordenar' },
    { slug: 'madrugar', label: 'Madrugar' }, { slug: 'dormir', label: 'Dormir' },
    { slug: 'perro', label: 'Perro' }, { slug: 'gato', label: 'Gato' },
    { slug: 'regar', label: 'Regar' },
  ] },
  { label: 'Cole y hábitos', slugs: [
    { slug: 'deberes', label: 'Deberes' }, { slug: 'leer', label: 'Leer' },
    { slug: 'mates', label: 'Mates' }, { slug: 'mochila', label: 'Mochila' },
    { slug: 'aprender', label: 'Aprender' }, { slug: 'ejercicio', label: 'Ejercicio' },
    { slug: 'palabrotas', label: 'No palabrotas' }, { slug: 'amable', label: 'Ser amable' },
  ] },
  { label: 'Ocio', slugs: [
    { slug: 'videojuegos', label: 'Videojuegos' }, { slug: 'tele', label: 'Tele' },
    { slug: 'cine', label: 'Cine' }, { slug: 'helado', label: 'Helado' },
    { slug: 'refresco', label: 'Refresco' }, { slug: 'batido', label: 'Batido' },
    { slug: 'musica', label: 'Música' }, { slug: 'futbol', label: 'Fútbol' },
    { slug: 'bici', label: 'Bici' }, { slug: 'excursion', label: 'Excursión' },
    { slug: 'parque', label: 'Parque' }, { slug: 'megafono', label: 'Megáfono' },
  ] },
  { label: 'Premios', slugs: [
    { slug: 'paga', label: 'Paga' }, { slug: 'regalo', label: 'Regalo' },
    { slug: 'primera', label: 'Brote' }, { slug: 'fuerza', label: 'Fuerza' },
    { slug: 'medalla', label: 'Medalla' }, { slug: 'campeon', label: 'Campeón' },
    { slug: 'estrella', label: 'Estrella' }, { slug: 'fuego', label: 'Fuego' },
    { slug: 'rayo', label: 'Rayo' }, { slug: 'diamante', label: 'Diamante' },
    { slug: 'ganado', label: 'Ganancias' }, { slug: 'corona', label: 'Corona' },
    { slug: 'trofeo', label: 'Trofeo' },
  ] },
]

const SLUG_SET = new Set(SLUG_GRUPOS.flatMap((g) => g.slugs.map((s) => s.slug)))

export function isIconSlug(v: string | null | undefined): v is string {
  return !!v && SLUG_SET.has(v)
}

function src(edad: Edad, slug: string): string {
  return `/icons/${edad}/${slug}.svg`
}

// Icono de una tarea. Prioridad: dibujo FIJADO a mano (iconSlug) → clave
// elegida → palabras del NOMBRE (lo más específico) → emoji heredado.
// Siempre devuelve una ruta (genérico: estrella).
export function edadTaskSrc(
  edad: Edad,
  t: { iconSlug?: string | null; iconKey?: string | null; emoji?: string | null; name?: string | null },
): string {
  if (isIconSlug(t.iconSlug)) return src(edad, t.iconSlug)
  let slug: string | undefined
  if (t.iconKey) slug = TASK_BY_KEY[t.iconKey]
  if (!slug && t.name) {
    for (const [re, s] of KEYWORDS) {
      if (re.test(t.name)) {
        slug = s
        break
      }
    }
  }
  if (!slug && t.emoji) {
    const k = keyForEmoji(t.emoji)
    if (k) slug = TASK_BY_KEY[k]
  }
  return src(edad, slug ?? 'estrella')
}

// Icono de una recompensa. Genérico: regalo.
export function edadRewardSrc(
  edad: Edad,
  r: { iconSlug?: string | null; iconKey?: string | null; emoji?: string | null; name?: string | null },
): string {
  if (isIconSlug(r.iconSlug)) return src(edad, r.iconSlug)
  let slug = r.iconKey ? REWARD_BY_KEY[r.iconKey] : undefined
  if (!slug && r.name) {
    for (const [re, s] of KEYWORDS) {
      if (re.test(r.name)) {
        slug = s
        break
      }
    }
  }
  return src(edad, slug ?? 'regalo')
}

// Icono de una medalla (por su emoji). Genérico: medalla.
export function edadBadgeSrc(edad: Edad, icon: string): string {
  return src(edad, BADGE_BY_EMOJI[icon] ?? 'medalla')
}
