import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import CanvasPage from "./components/Canvas/CanvasPage";
import AdventureGamePage from "./components/Games/AdventureGamePage";
import GamesPage from "./components/Games/GamesPage";
import JumpGamePage from "./components/Games/JumpGamePage";
import TypingGamePage from "./components/Games/TypingGamePage";
import Home from "./components/Home/Home";
import HomelabPage from "./components/Homelab/HomelabPage";
import Navbar from "./components/Navbar";
import Preloader from "./components/Pre";
import ScrollToTop from "./components/ScrollToTop";
import ToolsPage from "./components/Tools/ToolsPage";
import { registerVisitorHit } from "./lib/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import "./App.css";
import "./refinement.css";
import "./nahollo.css";

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

  useEffect(() => {
    const registerVisit = async () => {
      try {
        await registerVisitorHit();
      } catch (error) {
        // Ignore visitor registration failures in the shell.
      }
    };

    void registerVisit();
  }, []);

  return (
    <Router>
      <Preloader load={load} />
      <div className="App" id={load ? "no-scroll" : "scroll"}>
        <Navbar />
        <ScrollToTop />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/canvas" element={<CanvasPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/typing" element={<TypingGamePage />} />
            <Route path="/games/jump" element={<JumpGamePage />} />
            <Route path="/games/adventure" element={<AdventureGamePage />} />
            <Route path="/homelab" element={<HomelabPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
