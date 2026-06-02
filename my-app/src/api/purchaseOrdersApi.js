import { api } from './api';

export const purchaseOrdersApi = {
  getAll:  ()         => api.get('/purchase-orders'),
  create:  (data)     => api.post('/purchase-orders', data),
  update:  (id, data) => api.put(`/purchase-orders/${id}`, data),
  remove:  (id)       => api.delete(`/purchase-orders/${id}`),
};
