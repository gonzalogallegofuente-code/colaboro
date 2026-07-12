// Copia los iconos por edad desde las carpetas de descargas de Flaticon (Dropbox)
// a public/icons/{infantil|juvenil}/<slug>.svg, limpiándolos por el camino.
// Re-ejecutable: para cambiar un icono, ajusta su ruta aquí y vuelve a correr
//   node scripts/copiar-iconos-edad.mjs
// Infantil = estilo 3D con degradado (Freepik style 131). Juvenil = plano
// redondeado (Freepik "Basic Rounded flat" + packs planos afines).
import fs from 'node:fs'
import path from 'node:path'

const INF = 'C:/Users/corre/Dropbox/GALLEGO/ia/colabora/flaticon infantil'
const JUV = 'C:/Users/corre/Dropbox/GALLEGO/ia/colabora/flaticon'

// slug → [ruta infantil, ruta juvenil]
const MAPA = {
  // Limpieza e higiene
  barrer: [`${INF}/brush.svg`, `${JUV}/2236553-cleaning/svg/039-broom.svg`],
  fregar: [`${INF}/cleaning-tools.svg`, `${JUV}/2236553-cleaning/svg/027-mop.svg`],
  aspirar: [`${INF}/cleaning-tools.svg`, `${JUV}/1169349-cleaning/svg/019-vacuum-cleaner.svg`],
  polvo: [`${INF}/limpieza-de-primavera.svg`, `${JUV}/1169349-cleaning/svg/035-duster.svg`],
  cristales: [`${INF}/disinfectant.svg`, `${JUV}/1169349-cleaning/svg/028-window.svg`],
  bano: [`${INF}/2042948-furnitures/svg/019-toilet.svg`, `${JUV}/1169349-cleaning/svg/001-toilet.svg`],
  ducha: [`${INF}/2042948-furnitures/svg/001-shower.svg`, `${JUV}/2792580-bathroom/svg/013-shower.svg`],
  basura: [`${INF}/2766374-city/svg/025-trash can.svg`, `${JUV}/2236553-cleaning/svg/046-trash can.svg`],
  reciclar: [`${INF}/1374932-ecology/svg/001-recycle.svg`, `${JUV}/1169349-cleaning/svg/010-recycle.svg`],
  dientes: [`${INF}/toothbrush.svg`, `${JUV}/2792580-bathroom/svg/003-toothbrush.svg`],
  // Cocina y ropa
  cocinar: [`${INF}/stew.svg`, `${JUV}/4505925-cooking/svg/004-pan.svg`],
  mesa: [`${INF}/2042948-furnitures/svg/039-Dining table.svg`, `${JUV}/4505925-cooking/svg/006-tray.svg`],
  platos: [`${INF}/2042948-furnitures/svg/015-sink.svg`, `${JUV}/1169349-cleaning/svg/021-dish.svg`],
  lavadora: [`${INF}/2042948-furnitures/svg/005-washing machine.svg`, `${JUV}/1169349-cleaning/svg/009-washing-machine.svg`],
  planchar: [`${INF}/2042948-furnitures/svg/024-iron.svg`, `${JUV}/1169349-cleaning/svg/008-ironing.svg`],
  ropa: [`${INF}/2042948-furnitures/svg/046-closet.svg`, `${JUV}/1169349-cleaning/svg/038-hanger.svg`],
  // Casa y hábitos
  cama: [`${INF}/2042948-furnitures/svg/023-bed.svg`, `${JUV}/hacer-la-cama.svg`],
  ordenar: [`${INF}/2042948-furnitures/svg/011-drawer.svg`, `${JUV}/392809-daily-routine-objects-actions/svg/057-box.svg`],
  madrugar: [`${INF}/2042948-furnitures/svg/027-cuckoo clock.svg`, `${JUV}/392809-daily-routine-objects-actions/svg/060-alarm-clock.svg`],
  dormir: [`${INF}/2042948-furnitures/svg/023-bed.svg`, `${JUV}/392809-daily-routine-objects-actions/svg/023-sleep.svg`],
  perro: [`${INF}/corgi.svg`, `${JUV}/392809-daily-routine-objects-actions/svg/032-pet.svg`],
  gato: [`${INF}/cat.svg`, `${JUV}/392809-daily-routine-objects-actions/svg/032-pet.svg`],
  regar: [`${INF}/1374932-ecology/svg/014-watering.svg`, `${JUV}/4578565-motivation/svg/010-plant.svg`],
  // Cole
  deberes: [`${INF}/pencil.svg`, `${JUV}/4696639-learning/svg/004-study.svg`],
  leer: [`${INF}/books.svg`, `${JUV}/4696639-learning/svg/034-read.svg`],
  mates: [`${INF}/calculator.svg`, `${JUV}/4696639-learning/svg/008-calculator.svg`],
  mochila: [`${INF}/school-bag.svg`, `${JUV}/4472506-teenager/svg/015-backpack.svg`],
  aprender: [`${INF}/brain.svg`, `${JUV}/4696639-learning/svg/045-idea.svg`],
  ejercicio: [`${INF}/run.svg`, `${JUV}/4472506-teenager/svg/040-dumbbells.svg`],
  palabrotas: [`${JUV}/cerrar.svg`, `${JUV}/sonriente.svg`],
  amable: [`${INF}/hearts.svg`, `${JUV}/heart.svg`],
  // Ocio y recompensas
  videojuegos: [`${INF}/8853711-games/svg/001-console.svg`, `${JUV}/4472506-teenager/svg/044-game console.svg`],
  tele: [`${INF}/2665794-film-industry/svg/013-television.svg`, `${JUV}/4472506-teenager/svg/031-tv.svg`],
  cine: [`${INF}/2665794-film-industry/svg/001-popcorn.svg`, `${JUV}/392809-daily-routine-objects-actions/svg/015-ticket.svg`],
  helado: [`${INF}/ice-cream-cone.svg`, `${JUV}/938113-ice-cream-shop/svg/005-ice-cream-13.svg`],
  refresco: [`${INF}/7219955-beverages/svg/041-soda can.svg`, `${JUV}/4472506-teenager/svg/030-soda.svg`],
  batido: [`${INF}/7219955-beverages/svg/010-milkshake.svg`, `${JUV}/938113-ice-cream-shop/svg/019-milkshake.svg`],
  musica: [`${INF}/3d-headphone.svg`, `${JUV}/4472506-teenager/svg/022-headphones.svg`],
  futbol: [`${INF}/football.svg`, `${JUV}/4472506-teenager/svg/043-soccer.svg`],
  bici: [`${INF}/2766374-city/svg/028-bicycle.svg`, `${JUV}/4759010-outdoor-activities/svg/043-bicycle.svg`],
  excursion: [`${INF}/2766374-city/svg/014-car.svg`, `${JUV}/4759010-outdoor-activities/svg/013-tent.svg`],
  parque: [`${INF}/2766374-city/svg/037-ferris wheel.svg`, `${JUV}/4759010-outdoor-activities/svg/009-swing.svg`],
  paga: [`${INF}/8853711-games/svg/009-money.svg`, `${JUV}/4328119-success/svg/034-money bag.svg`],
  regalo: [`${INF}/8853711-games/svg/041-mystery box.svg`, `${JUV}/4328119-success/svg/050-gift.svg`],
  // Medallas
  primera: [`${INF}/1374932-ecology/svg/024-sprout.svg`, `${JUV}/4578565-motivation/svg/026-startup.svg`],
  fuerza: [`${INF}/fists.svg`, `${JUV}/4578565-motivation/svg/004-fist.svg`],
  medalla: [`${INF}/gold-medal.svg`, `${JUV}/1435673-reward-badges/svg/011-medal.svg`],
  campeon: [`${INF}/8853711-games/svg/040-win.svg`, `${JUV}/4578565-motivation/svg/036-superheroe.svg`],
  estrella: [`${INF}/3d-star.svg`, `${JUV}/744916-medals-and-rewards/svg/030-star.svg`],
  fuego: [`${INF}/3d-fire.svg`, `${JUV}/4759010-outdoor-activities/svg/002-bonfire.svg`],
  rayo: [`${INF}/lightning.svg`, `${JUV}/thunder.svg`],
  diamante: [`${INF}/8853711-games/svg/021-gem.svg`, `${JUV}/4578565-motivation/svg/003-diamond.svg`],
  ganado: [`${INF}/8853711-games/svg/009-money.svg`, `${JUV}/4578565-motivation/svg/002-earn.svg`],
  corona: [`${INF}/crown.svg`, `${JUV}/1435673-reward-badges/svg/040-crown.svg`],
  trofeo: [`${INF}/trophy.svg`, `${JUV}/4578565-motivation/svg/039-trophy.svg`],
  megafono: [`${INF}/megafono.svg`, `${JUV}/4578565-motivation/svg/009-megaphone.svg`],
}

function limpiar(svg) {
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<g>\s*<\/g>/g, '')
    .replace(/>\s+</g, '><')
    .trim()
}

const raiz = path.join(process.cwd(), 'public', 'icons')
let n = 0
const errores = []
for (const [edad, idx] of [['infantil', 0], ['juvenil', 1]]) {
  const dir = path.join(raiz, edad)
  fs.mkdirSync(dir, { recursive: true })
  for (const [slug, rutas] of Object.entries(MAPA)) {
    try {
      const svg = limpiar(fs.readFileSync(rutas[idx], 'utf8'))
      fs.writeFileSync(path.join(dir, slug + '.svg'), svg)
      n++
    } catch {
      errores.push(`${edad}/${slug} ← ${rutas[idx]}`)
    }
  }
}
console.log(`OK: ${n} iconos escritos en public/icons/{infantil,juvenil}`)
if (errores.length) {
  console.log('ERRORES:')
  errores.forEach((e) => console.log(' - ' + e))
  process.exit(1)
}
