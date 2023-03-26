import React from "react";

const InputCAG: React.FC<any> = ({ inputVal, updateVal }: any) => {
  return (
    <textarea
      value={inputVal}
      onChange={(e) => updateVal(e.target.value)}
      placeholder="Enter your prompt here"
    />
  );
};

export default InputCAG;
