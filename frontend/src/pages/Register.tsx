import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import './Auth.css';

interface RegisterFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      await registerUser(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Inscription</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="first_name">Prénom</label>
            <input
              type="text"
              id="first_name"
              {...register('first_name', { required: 'Prénom requis' })}
            />
            {errors.first_name && <span className="error">{errors.first_name.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Nom</label>
            <input
              type="text"
              id="last_name"
              {...register('last_name', { required: 'Nom requis' })}
            />
            {errors.last_name && <span className="error">{errors.last_name.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              {...register('email', { required: 'Email requis' })}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              {...register('password', {
                required: 'Mot de passe requis',
                minLength: { value: 8, message: 'Minimum 8 caractères' },
              })}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>
          <button type="submit" className="btn btn-primary">
            S'inscrire
          </button>
        </form>
        <p className="auth-link">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};
