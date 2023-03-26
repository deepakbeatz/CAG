const jsonToTextSequence = (root, path, output) => {
    if (Array.isArray(root)) {
        root.forEach((data) => {
            jsonToTextSequence(data, path, output)
        })
    } else if (typeof root === 'object') {
        for (const key in root) {
            const newPath = path === '' ? key : path + '%%' + key;
            if (typeof root[key] !== 'object') {
                output.push(`${newPath}%%${root[key]}`)
            }
            jsonToTextSequence(root[key], newPath, output);
        }
    }
}

const textSequenceToJson = (sequences) => {
    const json = {};
    sequences.forEach((sequence) => {
        const parts = sequence.split("%%");
        var currRef = json;
        var prevRef, prevPart;
        for (const [index, part] of parts.entries()) {
            if (index === parts.length - 1) {
                break;
            }
            if (currRef.hasOwnProperty(part)) {
                if (index === parts.length - 2) {
                    const obj = {};
                    for (const key in currRef) {
                        if (key === part) {
                            obj[key] = parts[index + 1];
                        } else {
                            obj[key] = "";
                        }
                    }
                    const arr = [{ ...currRef }];
                    arr.push(obj);
                    currRef = arr;
                    prevRef[prevPart] = currRef;
                } else {
                    prevRef = currRef;
                    prevPart = part;
                    currRef = currRef[part];
                }
            } else if (Array.isArray(currRef)) {
                const lastEntry = currRef[currRef.length - 1];
                if (!lastEntry.hasOwnProperty(part)) {
                    lastEntry[part] = "";
                }
                if (!lastEntry[part]) {
                    lastEntry[part] = parts[index + 1];
                } else {
                    const newEntry = {};
                    for (const key in lastEntry) {
                        if (key === part) {
                            newEntry[key] = parts[index + 1];
                        } else {
                            newEntry[key] = "";
                        }
                    }
                    currRef.push(newEntry);
                }
            } else {
                if (index === parts.length - 2) {
                    currRef[part] = parts[index + 1];
                } else {
                    currRef[part] = {};
                    currRef = currRef[part];
                }
            }
        }
    });
    return json;
};

const textSequenceToPartialJson = (sequences) => {
    const json = {};
    sequences.forEach((sequence) => {
        const parts = sequence.split("%%");
        var currRef = json;
        var prevRef, prevPart;
        for (const [index, part] of parts.entries()) {
            if (index === parts.length - 1) {
                break;
            }
            if (currRef.hasOwnProperty(part)) {
                if (index === parts.length - 2) {
                    const obj = {};
                    for (const key in currRef) {
                        if (key === part) {
                            obj[key] = parts[index + 1];
                        } else {
                            obj[key] = "";
                        }
                    }
                    const arr = [{ ...currRef }];
                    arr.push(obj);
                    currRef = arr;
                    prevRef[prevPart] = currRef;
                } else {
                    prevRef = currRef;
                    prevPart = part;
                    currRef = currRef[part];
                }
            } else if (Array.isArray(currRef)) {
                const lastEntry = currRef[currRef.length - 1];
                if (!lastEntry.hasOwnProperty(part)) {
                    lastEntry[part] = "";
                }
                if (!lastEntry[part]) {
                    lastEntry[part] = parts[index + 1];
                } else {
                    const newEntry = {};
                    for (const key in lastEntry) {
                        if (key === part) {
                            newEntry[key] = parts[index + 1];
                        } else {
                            newEntry[key] = "";
                        }
                    }
                    currRef.push(newEntry);
                }
            } else {
                if (index === parts.length - 2) {
                    currRef[part] = parts[index + 1];
                } else {
                    currRef[part] = {};
                    currRef = currRef[part];
                }
            }
        }
    });
    return json;
};

const toJSON = (tokens) => textSequenceToJson(tokens);

const toPartialJSON = (tokens) => textSequenceToPartialJson(tokens);

const toTextSequence = (jsonData) => {
    const outputData = [];
    jsonToTextSequence(jsonData, '', outputData);
    return outputData.join(',');
}

module.exports = {
    toJSON,
    toTextSequence,
    toPartialJSON
}
