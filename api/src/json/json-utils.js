const jsonToTextSequence = (root, path, output) => {
    if (Array.isArray(root)) {
        root.forEach((data) => {
            jsonToTextSequence(data, path, output)
        })
    } else if (typeof root === 'object') {
        for (const key in root) {
            const newPath = path === '' ? key : path + '%%' + key;
            if (typeof root[key] !== 'object') {
                outputData.push(`${newPath}%%${root[key]}`)
            }                 
            jsonToTextSequence(root[key], newPath, output);
        }
    }
  }
  
export const toTextSequence = (jsonData) => {
    const outputData = [];
    jsonToTextSequence(jsonData, '', outputData);
    return outputData.join(',');
}