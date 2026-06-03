// Central API service for all backend calls.
// Base URL points to the .NET backend running on localhost.
// If your backend runs on a different port, update this URL.
const API_BASE = 'https://kabakal-gym.onrender.com/api';

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
