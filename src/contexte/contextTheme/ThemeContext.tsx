import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "../../utils/api";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  setTheme: (newTheme: Theme) => Promise<void>;
  loading: boolean;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé dans ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Charger immédiatement depuis localStorage au démarrage
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as Theme) || "light";
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [apiLoaded, setApiLoaded] = useState<boolean>(false);

  // Appliquer le thème au document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Charger le thème depuis l'API UNE SEULE FOIS
  // useEffect(() => {
  //   if (!apiLoaded) {
  //     loadThemeFromAPI();
  //   }
  // }, [apiLoaded]);

  const loadThemeFromAPI = async (): Promise<void> => {
    try {
      const response = await api.get("/api/user-theme");
      if (response.data.success && response.data.theme) {
        setThemeState(response.data.theme as Theme);
      }
    } catch (error) {
      console.log("ℹ️ API thème non disponible, utilisation localStorage");
    } finally {
      setLoading(false);
      setApiLoaded(true);
    }
  };

  const toggleTheme = async (): Promise<void> => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setThemeState(newTheme);

    // Sauvegarder dans la BD via API (en arrière-plan)
    try {
      await api.post("/api/user-theme", { theme: newTheme });
    } catch (error) {
      console.log("ℹ️ Thème sauvegardé localement uniquement");
    }
  };

  const setTheme = async (newTheme: Theme): Promise<void> => {
    setThemeState(newTheme);

    try {
      await api.post("/api/user-theme", { theme: newTheme });
    } catch (error) {
      console.log("ℹ️ Impossible de sauvegarder le thème dans la BD");
    }
  };

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
