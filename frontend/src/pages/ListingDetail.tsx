import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { listingService } from '../services/listing.service';
import { bookingService } from '../services/booking.service';
import { messageService } from '../services/message.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import './ListingDetail.css';

export const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingService.getById(Number(id)),
    enabled: !!id,
  });

  const bookingMutation = useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      toast.success('Réservation créée avec succès !');
      navigate('/my-bookings');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de la réservation');
    },
  });

  const conversationMutation = useMutation({
    mutationFn: messageService.createConversation,
    onSuccess: (conversation) => {
      navigate(`/messages?conversation=${conversation.id}`);
    },
  });

  const handleBooking = () => {
    if (!checkIn || !checkOut) {
      toast.warning('Veuillez sélectionner les dates');
      return;
    }
    bookingMutation.mutate({
      listing_id: Number(id),
      check_in: checkIn,
      check_out: checkOut,
      guests,
    });
  };

  const handleContact = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    conversationMutation.mutate(Number(id));
  };

  if (isLoading) return <div>Chargement...</div>;
  if (!listing) return <div>Annonce non trouvée</div>;

  const isOwner = user?.id === listing.host_id;

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = nights * listing.price_per_night;

  return (
    <div className="listing-detail">
      <div className="listing-images">
        {listing.images && listing.images.length > 0 ? (
          listing.images.map((img, idx) => (
            <img key={idx} src={img} alt={`${listing.title} ${idx + 1}`} />
          ))
        ) : (
          <div className="no-image">Aucune image</div>
        )}
      </div>
      <div className="listing-content">
        <h1>{listing.title}</h1>
        <p className="location">{listing.address}, {listing.city}, {listing.country}</p>
        <div className="listing-details">
          <span>{listing.bedrooms} chambres</span>
          <span>{listing.bathrooms} salles de bain</span>
          <span>Jusqu'à {listing.max_guests} personnes</span>
        </div>
        <div className="description">
          <h2>Description</h2>
          <p>{listing.description}</p>
        </div>
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="amenities">
            <h2>Équipements</h2>
            <ul>
              {listing.amenities.map((amenity, idx) => (
                <li key={idx}>{amenity}</li>
              ))}
            </ul>
          </div>
        )}
        {listing.rules && (
          <div className="rules">
            <h2>Règles</h2>
            <p>{listing.rules}</p>
          </div>
        )}
      </div>
      <div className="booking-sidebar">
        <div className="price-box">
          <div className="price">{listing.price_per_night}€ <span>/ nuit</span></div>
          {user && !isOwner && (
            <>
              {!showBookingForm ? (
                <button className="btn btn-primary" onClick={() => setShowBookingForm(true)}>
                  Réserver
                </button>
              ) : (
                <div className="booking-form">
                  <div className="form-group">
                    <label>Date d'arrivée</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date de départ</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre de personnes</label>
                    <input
                      type="number"
                      min="1"
                      max={listing.max_guests}
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                    />
                  </div>
                  {nights > 0 && (
                    <div className="price-breakdown">
                      <div className="price-line">
                        <span>{listing.price_per_night}€ x {nights} nuit{nights > 1 ? 's' : ''}</span>
                        <span>{totalPrice}€</span>
                      </div>
                      <div className="price-total">
                        <span>Total</span>
                        <span>{totalPrice}€</span>
                      </div>
                    </div>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={handleBooking}
                    disabled={bookingMutation.isPending}
                  >
                    {bookingMutation.isPending ? 'Réservation...' : 'Confirmer la réservation'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowBookingForm(false)}
                  >
                    Annuler
                  </button>
                </div>
              )}
              <button className="btn btn-outline" onClick={handleContact}>
                Contacter l'hôte
              </button>
            </>
          )}
          {user && isOwner && (
            <div className="info-message">
              Vous êtes le propriétaire de cette annonce
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
