import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo_tecnotronica.png";
import firma from "../assets/firma_tecnotronica.JPEG";

export const exportarCotizacionPdf = (cotizacion, ingresoEquipo = null) => {
  const doc = new jsPDF();
  const empresa = cotizacion.empresa;
  let y = 18;
  const W = 210;
  const margin = 14;

  // ─── LOGO EN COLOR ───────────────────────────────────────────────────────
  doc.addImage(logo, "JPG", margin, 8, 180, 30);
  //   y += 15;
  // doc.setFontSize(10);
  // doc.setFont("arial", "bold");
  // doc.text(`Ingeniería electrónica Industrial www.tecnotronica.com.pe`, margin + 80, y, { align: "center" });

  // ─── DATOS EMISOR (centro bajo logo) ─────────────────────────────────────
  y += 22;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Razón Social:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text("TECNOTRONICA S.A.C.", margin + doc.getTextWidth("Razón_Social:__"), y, { align: "left" });


  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("RUC: ", margin + 100, y);
  doc.setFont("helvetica", "normal");
  doc.text("20505626118", margin + 100 + doc.getTextWidth("RUC:__"), y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Dirección Fiscal:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text("Jr. Iquique 455 Urb. Tarapacá Prov. Const. del Callao - Callao", margin + doc.getTextWidth("Dirección Fiscal:__"), y);


  // ─── EMAIL ─────────────────────────────────────
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Email: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text("gestion@tecnotronica.com.pe , tecnotronica@hotmail.com", margin + doc.getTextWidth("EMAIL:__"), y);


  // ─── FECHA ───────────────────────────────────────────────────────
  const _f = new Date(cotizacion.fecha);
  const fechaStr = `${_f.getUTCDate()} de ${_f.toLocaleDateString("es-PE", { month: "long", timeZone: "UTC" })} del ${_f.getUTCFullYear()}`;
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${fechaStr}`, margin + doc.getTextWidth("Fecha:__"), y);

  // ─── N° Cotizacion ───────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Presupuesto N° ${cotizacion.codigo}`, margin + 100, y, { align: "left" });


  // ─── DATOS RECEPTOR  ─────────────────────────────────────
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Señores: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(empresa.razonSocial, margin + doc.getTextWidth("Señores:__"), y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Moneda: PEN ", margin + 100, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Dirección: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(empresa.direccion, margin + doc.getTextWidth("Dirección:__"), y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("RUC: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(empresa.ruc, margin + doc.getTextWidth("RUC:__"), y);


  if (cotizacion.atencion) {
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Atención: ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.atencion, margin + doc.getTextWidth("Atención:__"), y);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("AVISO/OT: ", margin + 100, y);

  if (cotizacion.solped) {
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SOLPED: ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.solped, margin + doc.getTextWidth("SOLPED:__"), y);
  }

  // ─── DESCRIPCION DEL SERVICIO  ─────────────────────────────────────

  y += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Descripción del servicio: ", margin, y);
  doc.setFont("helvetica", "normal");
  const _refVal = cotizacion.referencia || cotizacion.titulo;
  if (_refVal) doc.text(_refVal, margin + doc.getTextWidth("Descripción del servicio:__") + 2, y);


  if (ingresoEquipo && (ingresoEquipo.marca || ingresoEquipo.modelo || ingresoEquipo.numeroSerie || ingresoEquipo.linea || ingresoEquipo.voltaje || ingresoEquipo.potencia)) {

    y += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Referencia: ", margin, y);

    if (ingresoEquipo.marca) {
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Marca: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(ingresoEquipo.marca, margin + doc.getTextWidth("Marca:__"), y);
    }

    if (ingresoEquipo.modelo) {
      y += 5;
      doc.setFontSize(8);
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
  const _c3campo = (label, valor) => {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margin + doc.getTextWidth(`${label}:__`), y);
  };
  if (cotizacion.modulo) _c3campo("Módulo", cotizacion.modulo);
  if (cotizacion.tarjeta) _c3campo("Tarjeta", cotizacion.tarjeta);
  if (cotizacion.equipo) _c3campo("Equipo", cotizacion.equipo);
  if (cotizacion.garantia) _c3campo("Garantía", cotizacion.garantia);

  const tiempoEntrega = cotizacion.items.find(i => i.fechaEntrega)?.fechaEntrega;
  const descripGrupoI = cotizacion.items.find(i => i.grupo === "I")?.descripcion || "";

  if (descripGrupoI) {
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Equipo y/o área de trabajo: ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(descripGrupoI, margin + doc.getTextWidth("Equipo y/o área de trabajo:__"), y);
  }

  y += 6;
  if (cotizacion.plazoEntrega) {
    doc.setFont("helvetica", "bold");
    doc.text("PLAZO DE ENTREGA:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.plazoEntrega, margin + doc.getTextWidth("PLAZO DE ENTREGA:__"), y);
  }

  // ─── CONSIDERACIONES  ─────────────────────────────────────

  y += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Muy señores nuestros: Tenemos el agrado de alcanzarles nuestra oferta económica por lo siguiente ", margin, y);

  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Consideraciones:", margin, y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Area", margin + 85, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Si/No", margin + 105, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Acción requerida", margin + 125, y)

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("- El servicio es de alto riesgo y requiere prevencionista", margin + 5, y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("SASS", margin + 85, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("No", margin + 105, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Solo requiere perfil operativo en GOSST", margin + 125, y)

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("- El servicio se realizará en zona en contacto con producto", margin + 5, y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("QC", margin + 85, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("No", margin + 105, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Dejar el área limpia y ordenada", margin + 125, y)

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("- El servicio se realizará dentro de planta Santa Anita", margin + 5, y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Mantto", margin + 85, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("No", margin + 105, y)

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Requiere informe y guias de remision", margin + 125, y)



  // ─── TABLA DE ÍTEMS POR GRUPO ─────────────────────────────────────────────
  y += 8;

  const GRUPOS_LABEL = {
    "I": "Materiales o repuestos",
    "II": "Mano de obra",
    "III": "Traslados",
    "IV": "Utilidad + gastos administrativos",
  };

  const baseIIIgrupos = cotizacion.items
    .filter(i => ["I", "II", "III"].includes(i.grupo))
    .reduce((sum, i) => sum + Number(i.cantidad) * Number(i.precio), 0);

  const body = [];
  ["I", "II", "III", "IV"].forEach(g => {
    const grupoItems = cotizacion.items.filter(i => i.grupo === g);
    if (!grupoItems.length) return;

    body.push([
      { content: g, styles: { fontStyle: "bold", fillColor: [220, 220, 220] } },
      { content: GRUPOS_LABEL[g], colSpan: 4, styles: { fontStyle: "bold", fillColor: [220, 220, 220] } },
      { content: "", styles: { fillColor: [220, 220, 220] } },
    ]);

    let subtotalGrupo = 0;
    grupoItems.forEach(item => {
      const importe = item.grupo === "IV"
        ? (Number(item.cantidad) / 100 * baseIIIgrupos)
        : (Number(item.cantidad) * Number(item.precio));
      subtotalGrupo += importe;

      body.push([
        "",
        item.descripcion,
        item.cantidad,
        item.unidadMedida || "UN",
        item.grupo !== "IV" ? Number(item.precio).toFixed(2) : "—",
        importe.toFixed(2),
      ]);
    });

    body.push([
      { content: "", styles: { fillColor: [240, 240, 240] } },
      { content: `Subtotal ${g}`, colSpan: 4, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
      { content: subtotalGrupo.toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
    ]);
  });

  autoTable(doc, {
    startY: y,
    head: [["Item", "Descripción", "Cantidad", "UM", "P. Unit.", "Importe Total"]],
    body,
    foot: [
      [
        { content: "", colSpan: 4, styles: { fillColor: [30, 30, 30] } },
        { content: "TOTAL", styles: { fontStyle: "bold", halign: "right", fillColor: [30, 30, 30], textColor: [255, 255, 255] } },
        { content: `S/ ${Number(cotizacion.subtotal).toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [30, 30, 30], textColor: [255, 255, 255] } },
      ],
      // [
      //   { content: "", colSpan: 4, styles: { fillColor: [30, 30, 30] } },
      //   { content: "IMPUESTO:", styles: { fontStyle: "bold", halign: "right", fillColor: [30, 30, 30], textColor: [255, 255, 255] } },
      //   { content: "Más 18%", styles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] } },
      // ],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [126, 192, 238], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 78 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 28, halign: "left" },
      5: { cellWidth: 28, halign: "left" },
    },
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(cotizacion.condicionPago || "—", margin + doc.getTextWidth("FORMA DE PAGO:__"), y);

  if (cotizacion.plazoEntrega) {
    doc.setFont("helvetica", "bold");
    doc.text("PLAZO DE ENTREGA:", margin + 90, y);
    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.plazoEntrega, margin + 90 + doc.getTextWidth("PLAZO DE ENTREGA:__"), y);
  }

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("VALIDEZ DE LA OFERTA:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(cotizacion.validezOferta || "30 días calendario", margin + doc.getTextWidth("VALIDEZ DE LA OFERTA:__"), y);


  doc.setFont("helvetica", "bold");
  doc.text("IMPUESTO:", margin + 90, y);
  doc.setFont("helvetica", "normal");
  doc.text("más 18%", margin + 90 + doc.getTextWidth("IMPUESTO:__"), y);


  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "light");
  doc.text("Sin otro particular y esperando ser favorecido con vuestra orden, nos reiteramos de Uds.", margin, y);

  y += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "light");
  doc.text("Atentamente", margin, y);

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
