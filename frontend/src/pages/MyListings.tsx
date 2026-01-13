import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingService, Listing } from '../services/listing.service';
import './MyListings.css';

interface ListingCardProps {
  listing: Listing;
  firstImage: string | null;
  index: number;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, firstImage, index, onDelete, isDeleting }) => {
  const [imageError, setImageError] = useState(false);

  // Fonction robuste pour extraire la première image
  const getFirstImage = (): string | null => {
    if (!listing.images) return null;
    
    // Si c'est une string, essayer de parser
    if (typeof listing.images === 'string') {
      try {
        const parsed = JSON.parse(listing.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
        return null;
      } catch {
        // Si le parsing échoue, c'est peut-être une URL directe ou base64
        return listing.images.length > 0 ? listing.images : null;
      }
    }
    
    // Si c'est un array
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      return listing.images[0];
    }
    
    return null;
  };

  const image = firstImage || getFirstImage();

  return (
    <div 
      className="listing-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {image && !imageError ? (
        <img 
          src={image} 
          alt={listing.title}
          onError={() => {
            console.error('Erreur chargement image pour listing', listing.id);
            setImageError(true);
          }}
          onLoad={() => setImageError(false)}
        />
      ) : (
        <div className="listing-image-placeholder">
          <span>Aucune image</span>
        </div>
      )}
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
          <Link to={`/listings/${listing.id}/edit`} className="btn btn-edit">
            Éditer
          </Link>
          <button
            className="btn btn-danger"
            onClick={() => onDelete(listing.id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MyListings = () => {
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: listingService.getMyListings,
  });

  const deleteMutation = useMutation({
    mutationFn: listingService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      alert('Annonce supprimée avec succès');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erreur lors de la suppression');
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      deleteMutation.mutate(id);
    }
  };

  // Fonction robuste pour extraire la première image
  const getFirstImage = (listing: Listing): string | null => {
    if (!listing.images) return null;
    
    // Si c'est une string, essayer de parser
    if (typeof listing.images === 'string') {
      try {
        const parsed = JSON.parse(listing.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
        return null;
      } catch {
        // Si le parsing échoue, c'est peut-être une URL directe ou base64
        return listing.images.length > 0 ? listing.images : null;
      }
    }
    
    // Si c'est un array
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      return listing.images[0];
    }
    
    return null;
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
        <Link to="/listings/create" className="btn btn-primary">
          + Créer
        </Link>
      </div>
      {listings && listings.length > 0 ? (
        <div className="listings-grid">
          {listings.map((listing: Listing, index: number) => {
            const firstImage = getFirstImage(listing);
            
            return (
              <ListingCard 
                key={listing.id}
                listing={listing}
                firstImage={firstImage}
                index={index}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <h2>Commencez votre aventure</h2>
          <p>Vous n'avez pas encore créé d'annonce.<br />Créez votre première annonce et commencez à accueillir des voyageurs !</p>
          <Link to="/listings/create" className="btn btn-primary">
            <span>+</span>
            <span>Créer votre première annonce</span>
          </Link>
        </div>
      )}
    </div>
  );
};
