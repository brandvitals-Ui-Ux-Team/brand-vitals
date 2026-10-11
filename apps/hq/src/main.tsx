import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

try { document.documentElement.dataset.theme = JSON.parse(localStorage.getItem("hq-theme") || '"light"'); } catch { /* ignore */ }

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
