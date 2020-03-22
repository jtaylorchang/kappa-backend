export const projectChanges = changes => {
  let projection = {
    _id: 0
  };

  for (const key of Object.keys(changes)) {
    projection[key] = 1;
  }

  return projection;
};
