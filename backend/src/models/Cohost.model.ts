import { pool } from '../config/database';

export interface CohostPermission {
  id: number;
  listing_id: number;
  host_id: number;
  cohost_id: number;
  can_edit_listing: boolean;
  can_manage_bookings: boolean;
  can_respond_messages: boolean;
  created_at: Date;
}

export interface CreateCohostPermissionData {
  listing_id: number;
  host_id: number;
  cohost_id: number;
  can_edit_listing?: boolean;
  can_manage_bookings?: boolean;
  can_respond_messages?: boolean;
}

export class CohostModel {
  static async findByListingId(listingId: number): Promise<CohostPermission[]> {
    const result = await pool.query(
      'SELECT * FROM cohost_permissions WHERE listing_id = $1',
      [listingId]
    );
    return result.rows;
  }

  static async findByCohostId(cohostId: number): Promise<CohostPermission[]> {
    const result = await pool.query(
      'SELECT * FROM cohost_permissions WHERE cohost_id = $1',
      [cohostId]
    );
    return result.rows;
  }

  static async findPermission(
    listingId: number,
    cohostId: number
  ): Promise<CohostPermission | null> {
    const result = await pool.query(
      'SELECT * FROM cohost_permissions WHERE listing_id = $1 AND cohost_id = $2',
      [listingId, cohostId]
    );
    return result.rows[0] || null;
  }

  static async create(data: CreateCohostPermissionData): Promise<CohostPermission> {
    const result = await pool.query(
      `INSERT INTO cohost_permissions (
        listing_id, host_id, cohost_id,
        can_edit_listing, can_manage_bookings, can_respond_messages
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.listing_id,
        data.host_id,
        data.cohost_id,
        data.can_edit_listing ?? false,
        data.can_manage_bookings ?? false,
        data.can_respond_messages ?? false,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: {
      can_edit_listing?: boolean;
      can_manage_bookings?: boolean;
      can_respond_messages?: boolean;
    }
  ): Promise<CohostPermission> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.can_edit_listing !== undefined) {
      updates.push(`can_edit_listing = $${paramCount++}`);
      values.push(data.can_edit_listing);
    }
    if (data.can_manage_bookings !== undefined) {
      updates.push(`can_manage_bookings = $${paramCount++}`);
      values.push(data.can_manage_bookings);
    }
    if (data.can_respond_messages !== undefined) {
      updates.push(`can_respond_messages = $${paramCount++}`);
      values.push(data.can_respond_messages);
    }

    if (updates.length === 0) {
      const result = await pool.query(
        'SELECT * FROM cohost_permissions WHERE id = $1',
        [id]
      );
      return result.rows[0];
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE cohost_permissions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM cohost_permissions WHERE id = $1', [id]);
  }
}
