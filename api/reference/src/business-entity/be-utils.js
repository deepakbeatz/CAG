const smartFields = ["PostalAddress", "Phone", "ElectronicAddress"];

function getFieldType(fieldAccessPath) {
    var fieldType = "rootfield";
    if(fieldAccessPath.split(".").length>1) {
        const parentFieldGroup = fieldAccessPath.split(".")[0];
        if(smartFields.indexOf(parentFieldGroup)!== -1) {
            fieldType =  "smartfield"
        } else {
            fieldType = "fieldgroup";
        }
    }
    return fieldType;
}

function countUnique(arr) {
    const counts = {};
    for (var i = 0; i < arr.length; i++) {
       counts[arr[i]] = 1 + (counts[arr[i]] || 0);
    };
    return counts;
 };

function getEntityData(selectedFields) {
    const uniqueFields = [
      ...Array.from(
        new Set(
          selectedFields.map((field) => {
            if (field.split(".").length > 1) {
              return `${field.split(".")[0]}.`;
            }
            return field;
          })
        )
      ),
    ];
    const fieldTypeArr = uniqueFields.map((field) => getFieldType(field));
    const typeCount = countUnique(fieldTypeArr);
    const inputArr = [typeCount.rootfield || 0, typeCount.fieldgroup || 0, typeCount.smartfield || 0];
    return inputArr;
}

module.exports = {
    getFieldType: getFieldType,
    getEntityData: getEntityData
}