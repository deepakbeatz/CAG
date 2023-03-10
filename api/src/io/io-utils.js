const readXlsxFile = require("read-excel-file/node");

const parseExcelFile = async (path) => {
  // File path.
  const rows = await readXlsxFile(path);
  return rows;
};

module.exports = {
  parseExcelFile: parseExcelFile,
};
