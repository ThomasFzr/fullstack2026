import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '../services/user.service';
import './ManageCohosts.css';

interface ManageCoHostsProps {
  listingId: number;
  listingTitle: string;
  onClose: () => void;
}

const ManageCohosts: React.FC<ManageCoHostsProps> = ({ listingId, listingTitle, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState({
    can_edit_listing: false,
    can_manage_bookings: false,
    can_respond_messages: false,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Récupérer les co-hôtes existants
  const { data: cohosts = [], isLoading } = useQuery({
    queryKey: ['cohosts', listingId],
    queryFn: async () => {
      const allCohosts = await userService.getCohosts();
      return allCohosts.filter(c => c.listing_id === listingId);
    },
  });

  // Mutation pour créer un co-hôte
  const createMutation = useMutation({
    mutationFn: userService.createCohost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohosts', listingId] });
      setSelectedUserId(null);
      setSearchQuery('');
      setSearchResults([]);
      setPermissions({
        can_edit_listing: false,
        can_manage_bookings: false,
        can_respond_messages: false,
      });
      alert('Co-hôte ajouté avec succès !');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erreur lors de l\'ajout du co-hôte');
    },
  });

  // Mutation pour mettre à jour les permissions
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      userService.updateCohost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohosts', listingId] });
      setEditingPermissionId(null);
      alert('Permissions mises à jour !');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Mutation pour supprimer un co-hôte
  const deleteMutation = useMutation({
    mutationFn: userService.deleteCohost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohosts', listingId] });
      alert('Co-hôte retiré avec succès !');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erreur lors de la suppression');
    },
  });

  // Rechercher des utilisateurs
  const handleSearch = async () => {
    if (searchQuery.length < 3) {
      alert('Veuillez entrer au moins 3 caractères');
      return;
    }

    setIsSearching(true);
    try {
      const results = await userService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  // Ajouter un co-hôte
  const handleAddCohost = () => {
    if (!selectedUserId) {
      alert('Veuillez sélectionner un utilisateur');
      return;
    }

    createMutation.mutate({
      listing_id: listingId,
      cohost_id: selectedUserId,
      ...permissions,
    });
  };

  // Supprimer un co-hôte
  const handleDeleteCohost = (cohostId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir retirer ce co-hôte ?')) {
      deleteMutation.mutate(cohostId);
    }
  };

  // Mettre à jour les permissions
  const handleUpdatePermissions = (cohostId: number) => {
    const cohost = cohosts.find(c => c.id === cohostId);
    if (!cohost) return;

    updateMutation.mutate({
      id: cohostId,
      data: {
        can_edit_listing: cohost.can_edit_listing,
        can_manage_bookings: cohost.can_manage_bookings,
        can_respond_messages: cohost.can_respond_messages,
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gérer les co-hôtes</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="listing-info">
            <h3>{listingTitle}</h3>
          </div>

          {/* Section d'ajout de co-hôtes */}
          <div className="add-cohost-section">
            <h4>Ajouter un co-hôte</h4>
            <div className="search-container">
              <input
                type="text"
                placeholder="Rechercher par email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="btn btn-secondary"
              >
                {isSearching ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((user) => (
                  <div 
                    key={user.id} 
                    className={`user-result ${selectedUserId === user.id ? 'selected' : ''}`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="user-info">
                      <strong>{user.first_name} {user.last_name}</strong>
                      <span>{user.email}</span>
                    </div>
                    {selectedUserId === user.id && <span className="check-icon">✓</span>}
                  </div>
                ))}
              </div>
            )}

            {selectedUserId && (
              <div className="permissions-section">
                <h5>Permissions</h5>
                <label className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={permissions.can_edit_listing}
                    onChange={(e) => setPermissions({...permissions, can_edit_listing: e.target.checked})}
                  />
                  <span>Peut modifier l'annonce</span>
                </label>
                <label className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={permissions.can_manage_bookings}
                    onChange={(e) => setPermissions({...permissions, can_manage_bookings: e.target.checked})}
                  />
                  <span>Peut gérer les réservations</span>
                </label>
                <label className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={permissions.can_respond_messages}
                    onChange={(e) => setPermissions({...permissions, can_respond_messages: e.target.checked})}
                  />
                  <span>Peut répondre aux messages</span>
                </label>

                <button 
                  onClick={handleAddCohost}
                  disabled={createMutation.isPending}
                  className="btn btn-primary"
                >
                  {createMutation.isPending ? 'Ajout...' : 'Ajouter comme co-hôte'}
                </button>
              </div>
            )}
          </div>

          {/* Liste des co-hôtes existants */}
          <div className="cohosts-list-section">
            <h4>Co-hôtes actuels</h4>
            {isLoading ? (
              <div className="loading">Chargement...</div>
            ) : cohosts.length === 0 ? (
              <div className="empty-cohosts">
                Aucun co-hôte pour cette annonce
              </div>
            ) : (
              <div className="cohosts-list">
                {cohosts.map((cohost) => (
                  <div key={cohost.id} className="cohost-item">
                    <div className="cohost-info">
                      <strong>
                        {cohost.cohost?.first_name || 'Utilisateur'} {cohost.cohost?.last_name || ''}
                      </strong>
                      <span>{cohost.cohost?.email || `ID: ${cohost.cohost_id}`}</span>
                    </div>

                    <div className="cohost-permissions">
                      <label className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={cohost.can_edit_listing}
                          onChange={(e) => {
                            const updatedCohosts = cohosts.map(c => 
                              c.id === cohost.id 
                                ? {...c, can_edit_listing: e.target.checked}
                                : c
                            );
                            queryClient.setQueryData(['cohosts', listingId], updatedCohosts);
                            setEditingPermissionId(cohost.id);
                          }}
                        />
                        <span>Modifier l'annonce</span>
                      </label>
                      <label className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={cohost.can_manage_bookings}
                          onChange={(e) => {
                            const updatedCohosts = cohosts.map(c => 
                              c.id === cohost.id 
                                ? {...c, can_manage_bookings: e.target.checked}
                                : c
                            );
                            queryClient.setQueryData(['cohosts', listingId], updatedCohosts);
                            setEditingPermissionId(cohost.id);
                          }}
                        />
                        <span>Gérer les réservations</span>
                      </label>
                      <label className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={cohost.can_respond_messages}
                          onChange={(e) => {
                            const updatedCohosts = cohosts.map(c => 
                              c.id === cohost.id 
                                ? {...c, can_respond_messages: e.target.checked}
                                : c
                            );
                            queryClient.setQueryData(['cohosts', listingId], updatedCohosts);
                            setEditingPermissionId(cohost.id);
                          }}
                        />
                        <span>Répondre aux messages</span>
                      </label>
                    </div>

                    <div className="cohost-actions">
                      {editingPermissionId === cohost.id && (
                        <button
                          onClick={() => handleUpdatePermissions(cohost.id)}
                          disabled={updateMutation.isPending}
                          className="btn btn-small btn-primary"
                        >
                          Sauvegarder
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCohost(cohost.id)}
                        disabled={deleteMutation.isPending}
                        className="btn btn-small btn-danger"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCohosts;
