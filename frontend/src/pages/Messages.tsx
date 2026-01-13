import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, Conversation, Message } from '../services/message.service';
import { format } from 'date-fns';
import './Messages.css';

export const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const queryClient = useQueryClient();

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
    },
  });

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
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <h3>{conversation.listing_title || 'Annonce'}</h3>
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
                  messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`message ${message.sender_id === 1 ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </div>
                    </div>
                  ))
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
