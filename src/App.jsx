
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ExamsPage from "./pages/ExamPage";
import ExamInterface from "./pages/ExamInterface";
import ProctoringPage from "./pages/ProctoringPage";
import ExamInterfaces from "./pages/hh";

import './App.css'

function App() {
   

  return (
    
<Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ExamsPage />} />
        <Route path="/proctoring" element={<ProctoringPage />} />
        <Route path="/exam-interface" element={<ExamInterface />} />
        <Route path="/interfaces" element={<ExamInterfaces/>} />
      </Routes>
    </Router>
  )
}

export default App;


