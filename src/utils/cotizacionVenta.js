import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo_tecnotronica.png";
import firma from "../assets/firma_tecnotronica.JPEG";

export const exportarCotizacionVenta = (cotizacion, ingresoEquipo = null) => {
  const doc = new jsPDF();
  const empresa = cotizacion.empresa;
  let y = 18;
  const margin = 14;

  doc.addImage(logo, "JPG", margin, 8, 180, 22);
  // y += 15;
  // doc.setFontSize(10);
  // doc.setFont("arial", "bold");
  // doc.text(`Ingeniería electrónica Industrial www.tecnotronica.com.pe`, margin + 80, y, { align: "center" });

  // ─── FECHA ───────────────────────────────────────────────────────

  y += 18;
  doc.setFontSize(8);
  const _f = new Date(cotizacion.fecha);
  const fechaStr = `${_f.getUTCDate()} de ${_f.toLocaleDateString("es-PE", { month: "long", timeZone: "UTC" })} del ${_f.getUTCFullYear()}`;
  doc.text(`Callao, ${fechaStr}`, 196, y, { align: "right" });

  // ─── ENCABEZADO IZQUIERDO ───────────────────────────────────────────────────

  y += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Presupuesto N° ${cotizacion.codigo}`, margin, y);

  // ─── DATOS EMISOR (centro bajo logo) ─────────────────────────────────────

  y += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Señores: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(empresa.razonSocial, margin + doc.getTextWidth("Señores:__"), y);

  if (cotizacion.atencion) {
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Atención: ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.atencion, margin + doc.getTextWidth("Atención:__"), y);
  }

  if (ingresoEquipo && (ingresoEquipo.marca || ingresoEquipo.modelo || ingresoEquipo.numeroSerie || ingresoEquipo.linea || ingresoEquipo.voltaje || ingresoEquipo.potencia)) {
    y += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Referencia: ", margin, y);
    if (ingresoEquipo.marca) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Marca: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.marca, margin + doc.getTextWidth("Marca:__"), y);
    }
    if (ingresoEquipo.modelo) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Modelo: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.modelo, margin + doc.getTextWidth("Modelo:__"), y);
    }
    if (ingresoEquipo?.numeroSerie) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("N° Serie: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.numeroSerie, margin + doc.getTextWidth("N° Serie:__"), y);
    }
    if (ingresoEquipo?.linea) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Línea: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.linea, margin + doc.getTextWidth("Línea:__"), y);
    }
    if (ingresoEquipo?.voltaje) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Voltaje: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.voltaje, margin + doc.getTextWidth("Voltaje:__"), y);
    }
    if (ingresoEquipo?.potencia) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Potencia: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.potencia, margin + doc.getTextWidth("Potencia:__"), y);
    }
  }
  doc.setFontSize(8);
  const _vCampo = (label, valor) => {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margin + doc.getTextWidth(`${label}:__`), y);
  };
  if (cotizacion.referencia) _vCampo("Referencia", cotizacion.referencia);

  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Presente.- ", margin, y);

  // y += 10;
  // doc.setFontSize(8);
  // doc.setFont("helvetica", "normal");
  // doc.text("Muy señores nuestros: Tenemos el agrado de alcanzarles nuestra oferta económica por lo siguiente ", margin, y);

  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["#", "Descripción", "Cantidad", "Precio", "Moneda", "Subtotal"]],
    body: cotizacion.items.map((item, i) => [
      i + 1,
      item.descripcion,
      item.cantidad,
      Number(item.precio).toFixed(2),
      item.moneda === "PEN" ? "S/" : "$",
      Number(item.subtotal).toFixed(2),
    ]),
    foot: [
      [
        { content: "", colSpan: 3, styles: { fillColor: [245, 245, 245] } },
        { content: "Subtotal:", colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
        { content: Number(cotizacion.subtotal).toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
      ],
      // [
      //   { content: "", colSpan: 3, styles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
      //   { content: "IGV 18%:", colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
      //   { content: Number(cotizacion.igv).toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
      // ],
      // [
      //   { content: "", colSpan: 3, styles: { fillColor: [30, 30, 30] } },
      //   { content: "TOTAL:", colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [30, 30, 30] } },
      //   { content: Number(cotizacion.total).toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [30, 20, 30], textColor: [255, 255, 255] } },
      // ],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 100 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 24, halign: "right" },
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  const cellY = (ry) => ry - 4;
  const rowH = 6;
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
  // const plazoEntrega = cotizacion.items.find(i => i.plazoEntrega)?.plazoEntrega;
  if (cotizacion.plazoEntrega) {
    doc.rect(margin, cellY(y), 35, rowH, "S");
    doc.text(`Tiempo de entrega: `, margin + 1, y);
    doc.rect(margin + 35, cellY(y), 25, rowH, "S");
    doc.setFont("helvetica", "normal");
    doc.text(`${cotizacion.plazoEntrega}`, margin + doc.getTextWidth("Tiempo de entrega:") + 18, y);

  }
  y += 6;
  doc.rect(margin, cellY(y), 35, rowH, "S");
  doc.text(`Garantía: `, margin + 1, y);
  doc.rect(margin + 35, cellY(y), 25, rowH, "S");
  doc.setFont("helvetica", "normal");
  doc.text(`${cotizacion.garantia}`, margin + doc.getTextWidth("Garantía:__") + 28, y);


  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "light");
  doc.text("Sin otro particular y esperando ser favorecido con vuestra orden, nos reiteramos de Uds.", margin, y);

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
