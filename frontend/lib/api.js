const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Request failed', response.status, data);
  }
  return data;
};

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Feed
  getFeed: (type = 'for-you', page = 1) => request(`/feed/${type}?page=${page}`),
  getFollowingFeed: (page = 1) => request(`/feed/following?page=${page}`),
  getTopicFeed: (topic, page = 1) => request(`/feed/topic/${topic}?page=${page}`),

  // Posts
  getPost: (postId) => request(`/posts/${postId}`),
  likePost: (postId) => request(`/posts/${postId}/like`, { method: 'POST' }),
  unlikePost: (postId) => request(`/posts/${postId}/like`, { method: 'DELETE' }),
  savePost: (postId) => request(`/posts/${postId}/save`, { method: 'POST' }),
  unsavePost: (postId) => request(`/posts/${postId}/save`, { method: 'DELETE' }),
  comment: (postId, content) => request(`/posts/${postId}/comment`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteComment: (commentId) => request(`/comments/${commentId}`, { method: 'DELETE' }),

  // Users
  getUser: (username) => request(`/users/${username}`),
  updateProfile: (username, data) => request(`/users/${username}`, { method: 'PUT', body: JSON.stringify(data) }),
  follow: (userId) => request(`/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId) => request(`/users/${userId}/follow`, { method: 'DELETE' }),
  getFollowers: (userId) => request(`/users/${userId}/followers`),
  getFollowing: (userId) => request(`/users/${userId}/following`),

  // Search
  search: (query, category = 'all') => request(`/search?q=${encodeURIComponent(query)}&category=${category}`),

  // Explore
  getExplore: (category = 'for-you', page = 1) => request(`/explore?category=${category}&page=${page}`),
  getTrending: () => request('/explore/trending'),

  // Subscriptions
  createSubscription: (creatorId, tier) => request('/subscriptions/create', { method: 'POST', body: JSON.stringify({ creatorId, tier }) }),
  getSubscriptions: () => request('/subscriptions'),
  cancelSubscription: (subscriptionId) => request(`/subscriptions/${subscriptionId}`, { method: 'DELETE' }),
  changeTier: (subscriptionId, tier) => request(`/subscriptions/${subscriptionId}/tier`, { method: 'PUT', body: JSON.stringify({ tier }) }),

  // Payments
  getPaymentHistory: () => request('/payments'),
  getPayfastRedirect: (creatorId, tier) => request('/payments/payfast-redirect', { method: 'POST', body: JSON.stringify({ creatorId, tier }) }),

  // Playlists
  getPlaylists: () => request('/playlists'),
  createPlaylist: (name, description) => request('/playlists', { method: 'POST', body: JSON.stringify({ name, description }) }),
  deletePlaylist: (playlistId) => request(`/playlists/${playlistId}`, { method: 'DELETE' }),
  addToPlaylist: (playlistId, postId) => request(`/playlists/${playlistId}/songs`, { method: 'POST', body: JSON.stringify({ postId }) }),
  removeFromPlaylist: (playlistId, songId) => request(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' }),

  // Upload
  getPresignedUrl: (fileName, fileType) => request('/uploads/presigned-url', { method: 'POST', body: JSON.stringify({ fileName, fileType }) }),
  uploadPost: (formData) => request('/posts', { method: 'POST', body: formData, headers: {} }),
  uploadProfilePicture: (formData) => request('/creator/profile-picture', { method: 'POST', body: formData, headers: {} }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: 'POST' }),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Admin (if user is admin)
  admin: {
    getDashboard: () => request('/admin/dashboard'),
    getUsers: (type, page) => request(`/admin/users?type=${type}&page=${page}`),
    banUser: (userId, reason, duration) => request(`/admin/users/${userId}/ban`, { method: 'POST', body: JSON.stringify({ reason, duration }) }),
    suspendUser: (userId, reason, duration) => request(`/admin/users/${userId}/suspend`, { method: 'POST', body: JSON.stringify({ reason, duration }) }),
    shadowBan: (userId, reason, duration) => request(`/admin/users/${userId}/shadow-ban`, { method: 'POST', body: JSON.stringify({ reason, duration }) }),
    deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
    impersonateUser: (userId) => request(`/admin/impersonate/${userId}`, { method: 'POST' }),
    getUserActivity: (userId, page = 1) => request(`/admin/users/${userId}/activity?page=${page}`),
    getUserStats: (userId) => request(`/admin/users/${userId}/stats`),
    approvePost: (postId, approvalType) => request(`/admin/posts/${postId}/approve-${approvalType}`, { method: 'POST' }),
    rejectPost: (postId, reason) => request(`/admin/posts/${postId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    bulkApprovePosts: (postIds, approvalType) => request('/admin/posts/bulk-approve', { method: 'POST', body: JSON.stringify({ postIds, approvalType }) }),
    bulkDeletePosts: (postIds) => request('/admin/posts/bulk-delete', { method: 'POST', body: JSON.stringify({ postIds }) }),
    getPendingVerifications: () => request('/admin/verification/pending'),
    approveVerification: (userId) => request(`/admin/verification/${userId}/approve`, { method: 'POST' }),
    rejectVerification: (userId, reason) => request(`/admin/verification/${userId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getContracts: () => request('/admin/contracts'),
    approveContract: (contractId) => request(`/admin/contracts/${contractId}/approve`, { method: 'POST' }),
    rejectContract: (contractId, reason) => request(`/admin/contracts/${contractId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getRevenue: () => request('/admin/revenue'),
    getPayouts: () => request('/admin/payouts'),
    approvePayout: (payoutId) => request(`/admin/payouts/${payoutId}/approve`, { method: 'POST' }),
    sendBroadcast: (title, message, recipientType, scheduledFor) => request('/admin/broadcast', { method: 'POST', body: JSON.stringify({ title, message, recipientType, scheduledFor }) }),
    getSecurityDashboard: () => request('/admin/security/dashboard'),
    getAuditLogs: (page) => request(`/admin/audit-logs?page=${page}`),
    getIPRules: () => request('/admin/ip-rules'),
    addIPRule: (ipAddress, type, reason) => request('/admin/ip-rules', { method: 'POST', body: JSON.stringify({ ipAddress, type, reason }) }),
    deleteIPRule: (ruleId) => request(`/admin/ip-rules/${ruleId}`, { method: 'DELETE' }),
    killSwitch: (action) => request('/admin/kill-switch', { method: 'POST', body: JSON.stringify({ action }) }),
    getModerationRules: () => request('/admin/moderation-rules'),
    createModerationRule: (name, description, condition, action, duration) => request('/admin/moderation-rules', { method: 'POST', body: JSON.stringify({ name, description, condition, action, duration }) }),
    toggleModerationRule: (ruleId) => request(`/admin/moderation-rules/${ruleId}/toggle`, { method: 'PUT' }),
    getAnalytics: (type) => request(`/admin/analytics/${type}`),
    exportData: (type) => request(`/admin/export/${type}`),
  },
};

export default api;