import React, { useState } from "react";
import InputCAG from "./inputCAG";
import OutputCAG from "./outputCAG";
import "./App.scss";

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const generateJson = async () => {
    console.log(input);
    const url = "/api/model/assetgan/generate";
    const reqBody = {
      prompt: input,
    };
    const config = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    };
    try {
      const res = await fetch(url, config);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.log("Generate error", e);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>CAG</h1>
        <h3>Contextual Asset Generator</h3>
      </header>
      <div className="text-editor">
        <InputCAG inputVal={input} updateVal={setInput} />
        <button onClick={generateJson}>Generate</button>
        <OutputCAG outputVal={result?.jsonData ?? null} />
      </div>
    </div>
  );
};

export default App;
