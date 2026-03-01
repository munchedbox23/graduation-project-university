import { createRoot } from "react-dom/client";

import AppRoot  from "./app/app-root";
import "./app/styles/index.css";
import reportWebVitals from "./reportWebVitals";

createRoot(document.getElementById("root")!).render(<AppRoot />);

reportWebVitals();
