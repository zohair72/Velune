import React from "react";
import { Outlet } from "react-router";
import { CauldronProvider } from "../components/CauldronContext";
import { AuthProvider } from "../../context/AuthContext";

export const RootLayout = () => {
  return (
    <AuthProvider>
      <CauldronProvider>
        <Outlet />
      </CauldronProvider>
    </AuthProvider>
  );
};
