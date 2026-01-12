import api from './api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_host: boolean;
  created_at?: string;
}

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { first_name?: string; last_name?: string }): Promise<User> => {
    const response = await api.put('/users/profile', data);
    return response.data.user;
  },

  becomeHost: async (): Promise<User> => {
    const response = await api.post('/users/become-host');
    return response.data.user;
  },
};
