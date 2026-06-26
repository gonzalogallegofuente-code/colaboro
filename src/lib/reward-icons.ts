export type RewardIconDef = { key: string; emoji: string; label: string }
export type RewardCategory = { label: string; icons: RewardIconDef[] }

export const REWARD_CATALOG: RewardCategory[] = [
  { label: 'Comida', icons: [
    { key: 'helado', emoji: '🍨', label: 'Helado' },
    { key: 'polo', emoji: '🍦', label: 'Polo' },
    { key: 'cupcake', emoji: '🧁', label: 'Cupcake' },
    { key: 'pizza', emoji: '🍕', label: 'Pizza' },
    { key: 'hamburguesa', emoji: '🍔', label: 'Hamburguesa' },
    { key: 'palomitas', emoji: '🍿', label: 'Palomitas' },
    { key: 'refresco', emoji: '🥤', label: 'Refresco' },
    { key: 'fruta', emoji: '🍎', label: 'Fruta' },
  ] },
  { label: 'Pantalla y juegos', icons: [
    { key: 'tele', emoji: '📺', label: 'Pantalla' },
    { key: 'videojuego', emoji: '🎮', label: 'Videojuego' },
    { key: 'cartas', emoji: '🃏', label: 'Cartas' },
    { key: 'musica', emoji: '🎧', label: 'Música' },
    { key: 'cine', emoji: '🎬', label: 'Cine' },
    { key: 'teatro', emoji: '🎭', label: 'Teatro' },
    { key: 'foto', emoji: '📷', label: 'Foto' },
  ] },
  { label: 'Salidas', icons: [
    { key: 'viaje', emoji: '✈️', label: 'Viaje' },
    { key: 'playa', emoji: '🌴', label: 'Playa' },
    { key: 'acampada', emoji: '⛺', label: 'Acampada' },
    { key: 'coche', emoji: '🚗', label: 'Excursión' },
    { key: 'entrada', emoji: '🎟️', label: 'Entrada' },
  ] },
  { label: 'Deporte', icons: [
    { key: 'bici', emoji: '🚲', label: 'Bici' },
    { key: 'tenis', emoji: '🎾', label: 'Tenis' },
    { key: 'pingpong', emoji: '🏓', label: 'Ping-pong' },
    { key: 'bolos', emoji: '🎳', label: 'Bolos' },
    { key: 'patines', emoji: '🛼', label: 'Patines' },
    { key: 'monopatin', emoji: '🛹', label: 'Monopatín' },
    { key: 'esqui', emoji: '🎿', label: 'Esquí' },
    { key: 'trofeo', emoji: '🏆', label: 'Trofeo' },
    { key: 'medalla', emoji: '🏅', label: 'Medalla' },
  ] },
  { label: 'Premios', icons: [
    { key: 'globos', emoji: '🎈', label: 'Fiesta' },
    { key: 'disco', emoji: '🪩', label: 'Baile' },
    { key: 'estrella', emoji: '⭐', label: 'Estrella' },
    { key: 'corazon', emoji: '❤️', label: 'Corazón' },
    { key: 'dormir', emoji: '😴', label: 'Dormir' },
    { key: 'mascota', emoji: '🐾', label: 'Mascota' },
    { key: 'planta', emoji: '🪴', label: 'Planta' },
  ] },
]

export const REWARD_BY_KEY: Record<string, RewardIconDef> = Object.fromEntries(
  REWARD_CATALOG.flatMap((c) => c.icons).map((i) => [i.key, i]),
)
