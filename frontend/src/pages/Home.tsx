import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { listingService, Listing } from '../services/listing.service';
import './Home.css';

const ListingCardSkeleton = () => (
  <div className="listing-card skeleton">
    <div className="skeleton-image"></div>
    <div className="listing-info">
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-location"></div>
      <div className="skeleton-line skeleton-price"></div>
      <div className="skeleton-line skeleton-guests"></div>
    </div>
  </div>
);

export const Home = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['listings'],
    queryFn: () => listingService.getAll(),
    retry: 2,
    retryDelay: 1000,
  });

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Bienvenue sur MiniBnB</h1>
          <p className="hero-subtitle">Trouvez le logement parfait pour votre séjour</p>
        </div>
      </section>

      <section className="listings-section">
        <div className="section-header">
          <h2>Annonces disponibles</h2>
          {data && data.listings.length > 0 && (
            <p className="listings-count">{data.listings.length} {data.listings.length === 1 ? 'annonce' : 'annonces'}</p>
          )}
        </div>
        
        {isLoading && (
          <div className="listings-grid">
            {[...Array(6)].map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p className="error-message">Erreur lors du chargement des annonces</p>
            <p className="error-subtitle">
              {error instanceof Error ? error.message : 'Veuillez réessayer plus tard'}
            </p>
            {import.meta.env.DEV && error instanceof Error && (
              <details style={{ marginTop: '1rem', textAlign: 'left', maxWidth: '600px', margin: '1rem auto 0' }}>
                <summary style={{ cursor: 'pointer', color: '#666' }}>Détails de l'erreur</summary>
                <pre style={{ 
                  marginTop: '0.5rem', 
                  padding: '1rem', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  overflow: 'auto'
                }}>
                  {error.stack || JSON.stringify(error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
        {data && !isLoading && (
          <>
            {data.listings.length > 0 ? (
              <div className="listings-grid">
                {data.listings.map((listing: Listing, index: number) => (
                  <Link 
                    key={listing.id} 
                    to={`/listings/${listing.id}`} 
                    className="listing-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="listing-image-wrapper">
                      {listing.images && listing.images.length > 0 ? (
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="listing-image-placeholder">
                          <span>📷</span>
                        </div>
                      )}
                      <div className="listing-overlay"></div>
                    </div>
                    <div className="listing-info">
                      <h3 className="listing-title">{listing.title}</h3>
                      <p className="location">
                        <span className="location-icon">📍</span>
                        {listing.city}, {listing.country}
                      </p>
                      <div className="listing-footer">
                        <p className="price">
                          <span className="price-amount">{listing.price_per_night}€</span>
                          <span className="price-unit"> / nuit</span>
                        </p>
                        <p className="guests">
                          <span className="guests-icon">👥</span>
                          {listing.max_guests} {listing.max_guests === 1 ? 'personne' : 'personnes'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏠</div>
                <p className="empty-title">Aucune annonce disponible</p>
                <p className="empty-subtitle">Revenez bientôt pour découvrir de nouveaux logements</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
