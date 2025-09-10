import App from "./App.jsx";
import Home from "./ui/Home.jsx";

export const routes = [
  {
    Component: App,
    children: [{ index: true, Component: Home }],
  },
];
