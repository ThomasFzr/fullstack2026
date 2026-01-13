import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { bookingService, Booking } from '../services/booking.service';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import './HostBookings.css';

export const HostBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!user || !user.is_host) {
    return <Navigate to="/" replace />;
  }

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['host-bookings'],
    queryFn: bookingService.getHostBookings,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Booking['status'] }) =>
      bookingService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-bookings'] });
      alert('Statut mis à jour avec succès');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleStatusChange = (id: number, status: Booking['status']) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getListingImage = (booking: Booking): string | null => {
    if (!booking.listing_images) return null;
    
    if (typeof booking.listing_images === 'string') {
      try {
        const parsed = JSON.parse(booking.listing_images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
        // Si ce n'est pas un array après parsing, retourner null
        return null;
      } catch {
        // Si le parsing échoue, c'est peut-être une URL directe ou base64
        return booking.listing_images.length > 0 ? booking.listing_images : null;
      }
    }
    
    if (Array.isArray(booking.listing_images) && booking.listing_images.length > 0) {
      return booking.listing_images[0];
    }
    
    return null;
  };

  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleImageError = (bookingId: number) => {
    setImageErrors(prev => ({ ...prev, [bookingId]: true }));
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="host-bookings">
      <h1>Réservations reçues</h1>
      {bookings && bookings.length > 0 ? (
        <div className="bookings-list">
          {bookings.map((booking: Booking) => {
            const listingImage = getListingImage(booking);
            const imageError = imageErrors[booking.id] || false;
            
            return (
              <div key={booking.id} className="booking-card">
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
                          onError={() => handleImageError(booking.id)}
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
                    {booking.listing_city && booking.listing_country && (
                      <p className="booking-location">
                        📍 {booking.listing_city}, {booking.listing_country}
                      </p>
                    )}
                    {booking.guest_name && (
                      <p className="booking-guest">
                        <strong>Client:</strong> {booking.guest_name}
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
                    <div className="booking-status-section">
                      <strong>Statut:</strong>{' '}
                      <span className={`status status-${booking.status}`}>
                        {booking.status === 'pending' && 'En attente'}
                        {booking.status === 'confirmed' && 'Confirmée'}
                        {booking.status === 'cancelled' && 'Annulée'}
                        {booking.status === 'completed' && 'Terminée'}
                      </span>
                    </div>
                    {booking.status === 'pending' && (
                      <div className="booking-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Confirmer
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p className="empty-title">Aucune réservation reçue</p>
          <p className="empty-subtitle">Les réservations de vos annonces apparaîtront ici</p>
        </div>
      )}
    </div>
  );
};
