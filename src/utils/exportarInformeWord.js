import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  convertMillimetersToTwip,
} from "docx";
import logoUrl from "../assets/logo_tecnotronica.png";
import { imgUrl } from "./fetchAuth";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// ── Ajustes de marca de agua ──────────────────────────────────────────
const WM_COLOR   = "#5A7FA8"; // color hex (sin opacidad) o "rgba(r,g,b,a)"
const WM_X_MM    = 0;        // posición horizontal desde el margen izquierdo (mm)
const WM_Y_MM    = 120;       // posición vertical desde el margen superior (mm)
const WM_W_MM    = 100;       // ancho de la imagen en el documento (mm)
const WM_H_MM    = 22;        // alto  de la imagen en el documento (mm)
// ─────────────────────────────────────────────────────────────────────

const mmToEmu = (mm) => mm * 36000;

function createWatermarkBuffer(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 110;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 80px 'Times New Roman'";
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, 0, 88);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => blob.arrayBuffer().then(resolve), "image/png");
  });
}

async function fetchBuffer(url) {
  const resp = await fetch(url);
  return resp.arrayBuffer();
}

function fila(etiqueta, valor) {
  return new Paragraph({
    spacing: { after: 60 },
    tabStops: [{ type: "left", position: 1800 }],
    children: [
      new TextRun({ text: etiqueta, bold: true, size: 22 }),
      new TextRun({ text: `\t${valor || "—"}`, size: 22 }),
    ],
  });
}

