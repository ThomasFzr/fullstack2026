import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, Conversation, Message } from '../services/message.service';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import './Messages.css';

export const Messages = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Désactiver le scroll de la page au montage du composant
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const scrollToBottom = (instant = false) => {
    if (instant) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageService.getConversations,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => messageService.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => messageService.sendMessage(selectedConversation!, content),
    onSuccess: () => {
      setMessageContent('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setTimeout(() => scrollToBottom(false), 100);
    },
  });

  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom(true); // Scroll instantané quand on ouvre une conversation
    }
  }, [messages]);

  const handleSelectConversation = async (conversationId: number) => {
    setSelectedConversation(conversationId);
    
    // Optimistic update: mettre à jour immédiatement la UI
    queryClient.setQueryData(['conversations'], (old: Conversation[] | undefined) => {
      if (!old) return old;
      return old.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      );
    });
    
    // Invalider immédiatement le compteur de notifications
    queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    
    // Marquer comme lu en arrière-plan
    messageService.markAsRead(conversationId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  };

  useEffect(() => {
    if (selectedConversation) {
      messageService.markAsRead(selectedConversation).then(() => {
        queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      });
    }
  }, [selectedConversation, messages, queryClient]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageContent.trim()) {
      sendMessageMutation.mutate(messageContent);
    }
  };

  return (
    <div className="messages-page">
      <h1>Messages</h1>
      <div className="messages-container">
        <div className="conversations-list">
          <h2>Conversations</h2>
          {conversations && conversations.length > 0 ? (
            <div className="conversations">
              {conversations.map((conversation: Conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${
                    selectedConversation === conversation.id ? 'active' : ''
                  } ${(conversation.unread_count ?? 0) > 0 ? 'has-unread' : ''}`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="conversation-header">
                    <h3>{conversation.listing_title || 'Annonce'}</h3>
                    {(conversation.unread_count ?? 0) > 0 && (
                      <span className="unread-badge">{conversation.unread_count}</span>
                    )}
                  </div>
                  <p>{conversation.other_user_name}</p>
                  <span className="conversation-date">
                    {format(new Date(conversation.updated_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Aucune conversation</p>
          )}
        </div>
        <div className="messages-panel">
          {selectedConversation ? (
            <>
              <div className="messages-list">
                {messages && messages.length > 0 ? (
                  <>
                    {messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`message ${message.sender_id === user?.id ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">{message.content}</div>
                        <div className="message-time">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <p className="empty">Aucun message</p>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="message-input"
                />
                <button type="submit" className="btn btn-primary" disabled={sendMessageMutation.isPending}>
                  Envoyer
                </button>
              </form>
            </>
          ) : (
            <div className="no-selection">
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
