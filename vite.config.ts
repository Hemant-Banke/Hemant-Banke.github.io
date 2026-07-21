import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import contentPlugin from "./plugins/vite-plugin-content";

// Root-domain hosting (user page / custom domain): base '/'.
export default defineConfig({
  base: "/",
  plugins: [contentPlugin(), react()],
});
