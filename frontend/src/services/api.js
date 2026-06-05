// Central API service for all backend calls.
// Base URL points to the .NET backend running on localhost.
// If your backend runs on a different port, update this URL.
const API_BASE = 'https://kabakalgym-api-gndmbwczhre4crb0.southeastasia-01.azurewebsites.net/api';

/**
 * Generic fetch wrapper that handles JSON serialization and error responses.
 */
async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Attach JWT token from localStorage if available
  const token = localStorage.getItem('kabakal_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Try to parse JSON body (might be empty on some responses)
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Extract error message from API response
    const errorMessage =
      data?.error ||
      data?.title ||
      (typeof data === 'string' ? data : null) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

// ── Auth Endpoints ──────────────────────────────────────────────────────────

export async function registerUser({ firstName, lastName, email, password, confirmPassword }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password, confirmPassword }),
  });
}

export async function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function verifyEmail(token) {
  return request(`/auth/verify?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });
}

export async function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ token, newPassword, confirmNewPassword }) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, confirmNewPassword }),
  });
}

// ── Admin: Member Management ──────────────────────────────────────────────

export async function getMembers(page = 1, pageSize = 20, search = '') {
  const params = new URLSearchParams({ page, pageSize });
  if (search) params.append('search', search);
  return request(`/members?${params.toString()}`);
}

export async function getMember(id) {
  return request(`/members/${id}`);
}

export async function updateMember(id, data) {
  return request(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Admin: Equipment Management ───────────────────────────────────────────

export async function getEquipment(page = 1, pageSize = 20, search = '') {
  const params = new URLSearchParams({ page, pageSize });
  if (search) params.append('search', search);
  return request(`/equipment?${params.toString()}`);
}

export async function createEquipment(data) {
  return request('/equipment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEquipment(id, data) {
  return request(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEquipment(id) {
  return request(`/equipment/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadEquipmentCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('kabakal_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/equipment/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.title || `Upload failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

// ── Server Pre-warm ──────────────────────────────────────────────────────────
export async function wakeupServer() {
  try {
    // Send a lightweight, silent request to wake up the Azure free tier instance
    await fetch(`${API_BASE}/wakeup`, { method: 'GET' });
  } catch (err) {
    // Ignore errors silently since this is just a pre-warm hack
  }
}

