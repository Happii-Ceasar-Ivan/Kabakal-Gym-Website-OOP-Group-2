// Central API service for all backend calls.
// Base URL points to the .NET backend running on localhost.
// If your backend runs on a different port, update this URL.
export const BASE_URL = 'https://kabakalgym-api-gndmbwczhre4crb0.southeastasia-01.azurewebsites.net';
const API_BASE = `${BASE_URL}/api`;

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

export async function verifyEmail(email, otp) {
  return request('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
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

export async function getDashboardAnalytics(year, month) {
  return request(`/analytics/dashboard?year=${year}&month=${month}`);
}

export async function getHistoricalRevenue(months = 6) {
  return request(`/analytics/historical-revenue?months=${months}`);
}

export async function exportAndArchiveData(monthsAgo = 3) {
  const token = localStorage.getItem('kabakal_token');
  const response = await fetch(`${BASE_URL}/api/analytics/export-archive?monthsAgo=${monthsAgo}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to export and archive data.');
  }

  // Handle file download directly
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kabakal_archive_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function getMember(id) {
  return request(`/members/${id}`);
}

export async function getMyProfile() {
  return request('/me');
}

export async function getMyStats() {
  return request('/me/stats', { method: 'GET' });
}

export async function getCalendarData(dateString) {
  return request(`/me/calendar/${dateString}`, { method: 'GET' });
}

export async function getMyLatestRoutine() {
  return request('/me/latest-routine');
}

export async function updateProfilePicture(profilePictureUrl) {
  return request('/me/profile-picture', {
    method: 'PATCH',
    body: JSON.stringify({ profilePictureUrl }),
  });
}

export async function updateProfileSettings(data) {
  return request('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function exportAccountData() {
  return request('/me/export', {
    method: 'GET'
  });
}

export async function deleteAccount(permanent = false) {
  return request(`/me/account?permanent=${permanent}`, {
    method: 'DELETE'
  });
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

export async function processPayment() {
  return request('/payment/checkout', {
    method: 'POST'
  });
}

// -----------------------------------------------------------------------------
// AI Chat & Routine Endpoints
// -----------------------------------------------------------------------------

export async function sendChatMessage(message) {
  return request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function generateRoutine(data) {
  return request('/ai/generate-routine', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function saveRoutine(data) {
  return request('/ai/save-routine', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// -----------------------------------------------------------------------------
// Check-in & Gym Status Endpoints
// -----------------------------------------------------------------------------

export async function createEquipment(equipmentData) {
  return request('/equipment', {
    method: 'POST',
    body: JSON.stringify(equipmentData)
  });
}

export async function bulkCreateEquipment(items) {
  return request('/equipment/bulk-create', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}

export async function updateEquipment(id, data) {
  return request(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEquipment(id) {
  return request(`/equipment/${id}`, { method: 'DELETE' });
}

// ----------------------------------------------------------------------
// CHECK-IN & STAFF ENDPOINTS
// ----------------------------------------------------------------------

export async function getQrPayload() {
  return request('/checkin/qr', { method: 'GET' });
}

export async function getLiveCapacity() {
  const res = await request('/checkin/capacity', { method: 'GET' });
  return res.capacity;
}

export async function verifyCheckIn(qrPayload, latitude, longitude) {
  return request('/checkin/verify', {
    method: 'POST',
    body: JSON.stringify({ qrPayload, latitude, longitude }),
  });
}

export async function getPendingCheckins() {
  return request('/staff/pending-checkins', { method: 'GET' });
}

export async function approveCheckin(visitId) {
  return request(`/staff/approve-checkin/${visitId}`, { method: 'POST' });
}

export async function uploadEquipmentCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('kabakal_token');
  const response = await fetch(`${API_BASE}/equipment/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error || data?.title || `Upload failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

// ── Cloudinary Signed Upload ─────────────────────────────────────────────────

/**
 * Fetches a cryptographic upload signature from the C# backend.
 * Only Admin-authorized users can call this endpoint.
 */
export async function getUploadSignature() {
  return request('/upload/signature');
}

/**
 * Saves a Cloudinary CDN URL to the equipment record in the database.
 * Called AFTER the image has been uploaded directly to Cloudinary.
 */
export async function updateEquipmentImageUrl(id, imageUrl) {
  return request(`/equipment/${id}/image`, {
    method: 'PUT',
    body: JSON.stringify({ imageUrl }),
  });
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