export async function exportarInformeWord(avances, ordenTrabajo, { nroInforme, atencion, cip }) {
  const logoBuffer = await fetchBuffer(logoUrl);
  const watermarkBuffer = await createWatermarkBuffer("HOMOLOGATED", WM_COLOR);
  const ahora = new Date();
  const fechaTexto = `Callao, ${ahora.getDate()} de ${MESES[ahora.getMonth()]} del ${ahora.getFullYear()}`;
  const periodo = `${String(ahora.getMonth() + 1).padStart(2, "0")}/${ahora.getFullYear()}`;
  const empresa = ordenTrabajo.empresa?.razonSocial || ordenTrabajo.empresa?.alias || "";
  const referencia = ordenTrabajo.titulo || "";

  const encargado = avances.find((a) => a.personalEncargado?.nombre)?.personalEncargado;
  const nombreFirmante = encargado?.nombre || "";

  const children = [];


  // ── Fecha ─────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 240, after: 480 },
      children: [new TextRun({ text: fechaTexto, size: 22 })],
    })
  );

  // ── N° de informe ─────────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 240 },
      children: [
        new TextRun({
          text: `Informe Técnico N° ${nroInforme} - ${periodo}`,
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  // ── Destinatario ──────────────────────────────────────────────────
  children.push(fila("Señores:", empresa));
  children.push(fila("Atención:", atencion));
  children.push(fila("Referencia:", referencia));

  // ── Saludo ────────────────────────────────────────────────────────
  children.push(new Paragraph({ text: "", spacing: { before: 240, after: 60 } }));
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "De nuestra consideración:", size: 22 })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: "Mediante el presente, le expresamos nuestros cordiales saludos.",
          size: 22,
        }),
      ],
    })
  );

  // ── Cuerpo: avances ───────────────────────────────────────────────
  for (const avance of avances) {
    if (avance.titulo) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: `${avance.titulo}:`, bold: true, size: 22 })],
        })
      );
    }
    if (avance.descripcion) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: avance.descripcion, size: 22 })],
        })
      );
    }
    for (const item of avance.items || []) {
      if (item.titulo) {
        children.push(
          new Paragraph({
            spacing: { before: 160, after: 80 },
            children: [new TextRun({ text: item.titulo, bold: true, size: 22 })],
          })
        );
      }
      for (const img of item.imagenes || []) {
        const rawUrl = typeof img === "string" ? img : img.url;
        const desc = typeof img === "string" ? "" : (img.descripcion || "");
        const ext = rawUrl.split(".").pop().toLowerCase();
        if (!["png", "jpg", "jpeg", "gif"].includes(ext)) continue;
        try {
          const buf = await fetchBuffer(imgUrl(rawUrl));
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [new ImageRun({ data: buf, transformation: { width: 220, height: 165 } })],
            })
          );
          if (desc) {
            children.push(
              new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: desc, size: 18, italics: true, color: "555555" })],
              })
            );
          }
        } catch { /* imagen no disponible, se omite */ }
      }
    }
  }

  // ── HOMOLOGATED ───────────────────────────────────────────────────
  // children.push(new Paragraph({ text: "", spacing: { before: 360 } }));
  // children.push(
  //   new Paragraph({
  //     spacing: { before: 200, after: 200 },
  //     children: [
  //       new TextRun({ text: "HOMOLOGATED", bold: true, size: 80, color: "5DC4CA" }),
  //     ],
  //   })
  // );

  // ── Firma ─────────────────────────────────────────────────────────

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 40 },
      children: [new TextRun({
        text: `Ing. Héctor Tuesta G. `, bold: true, size: 22
      })],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "C.I.P.086262", bold: true, size: 22 })],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "TECNOTRONICA", bold: true, size: 22 })],
    })
  );

  // ── Generar y descargar ───────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(20),
              right: convertMillimetersToTwip(25),
              bottom: convertMillimetersToTwip(28),
              left: convertMillimetersToTwip(30),
              footer: convertMillimetersToTwip(10),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new ImageRun({ data: logoBuffer, transformation: { width: 581, height: 132 } }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 80 },
                children: [
                  new TextRun({
                    text: "Jr. Iquique 455 – Callao Cel. 998784119",
                    bold: true,
                    underline: {},
                    size: 22,
                  }),
                ],
              }),
              // HOMOLOGATED como marca de agua (detrás del texto)
              new Paragraph({
                children: [
                  new ImageRun({
                    data: watermarkBuffer,
                    transformation: { width: WM_W_MM * 2.835, height: WM_H_MM * 2.835 },
                    floating: {
                      horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.MARGIN,
                        offset: mmToEmu(WM_X_MM),
                      },
                      verticalPosition: {
                        relative: VerticalPositionRelativeFrom.MARGIN,
                        offset: mmToEmu(WM_Y_MM),
                      },
                      wrap: { type: TextWrappingType.NONE },
                      behindDocument: true,
                    },
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [

              // ── Línea separadora ──────────────────────────────────────────────
              // children.push(
              //   new Paragraph({
              //     text: "",
              //     border: { bottom: { color: "93C5FD", space: 4, style: BorderStyle.SINGLE, size: 8 } },
              //     spacing: { before: 100, after: 100 },
              //   })
              // ),
              // Línea superior + primera fila: especialidad | dirección
              new Paragraph({
                border: {
                  top: { color: "93C5FD", space: 4, style: BorderStyle.SINGLE, size: 8 },
                },
                spacing: { before: 60, after: 40 },
                indent: { left: convertMillimetersToTwip(0) },
                tabStops: [
                  { type: TabStopType.RIGHT, position: convertMillimetersToTwip(135) },
                ],
                children: [
                  new TextRun({
                    text: "ELECTRÓNICA INDUSTRIAL – AUTOMATIZACIÓN",
                    bold: true,
                    size: 20,
                    color: "5A7FA8",
                  }),
                  new TextRun({
                    text: "\tJr. Iquique 455 – Callao",
                    size: 20,
                    color: "5A7FA8",
                  }),
                ],
              }),
              // Segunda fila: teléfono / email
              new Paragraph({
                spacing: { after: 0 },
                indent: { left: convertMillimetersToTwip(0) },
                children: [
                  new TextRun({
                    text: "Cel. 998784119 tecnotronica@hotmail.com",
                    size: 20,
                    color: "5A7FA8",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Informe-${ordenTrabajo.codigo || "OT"}-${ahora.toISOString().slice(0, 10)}.docx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
