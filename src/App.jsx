import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import MainIndex from './app/dashboard/mainIndex'

function App() {
  return (
    <>
     <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard/*" element={<MainIndex />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;