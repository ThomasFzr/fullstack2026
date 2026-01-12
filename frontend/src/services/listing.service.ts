import api from './api';

export interface Listing {
  id: number;
  host_id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  rules?: string;
  created_at: string;
  updated_at: string;
}

export interface ListingFilters {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  maxGuests?: number;
  limit?: number;
  offset?: number;
}

export const listingService = {
  getAll: async (filters?: ListingFilters): Promise<{ listings: Listing[]; total: number }> => {
    const response = await api.get('/listings', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<Listing> => {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },

  getMyListings: async (): Promise<Listing[]> => {
    const response = await api.get('/listings/my-listings');
    return response.data;
  },

  create: async (data: Omit<Listing, 'id' | 'host_id' | 'created_at' | 'updated_at'>): Promise<Listing> => {
    const response = await api.post('/listings', data);
    return response.data.listing;
  },

  update: async (id: number, data: Partial<Listing>): Promise<Listing> => {
    const response = await api.put(`/listings/${id}`, data);
    return response.data.listing;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/listings/${id}`);
  },
};
