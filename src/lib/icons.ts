// Catálogo de iconos elegibles para las tareas. Cada icono tiene una CLAVE
// (nombre Phosphor, ver icon-paths.ts), un emoji equivalente (estilo "Emoji")
// y una etiqueta en español. El estilo se elige por hijo (kids.icon_style).
export type IconStyle = 'emoji' | 'line' | 'fill'
export type IconDef = { key: string; emoji: string; label: string }
export type IconCategory = { label: string; icons: IconDef[] }

export const ICON_CATALOG: IconCategory[] = [
  {
    label: 'Limpieza',
    icons: [
      { key: 'broom', emoji: '🧹', label: 'Barrer' },
      { key: 'trash', emoji: '🗑️', label: 'Basura' },
      { key: 'recycle', emoji: '♻️', label: 'Reciclar' },
      { key: 'toilet', emoji: '🚽', label: 'Váter' },
      { key: 'shower', emoji: '🚿', label: 'Ducha' },
      { key: 'bathtub', emoji: '🛁', label: 'Bañera' },
      { key: 'sparkle', emoji: '✨', label: 'Limpiar' },
      { key: 'drop', emoji: '💧', label: 'Fregar' },
      { key: 'wind', emoji: '🌬️', label: 'Aire' },
      { key: 'feather', emoji: '🪶', label: 'Polvo' },
      { key: 'hand-soap', emoji: '🧴', label: 'Jabón' },
      { key: 'paint-brush', emoji: '🖌️', label: 'Pincel' },
      { key: 'paint-roller', emoji: '🪣', label: 'Pintar' },
    ],
  },
  {
    label: 'Cocina',
    icons: [
      { key: 'cooking-pot', emoji: '🍳', label: 'Cocinar' },
      { key: 'fork-knife', emoji: '🍽️', label: 'Platos' },
      { key: 'bowl-food', emoji: '🍲', label: 'Comida' },
      { key: 'coffee', emoji: '☕', label: 'Café' },
      { key: 'hamburger', emoji: '🍔', label: 'Hamburguesa' },
      { key: 'pizza', emoji: '🍕', label: 'Pizza' },
      { key: 'cake', emoji: '🍰', label: 'Tarta' },
      { key: 'cookie', emoji: '🍪', label: 'Galleta' },
    ],
  },
  {
    label: 'Ropa',
    icons: [
      { key: 't-shirt', emoji: '👕', label: 'Ropa' },
      { key: 'basket', emoji: '🧺', label: 'Cesta' },
      { key: 'washing-machine', emoji: '🌀', label: 'Lavadora' },
      { key: 'coat-hanger', emoji: '🧥', label: 'Percha' },
    ],
  },
  {
    label: 'Casa',
    icons: [
      { key: 'house', emoji: '🏠', label: 'Casa' },
      { key: 'door', emoji: '🚪', label: 'Puerta' },
      { key: 'bed', emoji: '🛏️', label: 'Cama' },
      { key: 'couch', emoji: '🛋️', label: 'Sofá' },
      { key: 'lamp', emoji: '🪔', label: 'Lámpara' },
      { key: 'lightbulb', emoji: '💡', label: 'Luz' },
      { key: 'gift', emoji: '🎁', label: 'Regalo' },
    ],
  },
  {
    label: 'Naturaleza',
    icons: [
      { key: 'plant', emoji: '🪴', label: 'Planta' },
      { key: 'flower', emoji: '🌸', label: 'Flor' },
      { key: 'tree', emoji: '🌳', label: 'Árbol' },
      { key: 'leaf', emoji: '🍃', label: 'Hoja' },
      { key: 'sun', emoji: '☀️', label: 'Sol' },
      { key: 'moon', emoji: '🌙', label: 'Luna' },
      { key: 'cloud', emoji: '☁️', label: 'Nube' },
    ],
  },
  {
    label: 'Mascotas',
    icons: [
      { key: 'dog', emoji: '🐶', label: 'Perro' },
      { key: 'cat', emoji: '🐱', label: 'Gato' },
      { key: 'bird', emoji: '🐦', label: 'Pájaro' },
      { key: 'fish', emoji: '🐟', label: 'Pez' },
      { key: 'paw-print', emoji: '🐾', label: 'Huella' },
      { key: 'bone', emoji: '🦴', label: 'Hueso' },
    ],
  },
  {
    label: 'Cole y juego',
    icons: [
      { key: 'book', emoji: '📖', label: 'Libro' },
      { key: 'books', emoji: '📚', label: 'Libros' },
      { key: 'backpack', emoji: '🎒', label: 'Mochila' },
      { key: 'pencil', emoji: '✏️', label: 'Lápiz' },
      { key: 'soccer-ball', emoji: '⚽', label: 'Fútbol' },
      { key: 'basketball', emoji: '🏀', label: 'Baloncesto' },
      { key: 'bicycle', emoji: '🚲', label: 'Bici' },
      { key: 'car', emoji: '🚗', label: 'Coche' },
      { key: 'guitar', emoji: '🎸', label: 'Guitarra' },
      { key: 'game-controller', emoji: '🎮', label: 'Videojuego' },
      { key: 'palette', emoji: '🎨', label: 'Pintura' },
      { key: 'music-notes', emoji: '🎵', label: 'Música' },
    ],
  },
  {
    label: 'Cole y hábitos',
    icons: [
      { key: 'graduation-cap', emoji: '🎓', label: 'Estudiar' },
      { key: 'notebook', emoji: '📓', label: 'Deberes' },
      { key: 'calculator', emoji: '🧮', label: 'Mates' },
      { key: 'brain', emoji: '🧠', label: 'Aprender' },
      { key: 'alarm', emoji: '⏰', label: 'Madrugar' },
      { key: 'clock', emoji: '🕐', label: 'Puntual' },
      { key: 'tooth', emoji: '🦷', label: 'Dientes' },
      { key: 'barbell', emoji: '🏋️', label: 'Ejercicio' },
      { key: 'person-simple-run', emoji: '🏃', label: 'Correr' },
      { key: 'hand-heart', emoji: '🫶', label: 'Ser amable' },
      { key: 'handshake', emoji: '🤝', label: 'Compartir' },
      { key: 'prohibit', emoji: '🤐', label: 'No palabrotas' },
      { key: 'chat-circle', emoji: '💬', label: 'Hablar bien' },
    ],
  },
  {
    label: 'General',
    icons: [
      { key: 'star', emoji: '⭐', label: 'Estrella' },
      { key: 'heart', emoji: '❤️', label: 'Corazón' },
      { key: 'check-circle', emoji: '✅', label: 'Hecho' },
      { key: 'thumbs-up', emoji: '👍', label: 'Bien' },
      { key: 'smiley', emoji: '🙂', label: 'Cara' },
      { key: 'trophy', emoji: '🏆', label: 'Trofeo' },
      { key: 'medal', emoji: '🏅', label: 'Medalla' },
      { key: 'lightning', emoji: '⚡', label: 'Rayo' },
      { key: 'fire', emoji: '🔥', label: 'Fuego' },
      { key: 'crown', emoji: '👑', label: 'Corona' },
    ],
  },
]

const ALL = ICON_CATALOG.flatMap((c) => c.icons)

export const ICON_BY_KEY: Record<string, IconDef> = Object.fromEntries(ALL.map((i) => [i.key, i]))

// Para rellenar la clave a partir del emoji que ya tenían las tareas.
export const KEY_BY_EMOJI: Record<string, string> = Object.fromEntries(ALL.map((i) => [i.emoji, i.key]))

// Mapa extra para emojis de las tareas por defecto que no están en el catálogo.
export const LEGACY_EMOJI_KEY: Record<string, string> = {
  '🪟': 'sparkle', // cristales
}

export function keyForEmoji(emoji: string | null | undefined): string | null {
  if (!emoji) return null
  return KEY_BY_EMOJI[emoji] ?? LEGACY_EMOJI_KEY[emoji] ?? null
}
