import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "@/app/App";
import { reportDesktopV3RendererReady } from "@/app/bootstrap/renderer-ready";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

reportDesktopV3RendererReady();
