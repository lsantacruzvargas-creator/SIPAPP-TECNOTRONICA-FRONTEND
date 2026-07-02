export const GRUPOS_PEPSICO = {
  "I":   "Materiales o repuestos",
  "II":  "Mano de obra",
  "III": "Traslados",
  "IV":  "Utilidad + gastos administrativos",
};

export const calcSubtotal = (item) =>
  parseFloat((item.cantidad * item.precio).toFixed(2));

export const INP =
  "border border-gray-200 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-gray-400";
export const INP_RO = "bg-transparent border-transparent text-sm px-2 py-1";

export const itemVacioVenta = () => ({
  _key: Date.now() + Math.random(),
  descripcion: "",
  cantidad: 1,
  unidadMedida: "Und",
  fechaEntrega: "",
  precio: 0,
  descuento: 0,
  moneda: "PEN",
  grupo: "I",
});

export const itemVacioPepsico = (grupo = "I") => ({
  _key: Date.now() + Math.random(),
  descripcion: "",
  cantidad: grupo === "IV" ? 10 : 1,
  unidadMedida: grupo === "IV" ? "%" : "UN",
  fechaEntrega: "",
  precio: 0,
  moneda: "PEN",
  grupo,
});

export const itemVacioServicio = () => ({
  _key: Date.now() + Math.random(),
  descripcion: "",
  subItems: [],
  cantidad: 1,
  unidadMedida: "Und",
  fechaEntrega: "",
  precio: 0,
  descuento: 0,
  moneda: "PEN",
  grupo: "I",
});

export const itemDesdeDb = (item) => ({
  _key: Date.now() + Math.random(),
  descripcion: item.descripcion,
  subItems: (item.subItems || []).map((texto) => ({
    _subKey: Date.now() + Math.random(),
    texto,
  })),
  cantidad: item.cantidad,
  unidadMedida: item.unidadMedida || "Und",
  fechaEntrega: item.fechaEntrega || "",
  precio: item.precio,
  descuento: item.descuento || 0,
  moneda: item.moneda || "PEN",
  grupo: item.grupo || "I",
});
