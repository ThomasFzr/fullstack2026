import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingService, Listing } from '../services/listing.service';
import './Listings.css';

export const Listings = () => {
  const [filters, setFilters] = useState({
    city: '',
    country: '',
    minPrice: '',
    maxPrice: '',
    maxGuests: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingService.getAll({
      ...(filters.city && { city: filters.city }),
      ...(filters.country && { country: filters.country }),
      ...(filters.minPrice && { minPrice: parseFloat(filters.minPrice) }),
      ...(filters.maxPrice && { maxPrice: parseFloat(filters.maxPrice) }),
      ...(filters.maxGuests && { maxGuests: parseInt(filters.maxGuests) }),
    }),
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur lors du chargement des annonces</div>;

  return (
    <div className="listings-page">
      <h1>Annonces disponibles</h1>
      <div className="filters">
        <input
          type="text"
          name="city"
          placeholder="Ville"
          value={filters.city}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="country"
          placeholder="Pays"
          value={filters.country}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="minPrice"
          placeholder="Prix min"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Prix max"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="maxGuests"
          placeholder="Nombre de personnes"
          value={filters.maxGuests}
          onChange={handleFilterChange}
        />
      </div>
      <div className="listings-grid">
        {data?.listings.map((listing: Listing) => (
          <Link key={listing.id} to={`/listings/${listing.id}`} className="listing-card">
            {listing.images && listing.images.length > 0 && (
              <img src={listing.images[0]} alt={listing.title} />
            )}
            <div className="listing-info">
              <h3>{listing.title}</h3>
              <p className="location">{listing.city}, {listing.country}</p>
              <p className="price">{listing.price_per_night}€ / nuit</p>
              <p className="guests">Jusqu'à {listing.max_guests} personnes</p>
            </div>
          </Link>
        ))}
      </div>
      {data?.listings.length === 0 && (
        <p className="no-results">Aucune annonce trouvée</p>
      )}
    </div>
  );
};
