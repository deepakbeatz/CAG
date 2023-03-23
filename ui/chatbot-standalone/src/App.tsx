import React from "react";
import InputCAG from "./inputCAG";
import OutputCAG from "./outputCAG";
import "./App.scss";

function App() {
  return (
    <div className="app">
      <header>
        <h1>CAG</h1>
        <h3>Contextual Asset Generator</h3>
      </header>
      <div className="text-editor">
        <InputCAG />
        <button>Generate</button>
        <OutputCAG />
      </div>
    </div>
  );
}

export default App;
