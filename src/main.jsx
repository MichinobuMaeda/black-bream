import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "./i18n";
import { routes } from "./routes.js";

const router = createHashRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
