
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
).replace(/\/+$/, '');

export async function apiRequest(
  path,
  { token, method = 'GET', body } = {}
) {
  const headers = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE_URL}. ` +
      'Check that the backend is running and CORS allows the dashboard origin.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.error || data.message || `Request failed (${response.status}).`
    );

    error.status = response.status;
    throw error;
  }

  return data;
}