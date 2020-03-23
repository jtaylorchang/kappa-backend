export const pass = data => {
  return {
    success: true,
    data
  };
};

export const fail = error => {
  return {
    success: false,
    error
  };
};
