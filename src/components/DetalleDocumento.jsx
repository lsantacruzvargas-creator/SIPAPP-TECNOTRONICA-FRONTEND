import { useState } from "react";
import DetalleCotizacion from "./DetalleCotizacion";
import DetalleOrdenTrabajo from "./DetalleOrdenTrabajo";
import DetalleOrdenCompra from "./DetalleOrdenCompra";
import DetalleFactura from "./DetalleFactura";

// Router interno de detalle: al navegar entre documentos relacionados
// (Cotización ↔ OT ↔ OC ↔ Factura) se reemplaza la vista actual en vez de
// anidar un segundo overlay encima — un solo overlay vivo a la vez.
export default function DetalleDocumento({ tipo, data, onClose, onCotizacionGuardada, onOTActualizada, onOCGuardada, onFacturaGuardada }) {
  const [vista, setVista] = useState({ tipo, data });

  const navegar = ({ tipo, data }) => setVista({ tipo, data });

  if (vista.tipo === "ot") {
    return (
      <DetalleOrdenTrabajo
        orden={vista.data}
        onNavegar={navegar}
        onClose={onClose}
        onActualizada={onOTActualizada}
      />
    );
  }

  if (vista.tipo === "oc") {
    return (
      <DetalleOrdenCompra
        orden={vista.data}
        onNavegar={navegar}
        onClose={onClose}
        onGuardada={onOCGuardada}
      />
    );
  }

  if (vista.tipo === "factura") {
    return (
      <DetalleFactura
        factura={vista.data}
        onNavegar={navegar}
        onClose={onClose}
        onGuardada={onFacturaGuardada}
      />
    );
  }

  return (
    <DetalleCotizacion
      cotizacion={vista.data}
      onNavegar={navegar}
      onClose={onClose}
      onSaved={onCotizacionGuardada}
    />
  );
}
