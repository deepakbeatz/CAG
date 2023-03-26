import React from "react";

const InputCAG = ({ inputValue, setInputValue }: any) => {
  return (
    <textarea
      value={inputValue}
      onChange={(event: any) => {
        setInputValue(event.target.value);
      }}
      placeholder="Enter your prompt here"
    />
  );
};

export default InputCAG;
