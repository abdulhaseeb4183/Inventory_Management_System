import { api } from './api';

export const itemsApi = {
  getAll:      ()              => api.get('/items'),
  create:      (data)          => api.post('/items', data),
  update:      (id, data)      => api.put(`/items/${id}`, data),
  remove:      (id)            => api.delete(`/items/${id}`),
  adjustStock: (id, amount, operation) =>
    api.post(`/items/${id}/adjust-stock`, { amount, operation }),
};
