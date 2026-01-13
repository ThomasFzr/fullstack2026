import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingService, Listing } from '../services/listing.service';
import './MyListings.css';

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
          {listings.map((listing: Listing, index: number) => (
            <div 
              key={listing.id} 
              className="listing-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.title} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '240px',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '1.2rem'
                }}>
                  Aucune image
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
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(listing.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
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
