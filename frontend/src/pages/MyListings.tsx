import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingService, Listing } from '../services/listing.service';
import ManageCohosts from '../components/ManageCohosts';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './MyListings.css';

interface ListingCardProps {
  listing: Listing;
  index: number;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  onManageCohosts: (listingId: number, title: string) => void;
  isHost: boolean;
  canEdit: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, index, onDelete, isDeleting, onManageCohosts, isHost, canEdit }) => {

  return (
    <div 
      className="listing-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="listing-info">
        <h3>{listing.title}</h3>
        <p className="location">
          <span>📍</span>
          <span>{listing.city}, {listing.country}</span>
        </p>
        <p className="price">{listing.price_per_night}€ / nuit</p>
        <div className="listing-actions">
          <Link to={`/listings/${listing.id}`} className="btn btn-outline">
            Voir
          </Link>
          {canEdit && (
            <Link to={`/listings/${listing.id}/edit`} className="btn btn-edit">
              Éditer
            </Link>
          )}
          {isHost && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => onManageCohosts(listing.id, listing.title)}
              >
                Co-hôtes
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(listing.id)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const MyListings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const [cohostModalOpen, setCohostModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<{ id: number; title: string } | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: listingService.getMyListings,
  });

  const deleteMutation = useMutation({
    mutationFn: listingService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast.success('Annonce supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleManageCohosts = (listingId: number, title: string) => {
    setSelectedListing({ id: listingId, title });
    setCohostModalOpen(true);
  };

  const handleCloseCohostModal = () => {
    setCohostModalOpen(false);
    setSelectedListing(null);
  };

  if (isLoading) {
    return (
      <div className="my-listings">
        <div className="loading-state">Chargement de vos annonces...</div>
      </div>
    );
  }

  return (
    <div className="my-listings">
      <div className="page-header">
        <h1>Mes annonces</h1>
        {user?.is_host && (
          <Link to="/listings/create" className="btn btn-primary">
            + Créer
          </Link>
        )}
      </div>
      {listings && listings.length > 0 ? (
        <div className="listings-grid">
          {listings.map((listing: Listing, index: number) => {
            const isHost = user?.id === listing.host_id;
            const canEdit = isHost || listing.cohost_permissions?.can_edit_listing || false;
            
            return (
              <ListingCard 
                key={listing.id}
                listing={listing}
                index={index}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
                onManageCohosts={handleManageCohosts}
                isHost={isHost}
                canEdit={canEdit}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <h2>{user?.is_host ? 'Commencez votre aventure' : 'Aucune annonce'}</h2>
          <p>
            {user?.is_host 
              ? "Vous n'avez pas encore créé d'annonce. Créez votre première annonce et commencez à accueillir des voyageurs !"
              : "Vous n'êtes co-hôte d'aucune annonce pour le moment."
            }
          </p>
          {user?.is_host && (
            <Link to="/listings/create" className="btn btn-primary">
              <span>+</span>
              <span>Créer votre première annonce</span>
            </Link>
          )}
        </div>
      )}

      {cohostModalOpen && selectedListing && (
        <ManageCohosts
          listingId={selectedListing.id}
          listingTitle={selectedListing.title}
          onClose={handleCloseCohostModal}
        />
      )}
    </div>
  );
};
