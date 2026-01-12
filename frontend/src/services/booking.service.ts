import api from './api';

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
}

export const bookingService = {
  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  getById: async (id: number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  create: async (data: CreateBookingData): Promise<Booking> => {
    const response = await api.post('/bookings', data);
    return response.data.booking;
  },

  updateStatus: async (id: number, status: Booking['status']): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data.booking;
  },

  cancel: async (id: number): Promise<void> => {
    await api.delete(`/bookings/${id}`);
  },
};
