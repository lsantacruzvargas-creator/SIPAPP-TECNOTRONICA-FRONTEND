const formatoFecha = (fecha) =>
  new Date(fecha).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });

const ROL_LABEL = { admin: "Admin", vendedor: "Vendedor", tecnico: "Técnico", almacenero: "Almacenero" };

export default function PanelNotificaciones({ notificaciones, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[90]"
      onClick={onClose}
    >
      <div
        className="absolute bottom-4 left-4 md:left-64 w-[calc(100%-2rem)] max-w-sm bg-surface rounded-2xl shadow-2xl border border-line flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line shrink-0">
          <h4 className="font-semibold text-ink">Notificaciones</h4>
          <p className="text-xs text-ink-soft mt-0.5">Últimos cambios registrados en el sistema</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notificaciones.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-10">Sin novedades.</p>
          ) : (
            <ul className="divide-y divide-line">
              {notificaciones.map((n) => (
                <li key={n._id} className="px-5 py-3">
                  <p className="text-sm text-ink">{n.mensaje}</p>
                  <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1.5">
                    {n.usuarioRol && (
                      <span className="px-1.5 py-0.5 rounded-full bg-surface-hover text-ink-soft font-medium">
                        {ROL_LABEL[n.usuarioRol] ?? n.usuarioRol}
                      </span>
                    )}
                    <span>{n.usuarioNombre} · {formatoFecha(n.fecha)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
