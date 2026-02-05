import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import './Profile.css';

interface ProfileFormData {
  first_name: string;
  last_name: string;
}

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [showBecomeHostConfirm, setShowBecomeHostConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: async () => {
      await refreshUser();
      setMessage('Profil mis à jour avec succès');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (error: any) => {
      setMessage(error.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    },
  });

  const becomeHostMutation = useMutation({
    mutationFn: userService.becomeHost,
    onSuccess: async (data: any) => {
      if (data?.tokens) {
        localStorage.setItem('access_token', data.tokens.access_token);
        localStorage.setItem('refresh_token', data.tokens.refresh_token);
      }
      setShowBecomeHostConfirm(false);
      await refreshUser();
      setMessage('Vous êtes maintenant hôte !');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (error: any) => {
      setMessage(error.response?.data?.error?.message || 'Erreur');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const handleBecomeHost = () => {
    setShowBecomeHostConfirm(true);
  };

  const confirmBecomeHost = () => {
    becomeHostMutation.mutate();
  };

  if (!user) return <div>Chargement...</div>;

  return (
    <div className="profile-page">
      <h1>Mon profil</h1>
      {message && (
        <div className={`message ${message.includes('succès') || message.includes('hôte') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      <div className="profile-card">
        <div className="profile-info">
          <h2>Informations personnelles</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={user.email} disabled />
            </div>
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
            <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </form>
        </div>
        <div className="profile-actions">
          <h2>Statut</h2>
          <p>
            <strong>Rôle:</strong> {user.role === 'user' && 'Utilisateur'}
            {user.role === 'host' && 'Hôte'}
            {user.role === 'cohost' && 'Co-hôte'}
          </p>
          {!user.is_host && (
            <>
              {showBecomeHostConfirm ? (
                <div className="become-host-confirm">
                  <p>Voulez-vous devenir hôte ? Vous pourrez créer et gérer des annonces.</p>
                  <div className="confirm-buttons">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={confirmBecomeHost}
                      disabled={becomeHostMutation.isPending}
                    >
                      {becomeHostMutation.isPending ? 'Traitement...' : 'Oui, devenir hôte'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowBecomeHostConfirm(false)}
                      disabled={becomeHostMutation.isPending}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleBecomeHost}
                >
                  Devenir hôte
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
