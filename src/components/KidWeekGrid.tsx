import { Fragment } from 'react'
import { Avatar } from '@/components/Avatar'
import { TaskGlyph } from '@/components/TaskGlyph'
import { iconColor, type IconStyle } from '@/lib/icons'
import { moneyOf } from '@/lib/money'
import type { WeekGrid } from '@/lib/data'
import type { Kid } from '@/lib/db/schema'

const cols = { gridTemplateColumns: '1.35fr repeat(7, 1fr)' }

function Cell({ count, today }: { count: number; today: boolean }) {
  return (
    <div className={`flex h-9 items-center justify-center rounded-lg ${today ? 'bg-indigo-50' : ''}`}>
      {count > 0 ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[10px] font-bold text-amber-900 shadow-sm">
          {count > 1 ? count : ''}
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
      )}
    </div>
  )
}

// Parte de un hijo en una semana: cuadrícula tareas × días (lun→dom).
export function KidWeekGrid({ kid, data, today }: { kid: Kid; data: WeekGrid; today: string }) {
  const { tasks, days, grid, dayCents } = data
  const money = moneyOf(kid)
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 font-display text-sm font-bold" style={{ color: kid.color }}>
        <Avatar emoji={kid.emoji} avatarUrl={kid.avatarUrl} name={kid.name} size={18} />
        {kid.name}
      </div>
      {tasks.length === 0 ? (
        <p className="px-1 pb-1 text-[11px] font-semibold text-[var(--ink-3)]">Sin tareas esta semana.</p>
      ) : (
        <div className="grid items-center gap-1" style={cols}>
          {/* cabecera de días */}
          <div />
          {days.map((d) => (
            <div key={d.ymd} className={`rounded-lg py-1 text-center ${d.ymd === today ? 'bg-indigo-100' : ''}`}>
              <div className="text-[10px] font-bold uppercase text-[var(--ink-3)]">{d.dow}</div>
              <div className="font-display text-xs font-bold text-[var(--head)]">{d.dom}</div>
            </div>
          ))}

          {/* filas de tareas */}
          {tasks.map((t) => (
            <Fragment key={t.id}>
              <div className="flex items-center gap-1.5 pr-1">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: t.color }}>
                  <TaskGlyph iconKey={t.iconKey} emoji={t.icon} style={kid.iconStyle as IconStyle} size={18} color={iconColor(t.color)} />
                </span>
                <span className="truncate text-[11px] font-semibold leading-tight text-[var(--ink)]">{t.name}</span>
              </div>
              {days.map((d, i) => (
                <Cell key={d.ymd} count={grid[t.id]?.[i] ?? 0} today={d.ymd === today} />
              ))}
            </Fragment>
          ))}

          {/* totales por día */}
          <div className="pr-1 text-right text-[11px] font-bold text-[var(--ink-3)]">Total</div>
          {dayCents.map((c, i) => (
            <div
              key={i}
              className={`rounded-lg py-1 text-center text-[10px] font-bold ${days[i].ymd === today ? 'bg-indigo-50' : ''} ${
                c > 0 ? 'text-emerald-600' : 'text-gray-300'
              }`}
            >
              {c > 0
                ? money.unit === 'pts'
                  ? String(Math.round((c / 100) * 100) / 100).replace('.', ',')
                  : (c / 100).toFixed(2).replace('.', ',')
                : '·'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
