import React from "react";

const OutputCAG: React.FC<any> = ({ outputVal }: any) => {
  return (
    <textarea
      value={JSON.stringify(outputVal?.processObject, null, 4)}
      readOnly
    />
  );
};

export default OutputCAG;
