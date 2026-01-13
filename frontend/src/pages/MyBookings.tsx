import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, Booking } from '../services/booking.service';
import { format } from 'date-fns';
import './MyBookings.css';

interface BookingCardProps {
  booking: Booking;
  listingImage: string | null;
  onCancel: (id: number) => void;
  isCancelling: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, listingImage, onCancel, isCancelling }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="booking-card">
      {booking.listing_id && (
        <Link 
          to={`/listings/${booking.listing_id}`} 
          className="booking-listing-link"
        >
          <div className="booking-listing-image">
            {listingImage && !imageError ? (
              <img 
                src={listingImage} 
                alt={booking.listing_title || 'Annonce'}
                onError={() => {
                  console.error('Erreur chargement image pour booking', booking.id);
                  setImageError(true);
                }}
                onLoad={() => setImageError(false)}
              />
            ) : (
              <div className="booking-image-placeholder">
                <span>📷</span>
              </div>
            )}
          </div>
        </Link>
      )}
      <div className="booking-content">
        <div className="booking-info">
          {booking.listing_id && booking.listing_title && (
            <Link 
              to={`/listings/${booking.listing_id}`}
              className="booking-listing-title"
            >
              <h3>{booking.listing_title}</h3>
            </Link>
          )}
          {!booking.listing_title && (
            <h3>Réservation #{booking.id}</h3>
          )}
          {booking.listing_city && booking.listing_country && (
            <p className="booking-location">
              📍 {booking.listing_city}, {booking.listing_country}
            </p>
          )}
          <p>
            <strong>Dates:</strong>{' '}
            {format(new Date(booking.check_in), 'dd/MM/yyyy')} -{' '}
            {format(new Date(booking.check_out), 'dd/MM/yyyy')}
          </p>
          <p>
            <strong>Nombre de personnes:</strong> {booking.guests}
          </p>
          <p>
            <strong>Prix total:</strong> {booking.total_price}€
          </p>
          <p>
            <strong>Statut:</strong>{' '}
            <span className={`status status-${booking.status}`}>
              {booking.status === 'pending' && 'En attente'}
              {booking.status === 'confirmed' && 'Confirmée'}
              {booking.status === 'cancelled' && 'Annulée'}
              {booking.status === 'completed' && 'Terminée'}
            </span>
          </p>
        </div>
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <button
            className="btn btn-danger"
            onClick={() => onCancel(booking.id)}
            disabled={isCancelling}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};

export const MyBookings = () => {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingService.getMyBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: bookingService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      alert('Réservation annulée');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erreur lors de l\'annulation');
    },
  });

  const handleCancel = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      cancelMutation.mutate(id);
    }
  };

  const getListingImage = (booking: Booking): string | null => {
    if (!booking.listing_images) return null;
    
    // Si c'est une string, essayer de la parser
    if (typeof booking.listing_images === 'string') {
      try {
        const parsed = JSON.parse(booking.listing_images);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      } catch {
        return booking.listing_images;
      }
    }
    
    // Si c'est un tableau
    if (Array.isArray(booking.listing_images) && booking.listing_images.length > 0) {
      return booking.listing_images[0];
    }
    
    return null;
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="my-bookings">
      <h1>Mes réservations</h1>
      {bookings && bookings.length > 0 ? (
        <div className="bookings-list">
          {bookings.map((booking: Booking) => {
            const listingImage = getListingImage(booking);
            
            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                listingImage={listingImage}
                onCancel={handleCancel}
                isCancelling={cancelMutation.isPending}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>Vous n'avez pas encore de réservations</p>
        </div>
      )}
    </div>
  );
};
