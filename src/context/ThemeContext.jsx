import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const TEMA_KEY = "tema";
const TEMAS_VALIDOS = ["light", "dark", "warm"];

function temaInicial() {
  const guardado = localStorage.getItem(TEMA_KEY);
  return TEMAS_VALIDOS.includes(guardado) ? guardado : "light";
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem(TEMA_KEY, tema);
  }, [tema]);

  return (
    <ThemeContext.Provider value={{ tema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
