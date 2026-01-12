import { pool } from '../config/database';

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
  rules: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateListingData {
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
  images?: string[];
  amenities?: string[];
  rules?: string;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  price_per_night?: number;
  max_guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  amenities?: string[];
  rules?: string;
}

export class ListingModel {
  static async findById(id: number): Promise<Listing | null> {
    const result = await pool.query('SELECT * FROM listings WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  }

  static async findAll(filters?: {
    city?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    maxGuests?: number;
    limit?: number;
    offset?: number;
  }): Promise<Listing[]> {
    let query = 'SELECT * FROM listings WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.city) {
      query += ` AND city ILIKE $${paramCount++}`;
      values.push(`%${filters.city}%`);
    }
    if (filters?.country) {
      query += ` AND country ILIKE $${paramCount++}`;
      values.push(`%${filters.country}%`);
    }
    if (filters?.minPrice) {
      query += ` AND price_per_night >= $${paramCount++}`;
      values.push(filters.minPrice);
    }
    if (filters?.maxPrice) {
      query += ` AND price_per_night <= $${paramCount++}`;
      values.push(filters.maxPrice);
    }
    if (filters?.maxGuests) {
      query += ` AND max_guests >= $${paramCount++}`;
      values.push(filters.maxGuests);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(filters.limit);
    }
    if (filters?.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(filters.offset);
    }

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error: any) {
      console.error('Erreur dans ListingModel.findAll:', error);
      throw error;
    }
  }

  static async findByHostId(hostId: number): Promise<Listing[]> {
    const result = await pool.query(
      'SELECT * FROM listings WHERE host_id = $1 ORDER BY created_at DESC',
      [hostId]
    );
    return result.rows;
  }

  static async create(data: CreateListingData): Promise<Listing> {
    const result = await pool.query(
      `INSERT INTO listings (
        host_id, title, description, address, city, country,
        price_per_night, max_guests, bedrooms, bathrooms,
        images, amenities, rules
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.host_id,
        data.title,
        data.description,
        data.address,
        data.city,
        data.country,
        data.price_per_night,
        data.max_guests,
        data.bedrooms,
        data.bathrooms,
        JSON.stringify(data.images || []),
        JSON.stringify(data.amenities || []),
        data.rules || '',
      ]
    );
    return result.rows[0];
  }

  static async update(id: number, data: UpdateListingData): Promise<Listing> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'images' || key === 'amenities') {
          updates.push(`${key} = $${paramCount++}`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = $${paramCount++}`);
          values.push(value);
        }
      }
    });

    if (updates.length === 0) {
      return this.findById(id) as Promise<Listing>;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await pool.query(
      `UPDATE listings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
  }
}
