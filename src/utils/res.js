export const pass = (data) => {
  return {
    success: true,
    data
  };
};

export const fail = (error) => {
  console.error(error);

  return {
    success: false,
    error
  };
};
