import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, Booking } from '../services/booking.service';
import { format } from 'date-fns';
import './MyBookings.css';

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

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="my-bookings">
      <h1>Mes réservations</h1>
      {bookings && bookings.length > 0 ? (
        <div className="bookings-list">
          {bookings.map((booking: Booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-info">
                <h3>Réservation #{booking.id}</h3>
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
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancelMutation.isPending}
                >
                  Annuler
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Vous n'avez pas encore de réservations</p>
        </div>
      )}
    </div>
  );
};
