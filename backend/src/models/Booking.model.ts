import { pool } from '../config/database';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: Date;
  check_out: Date;
  guests: number;
  total_price: number;
  status: BookingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingData {
  listing_id: number;
  guest_id: number;
  check_in: Date;
  check_out: Date;
  guests: number;
  total_price: number;
}

export class BookingModel {
  static async findById(id: number): Promise<Booking | null> {
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  }

  static async findByGuestId(guestId: number): Promise<Booking[]> {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE guest_id = $1 ORDER BY check_in DESC',
      [guestId]
    );
    return result.rows;
  }

  static async findByListingId(listingId: number): Promise<Booking[]> {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE listing_id = $1 ORDER BY check_in DESC',
      [listingId]
    );
    return result.rows;
  }

  static async findConflictingBookings(
    listingId: number,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: number
  ): Promise<Booking[]> {
    let query = `
      SELECT * FROM bookings
      WHERE listing_id = $1
        AND status IN ('pending', 'confirmed')
        AND (
          (check_in <= $2 AND check_out > $2)
          OR (check_in < $3 AND check_out >= $3)
          OR (check_in >= $2 AND check_out <= $3)
        )
    `;
    const values: any[] = [listingId, checkIn, checkOut];

    if (excludeBookingId) {
      query += ' AND id != $4';
      values.push(excludeBookingId);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async create(data: CreateBookingData): Promise<Booking> {
    const result = await pool.query(
      `INSERT INTO bookings (
        listing_id, guest_id, check_in, check_out, guests, total_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.listing_id,
        data.guest_id,
        data.check_in,
        data.check_out,
        data.guests,
        data.total_price,
        BookingStatus.PENDING,
      ]
    );
    return result.rows[0];
  }

  static async updateStatus(
    id: number,
    status: BookingStatus
  ): Promise<Booking> {
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
  }
}
