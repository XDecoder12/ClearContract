
export const setToken = async (token) => {
  await chrome.storage.local.set({
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
