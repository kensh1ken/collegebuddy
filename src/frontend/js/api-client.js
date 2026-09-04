(function () {
  const stored = localStorage.getItem('collegebuddy.apiBaseUrl');
  const inferred = `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.hostname || 'localhost'}:3000`;
  const baseUrl = String(window.COLLEGEBUDDY_API_URL || stored || inferred).replace(/\/$/, '');

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 15000);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        credentials: 'include',
        signal: options.signal || controller.signal,
        headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.error?.message || payload.message || `Request failed (${response.status})`);
        error.status = response.status;
        error.code = payload.error?.code;
        error.details = payload.error?.details;
        throw error;
      }
      return payload.data ?? payload;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The request timed out. Check your connection and try again.');
      if (error instanceof TypeError) throw new Error('CollegeBuddy is offline. Check the API address and your network.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  const query = (values = {}) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) params.set(key, value);
    });
    const output = params.toString();
    return output ? `?${output}` : '';
  };

  window.CollegeBuddyAPI = {
    baseUrl,
    request,
    auth: {
      signup: (body) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
      login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
      logout: () => request('/api/auth/logout', { method: 'POST' }),
      me: () => request('/users/me'),
      completeProfile: (body) => request('/users/complete-profile', { method: 'PUT', body: JSON.stringify(body) }),
    },
    courses: { list: (filters) => request(`/courses${query(filters)}`) },
    resources: {
      list: (filters) => request(`/resources${query(filters)}`),
      download: (id) => request(`/resources/${encodeURIComponent(id)}/download`),
    },
    events: { list: (filters) => request(`/events${query(filters)}`) },
    lostFound: { list: (filters) => request(`/lost-found${query(filters)}`) },
    admin: {
      users: (filters) => request(`/admin/users${query(filters)}`),
      resources: (filters) => request(`/admin/resources${query(filters)}`),
    },
  };
})();
