import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MessageModel, CreateMessageData } from '../models/Message.model';
import { ListingModel } from '../models/Listing.model';
import { AppError } from '../middleware/errorHandler';
import { CohostModel } from '../models/Cohost.model';
import { pool } from '../config/database';

export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    // Récupérer toujours les conversations personnelles de l'utilisateur (en tant que guest ou host)
    let conversations = await MessageModel.findConversationsByUserId(req.user.id);

    // Si l'utilisateur est co-hôte, ajouter les conversations des listings où il a can_respond_messages
    if (req.user.role === 'cohost') {
      const cohostPermissions = await CohostModel.findByCohostId(req.user.id);
      const listingIdsWithMessagePermission = cohostPermissions
        .filter(p => p.can_respond_messages)
        .map(p => p.listing_id);

      if (listingIdsWithMessagePermission.length > 0) {
        // Ajouter les conversations où l'utilisateur est co-hôte
        const cohostConversationsResult = await pool.query(
          `SELECT c.*, l.title as listing_title,
                  CONCAT(u1.first_name, ' ', u1.last_name) as other_user_name,
                  (SELECT COUNT(*) 
                   FROM messages m 
                   WHERE m.conversation_id = c.id 
                     AND m.sender_id != $1 
                     AND m.read_at IS NULL
                  ) as unread_count
           FROM conversations c
           JOIN listings l ON c.listing_id = l.id
           JOIN users u1 ON c.guest_id = u1.id
           WHERE c.listing_id = ANY($2::int[])
             AND c.host_id != $1
           ORDER BY c.updated_at DESC`,
          [req.user.id, listingIdsWithMessagePermission]
        );

        // Fusionner et dédupliquer les conversations
        const conversationMap = new Map();
        [...conversations, ...cohostConversationsResult.rows].forEach(conv => {
          if (!conversationMap.has(conv.id)) {
            conversationMap.set(conv.id, conv);
          }
        });
        conversations = Array.from(conversationMap.values());
      }
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const conversation = await MessageModel.findConversationById(parseInt(id));

    if (!conversation) {
      return next(new AppError('Conversation non trouvée', 404));
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (
      conversation.guest_id !== req.user.id &&
      conversation.host_id !== req.user.id
    ) {
      // Vérifier si c'est un co-hôte avec les bonnes permissions
      if (req.user.role === 'cohost') {
        const permission = await CohostModel.findPermission(
          conversation.listing_id,
          req.user.id
        );
        if (!permission || !permission.can_respond_messages) {
          return next(new AppError('Accès refusé', 403));
        }
      } else {
        return next(new AppError('Accès refusé', 403));
      }
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { listing_id } = req.body;

    // Vérifier que le listing existe
    const listing = await ListingModel.findById(listing_id);
    if (!listing) {
      return next(new AppError('Annonce non trouvée', 404));
    }

    // Vérifier que l'utilisateur n'est pas le propriétaire
    if (listing.host_id === req.user.id) {
      return next(
        new AppError('Vous ne pouvez pas créer une conversation pour votre propre annonce', 400)
      );
    }

    // Chercher une conversation existante
    let conversation = await MessageModel.findConversationByListingAndUsers(
      listing_id,
      req.user.id,
      listing.host_id
    );

    // Créer une nouvelle conversation si elle n'existe pas
    if (!conversation) {
      conversation = await MessageModel.createConversation({
        listing_id,
        guest_id: req.user.id,
        host_id: listing.host_id,
      });
    }

    res.status(201).json({
      message: 'Conversation créée ou récupérée',
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const conversation = await MessageModel.findConversationById(parseInt(id));

    if (!conversation) {
      return next(new AppError('Conversation non trouvée', 404));
    }

    // Vérifier les permissions
    if (
      conversation.guest_id !== req.user.id &&
      conversation.host_id !== req.user.id
    ) {
      if (req.user.role === 'cohost') {
        const permission = await CohostModel.findPermission(
          conversation.listing_id,
          req.user.id
        );
        if (!permission || !permission.can_respond_messages) {
          return next(new AppError('Accès refusé', 403));
        }
      } else {
        return next(new AppError('Accès refusé', 403));
      }
    }

    const messages = await MessageModel.findMessagesByConversationId(
      parseInt(id)
    );

    // Marquer les messages comme lus
    await MessageModel.markAsRead(parseInt(id), req.user.id);

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const { content } = req.body;

    const conversation = await MessageModel.findConversationById(parseInt(id));

    if (!conversation) {
      return next(new AppError('Conversation non trouvée', 404));
    }

    // Vérifier les permissions
    if (
      conversation.guest_id !== req.user.id &&
      conversation.host_id !== req.user.id
    ) {
      if (req.user.role === 'cohost') {
        const permission = await CohostModel.findPermission(
          conversation.listing_id,
          req.user.id
        );
        if (!permission || !permission.can_respond_messages) {
          return next(new AppError('Accès refusé', 403));
        }
      } else {
        return next(new AppError('Accès refusé', 403));
      }
    }

    const messageData: CreateMessageData = {
      conversation_id: parseInt(id),
      sender_id: req.user.id,
      content,
    };

    const message = await MessageModel.create(messageData);

    res.status(201).json({
      message: 'Message envoyé',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    await MessageModel.markAsRead(parseInt(id), req.user.id);

    res.json({
      message: 'Messages marqués comme lus',
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const count = await MessageModel.countUnreadMessages(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};
