import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "light");

  // sanitize any unexpected values
  useEffect(() => {
    if (theme !== "light" && theme !== "dark") setTheme("light");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // apply class to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return { theme, setTheme, toggle };
}
