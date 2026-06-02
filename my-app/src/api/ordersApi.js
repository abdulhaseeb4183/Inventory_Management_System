import { api } from './api';

export const ordersApi = {
  getAll:          ()                      => api.get('/orders'),
  create:          (data)                  => api.post('/orders', data),
  update:          (id, data)              => api.put(`/orders/${id}`, data),
  updateStatus:    (id, newStatus)         => api.patch(`/orders/${id}/status`, { newStatus }),
  updateShipping:  (id, shippingPatch)     => api.patch(`/orders/${id}/shipping`, shippingPatch),
  remove:          (id)                    => api.delete(`/orders/${id}`),
};
