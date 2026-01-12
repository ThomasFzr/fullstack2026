import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'minibnb',
  user: process.env.DB_USER || 'thomasfoltzer',
  password: process.env.DB_PASSWORD || '',
});

interface AirbnbListing {
  id: number;
  name: string;
  picture_url: string;
  host_name: string;
  host_thumbnail_url: string;
  price: number;
  neighbourhood_group_cleansed: string;
  review_scores_value: number | null;
}

function parseAirbnbSQL(filePath: string): AirbnbListing[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const listings: AirbnbListing[] = [];
  
  // Extraire les INSERT statements
  const insertRegex = /INSERT INTO `listings`[^;]+;/g;
  const matches = content.match(insertRegex) || [];
  
  for (const match of matches) {
    // Extraire les valeurs entre parenthèses
    const valuesMatch = match.match(/VALUES\s*\(([^)]+)\)/);
    if (!valuesMatch) continue;
    
    const valuesStr = valuesMatch[1];
    // Parser les valeurs manuellement
    const values: string[] = [];
    let current = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i];
      
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        current += char;
        continue;
      }
      
      if (char === "'" && !escapeNext) {
        inString = !inString;
        current += char;
        continue;
      }
      
      if (char === ',' && !inString) {
        values.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    if (current.trim()) {
      values.push(current.trim());
    }
    
    // Nettoyer les valeurs
    const cleanValues = values.map(v => {
      v = v.trim();
      if (v.startsWith("'") && v.endsWith("'")) {
        return v.slice(1, -1).replace(/''/g, "'").replace(/\\'/g, "'");
      }
      if (v === 'NULL') return null;
      return v;
    });
    
    listings.push({
      id: parseInt(cleanValues[0] as string) || 0,
      name: (cleanValues[1] as string) || '',
      picture_url: (cleanValues[2] as string) || '',
      host_name: (cleanValues[3] as string) || '',
      host_thumbnail_url: (cleanValues[4] as string) || '',
      price: parseInt(cleanValues[5] as string) || 0,
      neighbourhood_group_cleansed: (cleanValues[6] as string) || '',
      review_scores_value: cleanValues[7] ? parseFloat(cleanValues[7] as string) : null,
    });
  }
  
  return listings;
}

async function importData() {
  try {
    console.log('📦 Début de l\'import des données Airbnb...');
    
    // Parser le fichier SQL
    const sqlFile = path.join(process.env.HOME || '', 'Downloads/airbnb.sql');
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ Fichier airbnb.sql non trouvé dans ~/Downloads/');
      console.error('   Chemin recherché:', sqlFile);
      process.exit(1);
    }
    
    const listings = parseAirbnbSQL(sqlFile);
    console.log(`✅ ${listings.length} annonces trouvées dans le fichier`);
    
    // Créer un map des hôtes uniques
    const hostsMap = new Map<string, { name: string; thumbnail: string }>();
    for (const listing of listings) {
      if (listing.host_name && !hostsMap.has(listing.host_name)) {
        hostsMap.set(listing.host_name, {
          name: listing.host_name,
          thumbnail: listing.host_thumbnail_url,
        });
      }
    }
    
    console.log(`📝 Création de ${hostsMap.size} utilisateurs hôtes...`);
    
    // Créer les utilisateurs hôtes
    const hostUsers = new Map<string, number>();
    let hostIdCounter = 1;
    
    for (const [hostName, hostData] of hostsMap) {
      // Générer un email unique
      const email = `host_${hostIdCounter}@airbnb.local`;
      const nameParts = hostName.split(' ');
      const firstName = nameParts[0] || hostName;
      const lastName = nameParts.slice(1).join(' ') || 'Host';
      
      // Hash de mot de passe par défaut
      const passwordHash = await bcrypt.hash('password123', 10);
      
      try {
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_host)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING id`,
          [email, passwordHash, firstName, lastName, 'host', true]
        );
        
        const userId = result.rows[0].id;
        hostUsers.set(hostName, userId);
        hostIdCounter++;
      } catch (err: any) {
        // Si l'utilisateur existe déjà, le récupérer
        const existing = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );
        if (existing.rows.length > 0) {
          hostUsers.set(hostName, existing.rows[0].id);
        } else {
          console.error(`Erreur pour ${hostName}:`, err.message);
        }
      }
    }
    
    console.log(`✅ ${hostUsers.size} hôtes créés/récupérés`);
    
    // Importer les annonces
    console.log('📝 Import des annonces...');
    let imported = 0;
    let skipped = 0;
    
    for (const listing of listings) {
      const hostId = hostUsers.get(listing.host_name);
      if (!hostId) {
        skipped++;
        continue;
      }
      
      // Extraire les informations du nom
      const nameParts = listing.name.split('·');
      const title = nameParts[0]?.trim() || listing.name;
      const city = listing.neighbourhood_group_cleansed || 'Bordeaux';
      const country = 'France';
      
      // Extraire bedrooms, beds, baths du nom
      let bedrooms = 1;
      let bathrooms = 1;
      let maxGuests = 2;
      
      const bedroomsMatch = listing.name.match(/(\d+)\s*bedroom/i);
      if (bedroomsMatch) bedrooms = parseInt(bedroomsMatch[1]);
      
      const bedsMatch = listing.name.match(/(\d+)\s*bed/i);
      if (bedsMatch) maxGuests = parseInt(bedsMatch[1]);
      
      const bathsMatch = listing.name.match(/(\d+(?:\.\d+)?)\s*bath/i);
      if (bathsMatch) bathrooms = parseFloat(bathsMatch[1]);
      
      // Description par défaut
      const description = `${title} situé à ${city}. ${listing.name}`;
      
      // Images
      const images = listing.picture_url ? [listing.picture_url] : [];
      
      // Prix par nuit
      const pricePerNight = listing.price || 50;
      
      try {
        await pool.query(
          `INSERT INTO listings (
            host_id, title, description, address, city, country,
            price_per_night, max_guests, bedrooms, bathrooms,
            images, amenities, rules
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT DO NOTHING`,
          [
            hostId,
            title.substring(0, 255),
            description.substring(0, 5000),
            `${city}, ${country}`,
            city,
            country,
            pricePerNight,
            maxGuests,
            bedrooms,
            bathrooms,
            JSON.stringify(images),
            JSON.stringify([]),
            '',
          ]
        );
        imported++;
        if (imported % 10 === 0) {
          process.stdout.write(`\r   ${imported}/${listings.length} annonces importées...`);
        }
      } catch (err: any) {
        console.error(`\nErreur pour l'annonce ${listing.id}:`, err.message);
        skipped++;
      }
    }
    
    console.log(`\n\n✅ Import terminé !`);
    console.log(`   - ${imported} annonces importées`);
    console.log(`   - ${skipped} annonces ignorées`);
    console.log(`   - ${hostUsers.size} hôtes créés`);
    
    await pool.end();
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'import:', error);
    await pool.end();
    process.exit(1);
  }
}

// Exécuter l'import
importData();
