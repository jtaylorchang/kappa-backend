export const oc = (optionalObj, schema) => {
  if (optionalObj == undefined || schema == undefined) {
    return schema;
  }

  const obj = schema;

  const entries = Object.entries(schema);

  for (const [key, value] of entries) {
    if (optionalObj[key] != undefined) {
      if (typeof value === 'object') {
        obj[key] = oc(optionalObj[key], value);
      } else {
        obj[key] = optionalObj[key];
      }
    }
  }

  return obj;
};
