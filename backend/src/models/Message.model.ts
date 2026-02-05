import { pool } from '../config/database';

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
  read_at: Date | null;
  sender_name?: string;
  sender_role?: string;
}

export interface Conversation {
  id: number;
  listing_id: number;
  guest_id: number;
  host_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMessageData {
  conversation_id: number;
  sender_id: number;
  content: string;
}

export class MessageModel {
  static async findConversationById(
    id: number
  ): Promise<Conversation | null> {
    const result = await pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findConversationByListingAndUsers(
    listingId: number,
    guestId: number,
    hostId: number
  ): Promise<Conversation | null> {
    const result = await pool.query(
      `SELECT * FROM conversations
       WHERE listing_id = $1 AND guest_id = $2 AND host_id = $3`,
      [listingId, guestId, hostId]
    );
    return result.rows[0] || null;
  }

  static async createConversation(data: {
    listing_id: number;
    guest_id: number;
    host_id: number;
  }): Promise<Conversation> {
    const result = await pool.query(
      `INSERT INTO conversations (listing_id, guest_id, host_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.listing_id, data.guest_id, data.host_id]
    );
    return result.rows[0];
  }

  static async findConversationsByUserId(userId: number): Promise<
    (Conversation & { listing_title: string; other_user_name: string; unread_count: number })[]
  > {
    const result = await pool.query(
      `SELECT c.*, l.title as listing_title,
              CASE
                WHEN c.guest_id = $1 THEN CONCAT(u2.first_name, ' ', u2.last_name)
                ELSE CONCAT(u1.first_name, ' ', u1.last_name)
              END as other_user_name,
              (SELECT COUNT(*) 
               FROM messages m 
               WHERE m.conversation_id = c.id 
                 AND m.sender_id != $1 
                 AND m.read_at IS NULL
              ) as unread_count
       FROM conversations c
       JOIN listings l ON c.listing_id = l.id
       JOIN users u1 ON c.guest_id = u1.id
       JOIN users u2 ON c.host_id = u2.id
       WHERE c.guest_id = $1 OR c.host_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findMessagesByConversationId(
    conversationId: number
  ): Promise<Message[]> {
    const result = await pool.query(
      `SELECT m.*, 
              CONCAT(u.first_name, ' ', u.last_name) as sender_name,
              u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1 
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    return result.rows;
  }

  static async create(data: CreateMessageData): Promise<Message> {
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.conversation_id, data.sender_id, data.content]
    );

    // Mettre à jour la date de mise à jour de la conversation
    await pool.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [data.conversation_id]
    );

    return result.rows[0];
  }

  static async markAsRead(conversationId: number, userId: number): Promise<void> {
    await pool.query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [conversationId, userId]
    );
  }

  static async countUnreadMessages(userId: number): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.guest_id = $1 OR c.host_id = $1)
         AND m.sender_id != $1
         AND m.read_at IS NULL`,
      [userId]
    );
    return parseInt(result.rows[0].count) || 0;
  }
}
