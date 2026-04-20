import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { CauldronPage } from "./components/CauldronPage";
import { AboutPage } from "./components/AboutPage";
import { CauldronProvider } from "./components/CauldronContext";
import React from "react";

const Root = () => {
  return (
    <CauldronProvider>
      <Layout />
    </CauldronProvider>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "cauldron", Component: CauldronPage },
      { path: "about", Component: AboutPage },
      { 
        path: "*", 
        Component: () => (
          <div className="min-h-screen bg-[#1A1817] flex items-center justify-center font-cinzel text-[#F4EFE6] text-4xl">
            404 - Lost in the Woods
          </div>
        )
      },
    ],
  },
]);
