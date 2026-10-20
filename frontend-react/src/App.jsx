import { useState } from "react";
import PublicPortal from "./complaints/PublicPortal";
import PoliceDashboard from "./complaints/PoliceDashboard";
import "./App.css";

function App() {
  const [page, setPage] = useState("public");

  return (
    <div className="app">
      {page === "public" ? (
        <PublicPortal setPage={setPage} />
      ) : (
        <PoliceDashboard setPage={setPage} />
      )}
    </div>
  );
}

export default App;