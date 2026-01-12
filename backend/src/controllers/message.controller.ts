import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MessageModel, CreateMessageData } from '../models/Message.model';
import { ListingModel } from '../models/Listing.model';
import { AppError } from '../middleware/errorHandler';
import { CohostModel } from '../models/Cohost.model';

export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const conversations = await MessageModel.findConversationsByUserId(
      req.user.id
    );

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
