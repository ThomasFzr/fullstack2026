import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { listingService } from '../services/listing.service';
import './CreateListing.css';

interface ListingFormData {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string;
  rules: string;
}

export const CreateListing = () => {
  const navigate = useNavigate();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<ListingFormData>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imagePromises: Promise<string>[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject(new Error('Erreur lors de la lecture du fichier'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imagePromises.push(promise);
      }
    }

    Promise.all(imagePromises).then((base64Images) => {
      setSelectedImages((prev) => [...prev, ...base64Images]);
    }).catch((error) => {
      alert('Erreur lors du chargement des images: ' + error.message);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: (data: ListingFormData) => listingService.create({
      ...data,
      images: selectedImages,
      amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
    }),
    onSuccess: () => {
      alert('Annonce créée avec succès !');
      navigate('/my-listings');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erreur lors de la création');
    },
  });

  const onSubmit = (data: ListingFormData) => {
    if (selectedImages.length === 0) {
      alert('Veuillez sélectionner au moins une image');
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="create-listing">
      <h1>Créer une nouvelle annonce</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="listing-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Titre *</label>
            <input
              type="text"
              id="title"
              {...register('title', { required: 'Titre requis' })}
            />
            {errors.title && <span className="error">{errors.title.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            rows={5}
            {...register('description', { required: 'Description requise' })}
          />
          {errors.description && <span className="error">{errors.description.message}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="address">Adresse *</label>
            <input
              type="text"
              id="address"
              {...register('address', { required: 'Adresse requise' })}
            />
            {errors.address && <span className="error">{errors.address.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">Ville *</label>
            <input
              type="text"
              id="city"
              {...register('city', { required: 'Ville requise' })}
            />
            {errors.city && <span className="error">{errors.city.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="country">Pays *</label>
            <input
              type="text"
              id="country"
              {...register('country', { required: 'Pays requis' })}
            />
            {errors.country && <span className="error">{errors.country.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price_per_night">Prix par nuit (€) *</label>
            <input
              type="number"
              id="price_per_night"
              step="0.01"
              min="0"
              {...register('price_per_night', {
                required: 'Prix requis',
                min: { value: 0, message: 'Le prix doit être positif' },
              })}
            />
            {errors.price_per_night && <span className="error">{errors.price_per_night.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="max_guests">Nombre maximum de personnes *</label>
            <input
              type="number"
              id="max_guests"
              min="1"
              {...register('max_guests', {
                required: 'Nombre requis',
                min: { value: 1, message: 'Minimum 1 personne' },
              })}
            />
            {errors.max_guests && <span className="error">{errors.max_guests.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bedrooms">Nombre de chambres *</label>
            <input
              type="number"
              id="bedrooms"
              min="0"
              {...register('bedrooms', {
                required: 'Nombre requis',
                min: { value: 0, message: 'Minimum 0' },
              })}
            />
            {errors.bedrooms && <span className="error">{errors.bedrooms.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="bathrooms">Nombre de salles de bain *</label>
            <input
              type="number"
              id="bathrooms"
              step="0.5"
              min="0"
              {...register('bathrooms', {
                required: 'Nombre requis',
                min: { value: 0, message: 'Minimum 0' },
              })}
            />
            {errors.bathrooms && <span className="error">{errors.bathrooms.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="images">Images *</label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file-input"
          />
          <p className="file-input-hint">Sélectionnez une ou plusieurs images depuis votre ordinateur</p>
          
          {selectedImages.length > 0 && (
            <div className="image-preview-container">
              <h4>Images sélectionnées ({selectedImages.length})</h4>
              <div className="image-preview-grid">
                {selectedImages.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={image} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      aria-label="Supprimer l'image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="amenities">Équipements (séparés par des virgules)</label>
          <input
            type="text"
            id="amenities"
            placeholder="WiFi, Climatisation, Parking"
            {...register('amenities')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="rules">Règles</label>
          <textarea
            id="rules"
            rows={3}
            {...register('rules')}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Création...' : 'Créer l\'annonce'}
        </button>
      </form>
    </div>
  );
};
