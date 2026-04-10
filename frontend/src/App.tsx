import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import CanvasPage from "./components/Canvas/CanvasPage";
import Footer from "./components/Footer";
import Home from "./components/Home/Home";
import Navbar from "./components/Navbar";
import Preloader from "./components/Pre";
import Projects from "./components/Projects/Projects";
import Resume from "./components/Resume/ResumeNew";
import ScrollToTop from "./components/ScrollToTop";
import "./style.css";
import "./App.css";
import "./refinement.css";
import "bootstrap/dist/css/bootstrap.min.css";

function AppShell({ load }: { load: boolean }): JSX.Element {
  const location = useLocation();
  const isCanvasRoute = location.pathname.startsWith("/canvas");

  return (
    <div className={`App ${isCanvasRoute ? "app-canvas-route" : ""}`} id={load ? "no-scroll" : "scroll"}>
      <Navbar />
      <ScrollToTop />
      <main className={`site-main ${isCanvasRoute ? "site-main-canvas" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project" element={<Projects />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isCanvasRoute && <Footer />}
    </div>
  );
}

function App(): JSX.Element {
  const [load, setLoad] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoad(false);
    }, 420);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Router>
      <Preloader load={load} />
      <AppShell load={load} />
    </Router>
  );
}

export default App;
