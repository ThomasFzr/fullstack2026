import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/message.service';
import { bookingService } from '../services/booking.service';
import './Navbar.css';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: messageService.getUnreadCount,
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const { data: pendingBookingsCount } = useQuery({
    queryKey: ['pending-bookings-count'],
    queryFn: bookingService.getPendingBookingsCount,
    enabled: !!user && (user.is_host || user.role === 'cohost'),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Pour les co-hôtes, vérifier s'ils ont la permission can_manage_bookings
  const { data: hostBookings } = useQuery({
    queryKey: ['host-bookings-check'],
    queryFn: bookingService.getHostBookings,
    enabled: !!user && user.role === 'cohost' && !user.is_host,
    staleTime: 60000,
  });

  const cohostHasBookingPermission = user?.is_host || (user?.role === 'cohost' && hostBookings && hostBookings.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          MiniBnB
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              {(user.is_host || user.role === 'cohost') && (
                <>
                  <Link to="/my-listings">Mes annonces</Link>
                  {user.is_host && <Link to="/listings/create">Créer une annonce</Link>}
                  {cohostHasBookingPermission && (
                    <Link to="/host-bookings" className="messages-link">
                      <span className="messages-text">Réservations reçues</span>
                      {(pendingBookingsCount ?? 0) > 0 && (
                        <span className="notification-badge">{pendingBookingsCount}</span>
                      )}
                    </Link>
                  )}
                </>
              )}
              <Link to="/my-bookings">Mes réservations</Link>
              <Link to="/messages" className="messages-link">
                <span className="messages-text">Messages</span>
                {(unreadCount ?? 0) > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </Link>
              <Link to="/profile">Profil</Link>
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-login">Connexion</Link>
          )}
        </div>
      </div>
    </nav>
  );
};
