export const setToken = async (token) => {
  await chrome.storage.local.set({  // Store the authentication token in Chrome's local storage in key value pair format, where the key is 'authToken' and the value is the provided token.
    authToken: token
  });
};

export const getToken = async () => {
  const result = await chrome.storage.local.get('authToken');
  return result.authToken || null;
};

export const removeToken = async () => {
  await chrome.storage.local.remove(['authToken', 'userId']);
};
