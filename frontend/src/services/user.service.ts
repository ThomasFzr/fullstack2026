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

export interface CohostPermission {
  id: number;
  listing_id: number;
  host_id: number;
  cohost_id: number;
  can_edit_listing: boolean;
  can_manage_bookings: boolean;
  can_respond_messages: boolean;
  created_at: string;
  cohost?: User;
}

export interface CreateCohostData {
  listing_id: number;
  cohost_id: number;
  can_edit_listing?: boolean;
  can_manage_bookings?: boolean;
  can_respond_messages?: boolean;
}

export interface UpdateCohostData {
  can_edit_listing?: boolean;
  can_manage_bookings?: boolean;
  can_respond_messages?: boolean;
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

  // Gestion des co-hôtes
  getCohosts: async (): Promise<CohostPermission[]> => {
    const response = await api.get('/users/cohosts');
    return response.data;
  },

  createCohost: async (data: CreateCohostData): Promise<CohostPermission> => {
    const response = await api.post('/users/cohosts', data);
    return response.data.permission;
  },

  updateCohost: async (id: number, data: UpdateCohostData): Promise<CohostPermission> => {
    const response = await api.put(`/users/cohosts/${id}`, data);
    return response.data.permission;
  },

  deleteCohost: async (id: number): Promise<void> => {
    await api.delete(`/users/cohosts/${id}`);
  },

  // Rechercher des utilisateurs par email
  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
