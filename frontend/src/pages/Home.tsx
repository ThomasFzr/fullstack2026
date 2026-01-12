import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <h1>Bienvenue sur MiniBnB</h1>
        <p>Trouvez le logement parfait pour votre séjour</p>
        {!user && (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              Commencer
            </Link>
            <Link to="/listings" className="btn btn-secondary">
              Voir les annonces
            </Link>
          </div>
        )}
        {user && (
          <Link to="/listings" className="btn btn-primary">
            Explorer les annonces
          </Link>
        )}
      </section>
    </div>
  );
};
