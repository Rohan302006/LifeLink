const API_BASE = '/api';

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('lifelink_token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res, defaultError = 'Request failed') {
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || errorJson.message || `${defaultError} (${res.status})`);
  }
  return res.json();
}

export const api = {
  // 1. Authentication
  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res, 'Registration failed');
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res, 'Login failed');
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch current user session');
  },

  // 2. Onboarding
  async updateOnboardingDetails(details) {
    const res = await fetch(`${API_BASE}/onboarding/details`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(details),
    });
    return handleResponse(res, 'Failed to save profile details');
  },

  async completeOnboarding() {
    const res = await fetch(`${API_BASE}/onboarding/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to complete onboarding wizard');
  },

  // 3. Document Management (Private Uploads & Streaming)
  async uploadDocument(file, docType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse(res, 'Document upload failed');
  },

  async getUserDocuments(userId) {
    const res = await fetch(`${API_BASE}/documents/user/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch documents');
  },

  async reviewDocument(docId, status, rejectionReason = '') {
    const res = await fetch(`${API_BASE}/documents/${docId}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, rejection_reason: rejectionReason }),
    });
    return handleResponse(res, 'Failed to review document');
  },

  getDocumentViewUrl(docId) {
    return `${API_BASE}/documents/${docId}/view`;
  },

  getDocumentDownloadUrl(docId) {
    return `${API_BASE}/documents/${docId}/download`;
  },

  // 4. Donor Dashboard & Actions
  async getDonorDashboard() {
    const res = await fetch(`${API_BASE}/donors/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to load donor dashboard');
  },

  async toggleDonorAvailability(isAvailable) {
    const res = await fetch(`${API_BASE}/donors/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_available: isAvailable }),
    });
    return handleResponse(res, 'Failed to update availability');
  },

  async updateDonationDate(lastDonationDate) {
    const res = await fetch(`${API_BASE}/donors/donation-date`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ last_donation_date: lastDonationDate }),
    });
    return handleResponse(res, 'Failed to update donation date');
  },

  async respondMatch(matchId, action) {
    const res = await fetch(`${API_BASE}/donors/matches/${matchId}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    return handleResponse(res, 'Failed to respond to match');
  },

  // 5. Receiver Dashboard & Actions
  async getReceiverDashboard() {
    const res = await fetch(`${API_BASE}/receivers/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to load receiver dashboard');
  },

  // 6. Blood Requests (Donor & Receiver Cross-Functionality)
  async createBloodRequest(data) {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to create blood request');
  },

  async getMyRequests() {
    const res = await fetch(`${API_BASE}/requests/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to load my requests');
  },

  async getRequestById(id) {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch request details');
  },

  // 7. Doctor Review Portal
  async getDoctorDonors() {
    const res = await fetch(`${API_BASE}/doctor/donors`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch donors list');
  },

  async getDoctorReceivers() {
    const res = await fetch(`${API_BASE}/doctor/receivers`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch receivers list');
  },

  async getDoctorRequests() {
    const res = await fetch(`${API_BASE}/doctor/requests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch blood requests');
  },

  async getDoctorPersonProfile(userId) {
    const res = await fetch(`${API_BASE}/doctor/profile/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch person profile');
  },

  async verifyDonationDate(userId, status, rejectionReason = '') {
    const res = await fetch(`${API_BASE}/doctor/verify-donation-date`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: userId, status, rejection_reason: rejectionReason }),
    });
    return handleResponse(res, 'Failed to verify donation date');
  },

  async verifyBloodRequest(requestId, status, rejectionReason = '', doctorNotes = '') {
    const res = await fetch(`${API_BASE}/doctor/verify-request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        request_id: requestId,
        status,
        rejection_reason: rejectionReason,
        doctor_notes: doctorNotes,
      }),
    });
    return handleResponse(res, 'Failed to verify blood request');
  },

  // 8. Admin Portal (Approve / Reject Doctors)
  async getAdminDoctors() {
    const res = await fetch(`${API_BASE}/admin/doctors`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch doctor accounts');
  },

  async approveDoctor(doctorId) {
    const res = await fetch(`${API_BASE}/admin/approve-doctor/${doctorId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to approve doctor account');
  },

  async rejectDoctor(doctorId, rejectionReason) {
    const res = await fetch(`${API_BASE}/admin/reject-doctor/${doctorId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
    return handleResponse(res, 'Failed to reject doctor account');
  },
};

