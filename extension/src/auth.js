const API_BASE_URL = 'http://localhost:5001';

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed.');
  }

  await chrome.storage.local.set({
    authToken: data.token,
    userId: data.userId
  });

  return data;
};

export const getAuthToken = async () => {
  const result = await chrome.storage.local.get('authToken');
  return result.authToken || null;
};

export const getScanHistory = async () => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required.');
  }

  const response = await fetch(`${API_BASE_URL}/api/scans`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to retrieve scan history.');
  }

  return data.scans;
};

export const logout = async () => {
  await chrome.storage.local.remove(['authToken', 'userId']);
};