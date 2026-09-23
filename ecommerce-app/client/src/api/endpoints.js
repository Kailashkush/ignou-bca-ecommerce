/**
 * Typed wrappers around every API route.
 *
 * Collecting the URLs here means a change to a route path is made in one file,
 * and components never build URL strings themselves.
 */
import api from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
  updateProfile: (payload) => api.patch('/auth/me', payload).then((r) => r.data.data.user),
  changePassword: (payload) => api.patch('/auth/me/password', payload).then((r) => r.data.data),
};

export const catalogApi = {
  listProducts: (params) => api.get('/products', { params }).then((r) => r.data.data),
  getProduct: (id) => api.get(`/products/${id}`).then((r) => r.data.data.product),
  getRelated: (id) => api.get(`/products/${id}/related`).then((r) => r.data.data.items),
  listCategories: () => api.get('/categories').then((r) => r.data.data.items),
};

export const orderApi = {
  quote: (items) => api.post('/orders/quote', { items }).then((r) => r.data.data),
  create: (payload) => api.post('/orders', payload).then((r) => r.data.data.order),
  listMine: (params) => api.get('/orders/my', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data.data.order),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }).then((r) => r.data.data.order),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data.data),
  listUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data.data),
  setUserStatus: (id, isActive) =>
    api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data.data.user),

  listOrders: (params) => api.get('/orders', { params }).then((r) => r.data.data),
  updateOrderStatus: (id, status, note) =>
    api.patch(`/orders/${id}/status`, { status, note }).then((r) => r.data.data.order),

  createProduct: (payload) => api.post('/products', payload).then((r) => r.data.data.product),
  updateProduct: (id, payload) => api.patch(`/products/${id}`, payload).then((r) => r.data.data.product),
  deleteProduct: (id) => api.delete(`/products/${id}`).then((r) => r.data),
  setStock: (id, stockCount) =>
    api.patch(`/products/${id}/stock`, { stockCount }).then((r) => r.data.data.product),

  createCategory: (payload) => api.post('/categories', payload).then((r) => r.data.data.category),
  updateCategory: (id, payload) => api.patch(`/categories/${id}`, payload).then((r) => r.data.data.category),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};
