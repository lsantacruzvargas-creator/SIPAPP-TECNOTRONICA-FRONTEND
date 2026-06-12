 import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo_tecnotronica.png";
import firma from "../assets/firma_tecnotronica.JPEG";

export const exportarCotizacionPdf = (cotizacion, ingresoEquipo = null) => {
  const doc = new jsPDF();
  const empresa = cotizacion.empresa;
  let y = 18;
  const W = 210;
  const margin = 12;

  // ─── LOGO EN COLOR ───────────────────────────────────────────────────────
  doc.addImage(logo, "JPG", margin, 8, 180, 25);
  //   y += 15;
  // doc.setFontSize(10);
  // doc.setFont("arial", "bold");
  // doc.text(`Ingeniería electrónica Industrial www.tecnotronica.com.pe`, margin + 80, y, { align: "center" });


  // ─── FECHA ───────────────────────────────────────────────────────
  y += 18;
  doc.setFontSize(9);
  const _f = new Date(cotizacion.fecha);
  const fechaStr = `${_f.getUTCDate()} de ${_f.toLocaleDateString("es-PE", { month: "long", timeZone: "UTC" })} del ${_f.getUTCFullYear()}`;
  doc.text(`Callao, ${fechaStr}`, 196, y, { align: "right" });

  // ─── ENCABEZADO IZQUIERDO ───────────────────────────────────────────────────
  y += 6;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Presupuesto N° ${cotizacion.codigo}`, margin, y, { align: "left" });


  // ─── DATOS EMISOR (centro bajo logo) ─────────────────────────────────────
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Señores: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(empresa.razonSocial, margin + doc.getTextWidth("Señores:__")+4, y);

  if (cotizacion.atencion) {
    y += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Atención: ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.atencion, margin + doc.getTextWidth("Atención::_")+ 5, y);
  }


  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Referencia: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(cotizacion.referencia, margin + doc.getTextWidth("Referencia:__"), y);

  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Presente.- ", margin, y);


  y += 15;
  const colLabel = 20;
  const colValue = 80;
  const rowH = 6;
  const cellY = (ry) => ry - 4;
  let yy = y;
  doc.setFontSize(9);
  const _campo = (label, valor) => {
    doc.rect(margin, cellY(yy), colLabel, rowH);
    doc.rect(margin + colLabel, cellY(yy), colValue, rowH);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin + 1, yy);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margin + colLabel + 1, yy);
    yy += rowH;
  };

  if (cotizacion.modulo)  _campo("Módulo:",  cotizacion.modulo);
  if (cotizacion.tarjeta) _campo("Tarjeta:", cotizacion.tarjeta);
  if (cotizacion.equipo)  _campo("Equipo:",  cotizacion.equipo);
 

  if (ingresoEquipo && (ingresoEquipo.marca || ingresoEquipo.modelo || ingresoEquipo.numeroSerie || ingresoEquipo.linea || ingresoEquipo.voltaje || ingresoEquipo.potencia)) {
    const colLabel = 18;
    const colValue = 62;
    const rowH = 6;
    const cellY = (ry) => ry - 4;
    const xx = 120;
    const xy = 17;
    doc.setFontSize(9);

    y += -20;
    // doc.setFontSize(9);
    // doc.setFont("helvetica", "bold");
    // doc.setFillColor(220, 220, 220);
    // doc.rect(margin + xx, cellY(y), colLabel + colValue - xy, rowH, "FD");
    // doc.text("Referencia", margin + 1 + xx, y);

     if (cotizacion.solped) {
      y += rowH;
      doc.rect(margin + xx, cellY(y), colLabel, rowH);
      doc.rect(margin + xx + colLabel, cellY(y), colValue - xy, rowH);
      doc.setFont("helvetica", "bold");
      doc.text("SOLPED:", margin + 1 + xx, y);
      doc.setFont("helvetica", "normal");
      doc.text(cotizacion.solped, margin + xx + colLabel + 1, y);
    }

    if (ingresoEquipo.marca) {
      y += rowH;
      doc.rect(margin + xx, cellY(y), colLabel, rowH);
      doc.rect(margin + xx + colLabel, cellY(y), colValue - xy, rowH);
      doc.setFont("helvetica", "bold");
      doc.text("Marca:", margin + 1 + xx, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.marca, margin + xx + colLabel + 1, y);
    }

    if (ingresoEquipo.modelo) {
      y += rowH;
      doc.rect(margin + xx, cellY(y), colLabel, rowH);
      doc.rect(margin + xx + colLabel, cellY(y), colValue - xy, rowH);
      doc.setFont("helvetica", "bold");
      doc.text("Modelo:", margin + 1 + xx, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.modelo, margin + xx + colLabel + 1, y);
    }

    if (ingresoEquipo?.numeroSerie) {
      y += rowH;
      doc.rect(margin + xx, cellY(y), colLabel, rowH);
      doc.rect(margin + xx + colLabel, cellY(y), colValue - xy, rowH);
      doc.setFont("helvetica", "bold");
      doc.text("N° Serie:", margin + 1 + xx, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.numeroSerie, margin + xx + colLabel + 1, y);
    }

    if (ingresoEquipo?.linea) {
      y += rowH;
      doc.rect(margin + xx, cellY(y), colLabel, rowH);
      doc.rect(margin + xx + colLabel, cellY(y), colValue - xy, rowH);
      doc.setFont("helvetica", "bold");
      doc.text("Línea:", margin + 1 + xx, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.linea, margin + xx + colLabel + 1, y);
    }

    if (ingresoEquipo?.voltaje) {
      y += rowH;
      doc.rect(margin + xx, cellY(y), colLabel, rowH);
      doc.rect(margin + xx + colLabel, cellY(y), colValue - xy, rowH);
      doc.setFont("helvetica", "bold");
      doc.text("Voltaje:", margin + 1 + xx, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.voltaje, margin + xx + colLabel + 1, y);
    }

    if (ingresoEquipo?.potencia) {
      y += rowH;
      doc.rect(margin + xx, cellY(y), colLabel, rowH);
      doc.rect(margin + xx + colLabel, cellY(y), colValue - xy, rowH);
      doc.setFont("helvetica", "bold");
      doc.text("Potencia:", margin + 1 + xx, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.potencia, margin + xx + colLabel + 1, y);
    }
  }

  

  y = Math.max(y, yy) + 16;
  doc.rect(margin, cellY(y), 30, rowH, "S");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Descripción", margin + 1, y);


  doc.setFontSize(10);
  const MAX_W = 180;
  const LINE_H = 5;    // mm por línea a fontSize 10
  const PAGE_H = 272;  // margen inferior seguro en A4 (297 - 25)

  const saltoSiNecesario = () => {
    if (y > PAGE_H) { doc.addPage(); y = 20; }
  };

  cotizacion.items.forEach((item, i) => {
    saltoSiNecesario();
    doc.rect(margin + 30, cellY(y), colLabel - 55 + 188, rowH, "S");
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(`${item.descripcion}`, MAX_W);
    doc.text(titleLines, margin + 31, y);
    y += titleLines.length * LINE_H;
    // y += 10;

    if (item.subItems?.length > 0) {
      doc.setFont("helvetica", "normal");
      item.subItems.forEach((s) => {
        saltoSiNecesario();
        const subLines = doc.splitTextToSize(`  • ${s}`, MAX_W - 6);
        const rectH = subLines.length * LINE_H + 2;
        doc.rect(margin, y - 3, MAX_W + 3, rectH);
        doc.text(subLines, margin + 1, y + 1);
        y += rectH;
      });
    }
    y += 2;
  });

  y += 8;
  const moneda = cotizacion.items[0]?.moneda ?? "PEN";
  const simbolo = moneda === "PEN" ? "S/" : "$";
  const _bruto = cotizacion.items.reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0);
  const _descMonto = parseFloat((_bruto - Number(cotizacion.subtotal)).toFixed(2));
  const _sinIgv = Number(cotizacion.subtotal);
  const _igv = parseFloat((_sinIgv * 0.18).toFixed(2));
  const _totalIgv = parseFloat((_sinIgv * 1.18).toFixed(2));

  const _fila = (label, valor, normal = false) => {
    doc.rect(margin, cellY(y), 30, rowH, "S");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin + 1, y);
    doc.rect(margin + 30, cellY(y), 35, rowH, "S");
    doc.setFont("helvetica", normal ? "normal" : "bold");
    doc.text(valor, margin + 31, y);
    y += rowH;
  };

  _fila("Subtotal:", `${simbolo} ${_bruto.toFixed(2)}`);
  if (_descMonto > 0.001) {
    _fila("Descuento:", `- ${simbolo} ${_descMonto.toFixed(2)}`, true);
    _fila("Total s/IGV:", `${simbolo} ${_sinIgv.toFixed(2)}`);
  }

  y -= rowH;

  y += 10;
  doc.rect(margin, cellY(y), 60, rowH, "S");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Consideraciones: ", margin + 1, y);

  y += 6;
  doc.rect(margin, cellY(y), 35, rowH, "S");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("El costo no incluye el IGV:", margin + 1, y);
  doc.rect(margin + 35, cellY(y), 25, rowH, "S");
  doc.setFont("helvetica", "normal");
  doc.text("18%", margin + doc.getTextWidth("El costo no incluye el IGV") + 10, y);



  y += 6;
  doc.rect(margin, cellY(y), 35, rowH, "S");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Condición de pago: `, margin + 1, y, { align: "left" });
  doc.rect(margin + 35, cellY(y), 25, rowH, "S");
  doc.setFont("helvetica", "normal");
  doc.text(`${cotizacion.condicionPago}`, margin + doc.getTextWidth("Condición de pago:__") + 10, y);



  y += 6;
  const tiempoEntrega = cotizacion.items.find(i => i.fechaEntrega)?.fechaEntrega;
  if (tiempoEntrega) {
    doc.rect(margin, cellY(y), 35, rowH, "S");
    doc.text(`Tiempo de entrega: `, margin + 1, y);
    doc.rect(margin + 35, cellY(y), 25, rowH, "S");
    doc.setFont("helvetica", "normal");
    doc.text(`${tiempoEntrega}`, margin + doc.getTextWidth("Tiempo de entrega:") + 18, y);

  }
    y += 6;
    doc.rect(margin, cellY(y), 35, rowH, "S");
    doc.text(`Garantía: `, margin + 1, y);
    doc.rect(margin + 35, cellY(y), 25, rowH, "S");
    doc.setFont("helvetica", "normal");
    doc.text(`${cotizacion.garantia}`, margin + doc.getTextWidth("Garantía:__") + 28, y);
 


  // ─── FIRMA EN COLOR ───────────────────────────────────────────────────────
  y += 6;
  doc.addImage(firma, "JPEG", margin, y, 40, 22);


  y += 30;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Gerente general", margin, y);

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Ing Héctor Tuesta Gonzáles", margin, y);

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TECNOTRONICA SAC", margin, y);

  doc.save(`${cotizacion.codigo}.pdf`);
};
