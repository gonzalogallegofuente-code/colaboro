import Link from 'next/link'

export const dynamic = 'force-static'

// Política de privacidad y aviso legal (RGPD art. 13). Página pública.
export default function PrivacidadPage() {
  const h2 = 'mt-5 font-display text-base font-bold text-[var(--head)]'
  const p = 'mt-1 text-sm leading-relaxed text-[var(--ink-2)]'
  return (
    <main className="mx-auto max-w-md px-5 py-8 pb-16">
      <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--head)]">
        🔒 Privacidad y aviso legal
      </h1>
      <p className={p}>
        Colaboro es una aplicación familiar, sin ánimo comercial, para apuntar las tareas de casa de los hijos.
        Aquí te contamos, en claro, qué datos se guardan y para qué.
      </p>

      <div className="mt-4 rounded-2xl bg-[var(--card,#fff)] p-4 text-sm leading-relaxed text-[var(--ink-2)] shadow-sm ring-1 ring-black/5">
        <p className="font-bold text-[var(--head)]">En resumen</p>
        · Guardamos <b>lo mínimo</b>: tu email y contraseña (cifrada), el nombre o apodo de tus hijos con un avatar
        dibujado, y sus tareas apuntadas.
        <br />· <b>No</b> hay fotos, ni publicidad, ni analítica, ni cesión a terceros. Solo lo ve tu familia.
        <br />· Todo viaja cifrado (HTTPS) y las copias externas van cifradas.
        <br />· Puedes <b>borrarlo todo</b> cuando quieras en Ajustes → Cuenta, con efecto inmediato.
      </div>

      <h2 className={h2}>Responsable</h2>
      <p className={p}>
        El administrador de esta instancia familiar. Contacto para cualquier cuestión de datos:{' '}
        <a href="mailto:gonzalo.gallego.fuente@gmail.com" className="font-bold text-indigo-600 underline">
          gonzalo.gallego.fuente@gmail.com
        </a>
        .
      </p>

      <h2 className={h2}>Qué datos se guardan</h2>
      <p className={p}>
        · Del adulto: email y contraseña (guardada cifrada con hash, nunca en claro).
        <br />· De los hijos: el nombre (o apodo) y un avatar <b>dibujado o generado</b> (no se pueden subir
        fotos), junto con su actividad en la app (tareas apuntadas, premios, logros).
        <br />· Si activas los avisos: la suscripción de notificaciones de tu navegador.
        <br />· Las sugerencias se guardan <b>sin</b> registrar qué cuenta las envía.
      </p>

      <h2 className={h2}>Menores</h2>
      <p className={p}>
        Los datos de los menores los introducen y gestionan sus padres o tutores, que son quienes crean y
        controlan la cuenta familiar.
      </p>

      <h2 className={h2}>Para qué se usan</h2>
      <p className={p}>
        Solo para que la app funcione (llevar la cuenta de tareas, saldos y logros de tu familia). No hay
        publicidad, no hay analítica de terceros y no se ceden datos a nadie.
      </p>

      <h2 className={h2}>Cookies</h2>
      <p className={p}>
        Solo cookies técnicas de sesión (para mantenerte dentro). Ninguna de seguimiento ni de terceros.
      </p>

      <h2 className={h2}>Conservación y copias</h2>
      <p className={p}>
        Los datos se conservan mientras exista la cuenta. Se hacen copias de seguridad diarias; las copias
        externas se guardan <b>cifradas</b> y se eliminan a los 90 días.
      </p>

      <h2 className={h2}>Tus derechos</h2>
      <p className={p}>
        Puedes acceder, corregir o borrar tus datos cuando quieras: en <b>Ajustes → Cuenta</b> puedes cambiar la
        contraseña o <b>borrar la cuenta entera con todos sus datos</b> (efecto inmediato e irreversible).
        También puedes escribir al contacto de arriba, o reclamar ante la AEPD (aepd.es).
      </p>

      <h2 className={h2}>Seguridad</h2>
      <p className={p}>
        Conexión cifrada (HTTPS), contraseñas con hash, base de datos no accesible desde Internet y copias
        cifradas. El acceso por huella usa el estándar WebAuthn: tu huella nunca sale de tu móvil.
      </p>

      <div className="mt-8">
        <Link href="/login" className="font-bold text-indigo-600 underline">
          ← Volver a Colaboro
        </Link>
      </div>
    </main>
  )
}
