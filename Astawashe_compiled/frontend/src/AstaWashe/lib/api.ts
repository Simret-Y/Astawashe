const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type JsonRecord = Record<string, unknown>;

const getToken = () => localStorage.getItem('token');
const setToken = (token: string) => localStorage.setItem('token', token);
const clearToken = () => localStorage.removeItem('token');

const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async <T = JsonRecord>(response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data && (data as { message?: string }).message) || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return data as T;
};

const postJson = async <T = JsonRecord>(path: string, payload: JsonRecord, includeAuth = true) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: getHeaders(includeAuth),
    body: JSON.stringify(payload)
  });
  return handleResponse<T>(response);
};

const getJson = async <T = JsonRecord>(path: string, includeAuth = true) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: getHeaders(includeAuth)
  });
  return handleResponse<T>(response);
};

const patchJson = async <T = JsonRecord>(path: string, payload: JsonRecord, includeAuth = true) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: getHeaders(includeAuth),
    body: JSON.stringify(payload)
  });
  return handleResponse<T>(response);
};

const deleteJson = async <T = JsonRecord>(path: string, includeAuth = true) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: getHeaders(includeAuth)
  });
  return handleResponse<T>(response);
};

export { API_BASE, postJson, getJson, patchJson, deleteJson, getToken, setToken, clearToken, getHeaders };
