module.exports = error => {
  if (!error.originalError){ // error occured by human implemention, other packages throw, not by GraphQL (like query is in wrong form)
    return error;
  }
  const data = error.originalError.data;
  const status = error.originalError.code || 500;
  const message = error.message || 'An error occured.';
  return {
    data,
    status,
    message
  }
}