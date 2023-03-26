import React, { useState } from "react";
import InputCAG from "./inputCAG";
import OutputCAG from "./outputCAG";
import "./App.scss";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  return (
    <div className="app">
      <header>
        <h1>CAG</h1>
        <h3>Contextual Asset Generator</h3>
      </header>
      <div className="text-editor">
        <InputCAG inputValue={inputValue} setInputValue={setInputValue} />
        <button
          onClick={() => {  
            setOutputValue("hello world");
          }}
        >
          Generate
        </button>
        <OutputCAG outputValue={outputValue} />
      </div>
    </div>
  );
}

export default App;
