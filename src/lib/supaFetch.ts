import { supabase } from "./supabase";
import { useAuth } from "../context/AuthContext";

export async function supaFetch(table: string, columns = "*") {
  const { logout } = useAuth();

  const { data, error } = await supabase.from(table).select(columns);

  if (error) {
    if (
      error.message.includes("JWT expired") ||
      error.message.includes("Invalid token")
    ) {
      console.warn("⛔ Token expirado, cerrando sesión");
      await logout();
      return null;
    }
  }

  return data;
}