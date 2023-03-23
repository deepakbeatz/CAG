const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

const parseExcelFile = async (path) => {
  // File path.
  const rows = await readXlsxFile(path);
  return rows;
};

const parseCSVFile = (path) => {
  const fileData = fs.readFileSync(path, "utf8");
  let dataArray = fileData.split(/\r?\n/);
  return dataArray;
}

module.exports = {
  parseExcelFile: parseExcelFile,
  parseCSVFile: parseCSVFile,
};
