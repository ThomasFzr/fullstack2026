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

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="my-listings">
      <div className="page-header">
        <h1>Mes annonces</h1>
        <Link to="/listings/create" className="btn btn-primary">
          Créer une annonce
        </Link>
      </div>
      {listings && listings.length > 0 ? (
        <div className="listings-grid">
          {listings.map((listing: Listing) => (
            <div key={listing.id} className="listing-card">
              {listing.images && listing.images.length > 0 && (
                <img src={listing.images[0]} alt={listing.title} />
              )}
              <div className="listing-info">
                <h3>{listing.title}</h3>
                <p className="location">{listing.city}, {listing.country}</p>
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
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Vous n'avez pas encore créé d'annonce</p>
          <Link to="/listings/create" className="btn btn-primary">
            Créer votre première annonce
          </Link>
        </div>
      )}
    </div>
  );
};
