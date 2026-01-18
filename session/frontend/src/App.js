import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { HomePage } from "./pages/HomePage";
import { ProjectPage } from "./pages/ProjectPage";

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
          <Route path="/project/:projectId/states" element={<ProjectPage />} />
          <Route path="/project/:projectId/variations" element={<ProjectPage />} />
          <Route path="/project/:projectId/preview" element={<ProjectPage />} />
          <Route path="/project/:projectId/export" element={<ProjectPage />} />
          <Route path="/project/:projectId/settings" element={<ProjectPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
