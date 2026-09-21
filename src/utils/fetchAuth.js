const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE = API.replace("/api", "");

export const getUsuario = () => JSON.parse(localStorage.getItem("usuario") || "null");

export const imgUrl = (ruta) => {
  const tokenArchivos = localStorage.getItem("tokenArchivos");
  return `${BASE}${ruta}${tokenArchivos ? `?token=${tokenArchivos}` : ""}`;
};

export const uploadAuth = (endpoint, formData) => {
  const token = localStorage.getItem("token");
  return fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
};

export const fetchAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.clear();
    window.location.hash = "/login";
  }
  return res;
};
