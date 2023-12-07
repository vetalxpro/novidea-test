const prohibitedFieldNames = {
  CloneSourceId: 1,
  IsPriorityRecord: 1
};

export function buildFieldOptionsFromObjectInfo(objectInfo) {
  const result = Object.values(objectInfo.fields)
    .filter((item) => !prohibitedFieldNames[item.apiName] && !item.compound)
    .map((item) => {
      return {
        label: item.apiName,
        value: item.apiName
      };
    })
    .sort((a, b) => {
      if (a.value < b.value) {
        return -1;
      }
      if (a.value > b.value) {
        return 1;
      }
      return 0;
    });
  return result;
}

export function buildObjectOptions(apiNames) {
  return apiNames.map((apiName) => {
    return {
      label: apiName,
      value: apiName
    };
  });
}
