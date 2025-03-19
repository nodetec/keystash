import React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { TooltipProvider } from "./components/ui/tooltip";
import { Layout } from "./Layout";
import { Keys } from "./pages/Keys";
import { Profile } from "./pages/Profile";
import { Relays } from "./pages/Relays";
import About from "./pages/About";

const queryClient = new QueryClient({});

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools buttonPosition="bottom-right" />
        <TooltipProvider>
          <BrowserRouter basename="/main_window">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Keys />} />
                <Route path="profile" element={<Profile />} />
                <Route path="relays" element={<Relays />} />
                <Route path="about" element={<About />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
