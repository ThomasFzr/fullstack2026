import { pool } from '../config/database';

export enum UserRole {
  USER = 'user',
  HOST = 'host',
  COHOST = 'cohost',
}

export interface User {
  id: number;
  email: string;
  password_hash: string | null;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_host: boolean;
  github_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  is_host?: boolean;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findByGithubId(githubId: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE github_id = $1',
      [githubId]
    );
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(data: CreateUserData): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_host)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.email,
        data.password,
        data.first_name,
        data.last_name,
        UserRole.USER,
        false,
      ]
    );
    return result.rows[0];
  }

  static async update(id: number, data: UpdateUserData): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(data.last_name);
    }
    if (data.is_host !== undefined) {
      updates.push(`is_host = $${paramCount++}`);
      values.push(data.is_host);
      if (data.is_host) {
        updates.push(`role = $${paramCount++}`);
        values.push(UserRole.HOST);
      }
    }

    if (updates.length === 0) {
      return this.findById(id) as Promise<User>;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async updateRole(id: number, role: UserRole): Promise<User> {
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, id]
    );
    return result.rows[0];
  }

  static async createFromGithub(data: {
    email: string;
    first_name: string;
    last_name: string;
    github_id: string;
    password_hash: string;
  }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_host, github_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.email,
        data.password_hash,
        data.first_name,
        data.last_name,
        UserRole.USER,
        false,
        data.github_id,
      ]
    );
    return result.rows[0];
  }
}
