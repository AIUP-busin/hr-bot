const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiGet(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}${path}${query ? '?' + query : ''}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path, body = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPut(path, body = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
