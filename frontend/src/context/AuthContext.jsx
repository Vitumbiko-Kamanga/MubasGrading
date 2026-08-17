import React, { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("mubas_user");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(role, username, password) {
    const res = await api.post("/auth/login", { role, username, password });
    const data = res.data;
    localStorage.setItem("mubas_token", data.token);
    localStorage.setItem("mubas_user", JSON.stringify(data));
    setUser(data);
    return data;
  }

  function logout() {
    localStorage.removeItem("mubas_token");
    localStorage.removeItem("mubas_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
