/**
 *
 * @param {any[]} selectedFields
 * @param {*} objectInfo
 */
export function buildTableColumns(selectedFields, objectInfo) {
  const { fields } = objectInfo;
  const columns = selectedFields.map((fieldName) => {
    const field = fields[fieldName];
    return {
      label: field.label,
      type: 'text',
      fieldName: field.apiName
    };
  });

  return columns;
}

/**
 *
 * @param {any[]} rowsData
 */
export function buildTableRows(rowsData) {
  return (rowsData || []).map((item) => buildSingleTableRow(item));
}

export function buildSingleTableRow(rowData) {
  return Object.assign({}, rowData);
}
