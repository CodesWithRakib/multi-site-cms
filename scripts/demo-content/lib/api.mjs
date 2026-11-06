/**
 * Minimal client for the CMS admin API, used the same way the admin UI uses
 * it: cookie session + CSRF header. No dependencies (Node 20+ fetch).
 */

export function createApi(baseUrl) {
  let cookie = '';
  let csrf = '';

  async function request(method, path, { json, form } = {}) {
    const headers = { Accept: 'application/json', Cookie: cookie };
    if (method !== 'GET') headers['x-csrf-token'] = csrf;
    let body;
    if (json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(json);
    } else if (form) {
      body = form;
    }

    const res = await fetch(`${baseUrl}${path}`, { method, headers, body });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const message = payload?.error?.message ?? res.statusText;
      const details = payload?.error?.details ? ` ${JSON.stringify(payload.error.details)}` : '';
      throw new Error(`${method} ${path} -> ${res.status}: ${message}${details}`);
    }
    return payload?.data;
  }

  return {
    async login(email, password) {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(`Login failed (${res.status}) for ${email}`);
      const cookies = res.headers.getSetCookie().map((c) => c.split(';')[0]);
      cookie = cookies.join('; ');
      csrf = cookies.find((c) => c.startsWith('cms_csrf='))?.slice('cms_csrf='.length) ?? '';
      const data = (await res.json()).data;
      return data.user;
    },
    get: (path) => request('GET', path),
    post: (path, json) => request('POST', path, { json }),
    patch: (path, json) => request('PATCH', path, { json }),
    del: (path) => request('DELETE', path),
    upload: (path, form) => request('POST', path, { form }),
  };
}

/** Lists come back either as an array or as `{ items }` (paginated). */
export function itemsOf(data) {
  return Array.isArray(data) ? data : (data?.items ?? []);
}
