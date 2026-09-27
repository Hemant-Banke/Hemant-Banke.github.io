import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/newsreader/opsz-italic.css";
// Only the italic: the upright JetBrains Mono is self-hosted (public/fonts,
// subset with box-drawing glyphs). This adds a true italic for subheadings.
import "@fontsource/jetbrains-mono/400-italic.css";
// Period face (the 1680s Fell types) for the drop cap on a post's lede.
import "@fontsource/im-fell-english/latin-400.css";
import "./styles/theme.css";
import "./styles/app.css";
import "./styles/hero.css";
import "./styles/garden.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
