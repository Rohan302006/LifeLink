import {
  User,
  BloodRequest,
  Hospital,
  MatchedDonor,
  DonationRecord,
  OrganPledge,
  CoordinatorLog,
  ImpactMetrics,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lifelink_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async register(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async sendOtp(identifier: string): Promise<{ success: boolean; previewCode: string }> {
    const res = await fetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send OTP');
    }
    return res.json();
  },

  async verifyOtp(identifier: string, code: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid OTP');
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<{ success: boolean; previewCode?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset password');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  async withdrawConsent(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/withdraw-consent`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Hospitals
  async getHospitals(): Promise<{ hospitals: Hospital[] }> {
    const res = await fetch(`${API_BASE}/admin/hospitals`);
    return res.json();
  },

  // Blood Requests
  async createRequest(data: any): Promise<{ success: boolean; request: BloodRequest; message: string }> {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error || 'Failed to create request');
    }
    return json;
  },

  async getRequests(): Promise<{ requests: BloodRequest[] }> {
    const res = await fetch(`${API_BASE}/requests`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getRequestById(id: string): Promise<{ request: BloodRequest }> {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Request not found');
    return res.json();
  },

  async verifyRequest(id: string, doctor_notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/requests/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ doctor_notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Verification failed');
    }
    return res.json();
  },

  async rejectRequest(id: string, rejection_reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/requests/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejection_reason }),
    });
    return res.json();
  },

  async getRequestMatches(id: string): Promise<{ matches: MatchedDonor[] }> {
    const res = await fetch(`${API_BASE}/requests/${id}/matches`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Donor
  async getDonorProfile(): Promise<any> {
    const res = await fetch(`${API_BASE}/donors/profile`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async toggleAvailability(is_available: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/donors/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_available }),
    });
    return res.json();
  },

  async getDonorMatches(): Promise<any> {
    const res = await fetch(`${API_BASE}/donors/matches`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async respondMatch(matchId: string, action: 'accept' | 'decline'): Promise<any> {
    const res = await fetch(`${API_BASE}/donors/matches/${matchId}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    return res.json();
  },

  // Donations
  async logDonation(data: any): Promise<{ success: boolean; donation: DonationRecord; message?: string }> {
    const res = await fetch(`${API_BASE}/donations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to log donation');
    }
    return res.json();
  },

  async getDonations(): Promise<{ donations: DonationRecord[] }> {
    const res = await fetch(`${API_BASE}/donations`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Organ Pledges & Coordinator Logs
  async submitOrganPledge(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/organ/pledge`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getOrganPledges(): Promise<{ pledges: OrganPledge[] }> {
    const res = await fetch(`${API_BASE}/organ/pledges`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async logCoordinatorConversation(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/organ/coordinator-log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getCoordinatorLogs(): Promise<{ logs: CoordinatorLog[] }> {
    const res = await fetch(`${API_BASE}/organ/coordinator-logs`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // AI Assistant
  async getAiIntakeDraft(text: string, language: string = 'en'): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    return res.json();
  },

  async getAiFaqResponse(query: string, language: string = 'en'): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/faq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language }),
    });
    return res.json();
  },

  // Admin & Impact
  async getImpactMetrics(): Promise<{ metrics: ImpactMetrics }> {
    const res = await fetch(`${API_BASE}/admin/impact`);
    return res.json();
  },

  async getAuditLogs(): Promise<{ logs: any[] }> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Demo Simulation
  async resetDemoData(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return res.json();
  },

  async executeDemoStep(stepNumber: number): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/step/${stepNumber}`, { method: 'POST' });
    return res.json();
  },

  async getDemoState(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/state`);
    return res.json();
  },
};
