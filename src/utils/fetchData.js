// Wrapper around Node 18+ global fetch
export async function fetchData(url, options = {}) {
  const response = await fetch(url, options);

  let body;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    data: body
  };
}