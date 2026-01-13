import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
              {user.is_host && (
                <>
                  <Link to="/my-listings">Mes annonces</Link>
                  <Link to="/listings/create">Créer une annonce</Link>
                </>
              )}
              <Link to="/my-bookings">Mes réservations</Link>
              <Link to="/messages">Messages</Link>
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
