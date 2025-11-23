import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Données géographiques de la Côte d'Ivoire
const REGIONS_CI = {
  ABIDJAN: {
    name: 'Abidjan',
    communes: ['Plateau', 'Cocody', 'Adjamé', 'Yopougon', 'Marcory', 'Treichville', 'Koumassi', 'Port-Bouët'],
    villes: ['Abidjan'],
    quartiers: {
      'Plateau': ['Plateau Centre', 'Plateau Dokui', 'Plateau Nord', 'Plateau Sud'],
      'Cocody': ['2 Plateaux', 'Riviera', 'Angré', 'Danga'],
      'Adjamé': ['Adjamé Centre', 'Adjamé Marché', 'Adjamé Nord', 'Adjamé Sud'],
      'Yopougon': ['Yopougon Centre', 'Niangon', 'Selmer', 'Wassakara']
    },
    codesPostaux: ['01', '08', '16', '23']
  },
  BOUAKE: {
    name: 'Bouaké',
    communes: ['Bouaké Centre', 'Bouaké Nord', 'Bouaké Sud'],
    villes: ['Bouaké'],
    quartiers: {
      'Bouaké Centre': ['Commerce', 'Belleville', 'Dar-es-Salam', 'Kennedy'],
      'Bouaké Nord': ['Ahougnansou', 'Koko', 'N\'Gattakro'],
      'Bouaké Sud': ['Air France', 'Broukro', 'Nimbo']
    },
    codesPostaux: ['31', '32', '33']
  },
  YAMOUSSOUKRO: {
    name: 'Yamoussoukro',
    communes: ['Yamoussoukro Centre', 'Attiégouakro', 'Kokrenou'],
    villes: ['Yamoussoukro'],
    quartiers: {
      'Yamoussoukro Centre': ['Habitat', 'Morofé', 'N\'Zuessy', 'Assabou'],
      'Attiégouakro': ['Attiégouakro Centre', 'Attiégouakro Nord'],
      'Kokrenou': ['Kokrenou Centre', 'Kokrenou Sud']
    },
    codesPostaux: ['41', '42']
  },
  SAN_PEDRO: {
    name: 'San-Pédro',
    communes: ['San-Pédro Centre', 'Bardot', 'Seweke'],
    villes: ['San-Pédro'],
    quartiers: {
      'San-Pédro Centre': ['Cité', 'Balmer', 'Lac', 'Zimbabwe'],
      'Bardot': ['Bardot 1', 'Bardot 2'],
      'Seweke': ['Seweke Nord', 'Seweke Sud']
    },
    codesPostaux: ['51', '52']
  }
};

// Noms et prénoms ivoiriens
const NOMS_IVOIRIENS = [
  'Kouassi', 'Konan', 'Kouamé', 'Koffi', 'Yao', 'N\'Guessan', 'Kouadio', 'Aka',
  'Diallo', 'Traoré', 'Coulibaly', 'Ouattara', 'Koné', 'Bakayoko', 'Doumbia', 'Cissé',
  'Bamba', 'Touré', 'Kamara', 'Sanogo', 'Fofana', 'Dembélé', 'Sylla', 'Keita'
];

const PRENOMS_IVOIRIENS = {
  homme: ['Kouassi', 'Yao', 'Konan', 'Koffi', 'Jean', 'Paul', 'Pierre', 'Marc', 'Luc', 'André', 'Michel', 'François', 'Serge', 'Alain', 'Claude', 'Bernard'],
  femme: ['Aya', 'Aminata', 'Fatoumata', 'Marie', 'Jeanne', 'Mariam', 'Aissata', 'Adjoua', 'Akissi', 'Affoué', 'Amoin', 'Amenan']
};

// Types de commerces
const TYPES_COMMERCES = [
  { prefix: 'Supermarché', channels: ['GT', 'MT'] },
  { prefix: 'Boutique', channels: ['PROXI'] },
  { prefix: 'Épicerie', channels: ['PROXI'] },
  { prefix: 'Mini Market', channels: ['GT'] },
  { prefix: 'Restaurant', channels: ['HORECA'] },
  { prefix: 'Bar', channels: ['HORECA'] },
  { prefix: 'Hôtel', channels: ['HORECA'] },
  { prefix: 'Grossiste', channels: ['DISTRIB'] },
  { prefix: 'Dépôt', channels: ['DISTRIB'] }
];

const NOMS_COMMERCES = [
  'Le Bon Prix', 'Chez Tantie', 'La Référence', 'Le Palmier', 'L\'Étoile', 'Le Baobab',
  'Les Délices', 'Le Coin Sympa', 'La Gazelle', 'Le Phoenix', 'L\'Oasis', 'Le Paradis',
  'La Perle', 'Le Diamant', 'L\'Excellence', 'Le Prestige', 'La Victoire', 'Le Succès'
];

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');
  
  // Supprimer dans l'ordre pour respecter les contraintes
  await prisma.routeStop.deleteMany({});
  await prisma.routePlan.deleteMany({});
  await prisma.merchPhoto.deleteMany({});
  await prisma.merchCheck.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderLine.deleteMany({});
  await prisma.stockHistory.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.vendorStock.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.promotionSKU.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.sKU.deleteMany({});
  await prisma.productPackSize.deleteMany({});
  await prisma.productPackFormat.deleteMany({});
  await prisma.productSubBrand.deleteMany({});
  await prisma.productBrand.deleteMany({});
  await prisma.productSubCategory.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.outlet.deleteMany({});
  await prisma.loginAttempt.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.territory.deleteMany({});
  
  console.log('✅ Base de données nettoyée');
}

async function createManager() {
  console.log('👔 Création du Manager (SUP)...');
  const hashedPasswordManager = await bcrypt.hash('Manager@2024!', 10);
  
  const manager = await prisma.user.create({
    data: {
      email: 'directeur.general@sfa-ci.com',
      passwordHash: hashedPasswordManager,
      firstName: 'Jean-Baptiste',
      lastName: 'Kouadio',
      role: 'SUP',
      status: 'ACTIVE',
      phone: '+225 07 12 34 56 78',
      matricule: 'DG-001',
      hireDate: new Date('2020-01-15'),
      photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      emailVerified: true,
      twoFactorEnabled: false,
      lastLogin: new Date()
    }
  });
  console.log(`✅ Manager créé: ${manager.email}`);
  return manager;
}

async function createTerritories(manager: any) {
  console.log('\n🗺️ Création de 4 territoires avec données complètes...');
  
  const territories = [];
  const territoryData = [
    {
      code: 'ZONE-ABIDJAN-NORD',
      name: 'Zone Abidjan Nord',
      region: REGIONS_CI.ABIDJAN,
      communes: ['Cocody', 'Adjamé'],
      lat: 5.3600,
      lng: -4.0083,
      population: 850000,
      superficie: 125.5,
      potentiel: 'TRES_FORT' as const,
      categorie: 'URBAIN' as const,
      type: 'MIXTE' as const,
      nombrePDV: 450
    },
    {
      code: 'ZONE-ABIDJAN-SUD',
      name: 'Zone Abidjan Sud',
      region: REGIONS_CI.ABIDJAN,
      communes: ['Plateau', 'Marcory', 'Treichville'],
      lat: 5.3097,
      lng: -4.0127,
      population: 620000,
      superficie: 95.3,
      potentiel: 'FORT' as const,
      categorie: 'URBAIN' as const,
      type: 'COMMERCIAL' as const,
      nombrePDV: 380
    },
    {
      code: 'ZONE-BOUAKE',
      name: 'Zone Bouaké Centre',
      region: REGIONS_CI.BOUAKE,
      communes: ['Bouaké Centre', 'Bouaké Nord'],
      lat: 7.6906,
      lng: -5.0305,
      population: 450000,
      superficie: 180.7,
      potentiel: 'MOYEN' as const,
      categorie: 'SEMI_URBAIN' as const,
      type: 'MIXTE' as const,
      nombrePDV: 250
    },
    {
      code: 'ZONE-YAMOUSSOUKRO',
      name: 'Zone Yamoussoukro',
      region: REGIONS_CI.YAMOUSSOUKRO,
      communes: ['Yamoussoukro Centre', 'Attiégouakro'],
      lat: 6.8276,
      lng: -5.2893,
      population: 280000,
      superficie: 210.5,
      potentiel: 'MOYEN' as const,
      categorie: 'SEMI_URBAIN' as const,
      type: 'RESIDENTIEL' as const,
      nombrePDV: 180
    }
  ];
  
  for (const data of territoryData) {
    const quartiers = [];
    for (const commune of data.communes) {
      if (data.region.quartiers[commune]) {
        quartiers.push(...data.region.quartiers[commune]);
      }
    }
    
    const territory = await prisma.territory.create({
      data: {
        code: data.code,
        name: data.name,
        level: 'ZONE',
        regions: [data.region.name],
        communes: data.communes,
        villes: data.region.villes,
        quartiers: quartiers,
        codesPostaux: data.region.codesPostaux,
        lat: data.lat,
        lng: data.lng,
        population: data.population,
        superficie: data.superficie,
        densitePopulation: Math.round(data.population / data.superficie),
        potentielCommercial: data.potentiel,
        categorieMarche: data.categorie,
        typeZone: data.type,
        nombrePDVEstime: data.nombrePDV,
        tauxPenetration: 15.5,
        isActive: true,
        createdBy: manager.id,
        notes: `Zone stratégique de ${data.name} - Potentiel ${data.potentiel.toLowerCase()}`
      }
    });
    territories.push(territory);
    console.log(`✅ Territoire créé: ${territory.name}`);
  }
  
  return territories;
}

async function createAdmins(territories: any[], manager: any) {
  console.log('\n👥 Création de 4 Admins...');
  const hashedPasswordAdmin = await bcrypt.hash('Admin@2024!', 10);
  const admins = [];
  
  for (let i = 0; i < 4; i++) {
    const nom = NOMS_IVOIRIENS[i * 2];
    const prenom = PRENOMS_IVOIRIENS.homme[i];
    
    const admin = await prisma.user.create({
      data: {
        email: `admin.${territories[i].code.toLowerCase()}@sfa-ci.com`,
        passwordHash: hashedPasswordAdmin,
        firstName: prenom,
        lastName: nom,
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: `+225 07 ${String(20 + i).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
        matricule: `ADM-${String(i + 1).padStart(3, '0')}`,
        hireDate: new Date(2021, i, 15),
        territoryId: territories[i].id,
        managerId: manager.id,
        photoUrl: `https://randomuser.me/api/portraits/men/${i + 10}.jpg`,
        emailVerified: true,
        twoFactorEnabled: false
      }
    });
    admins.push(admin);
    console.log(`✅ Admin créé: ${admin.email} - ${admin.firstName} ${admin.lastName}`);
    
    // Assigner l'admin au territoire
    await prisma.territory.update({
      where: { id: territories[i].id },
      data: { adminId: admin.id }
    });
  }
  
  return admins;
}

async function createSectors(territories: any[], admins: any[]) {
  console.log('\n🏘️ Création de 16 secteurs...');
  const sectors = [];
  
  for (let t = 0; t < territories.length; t++) {
    const territory = territories[t];
    const sectorsForTerritory = [];
    
    for (let s = 0; s < 4; s++) {
      const sectorCode = `${territory.code}-SEC-${String(s + 1).padStart(2, '0')}`;
      const sectorName = `Secteur ${['Nord', 'Sud', 'Est', 'Ouest'][s]} - ${territory.name}`;
      
      const sector = await prisma.territory.create({
        data: {
          code: sectorCode,
          name: sectorName,
          level: 'SECTEUR',
          parentId: territory.id,
          regions: territory.regions,
          communes: [territory.communes[s % territory.communes.length]],
          villes: territory.villes,
          quartiers: territory.quartiers.slice(s * 2, (s + 1) * 2),
          codesPostaux: [territory.codesPostaux[s % territory.codesPostaux.length]],
          lat: Number(territory.lat) + (Math.random() - 0.5) * 0.1,
          lng: Number(territory.lng) + (Math.random() - 0.5) * 0.1,
          population: Math.floor(territory.population / 4),
          superficie: territory.superficie / 4,
          densitePopulation: Math.round((territory.population / 4) / (territory.superficie / 4)),
          potentielCommercial: territory.potentielCommercial,
          categorieMarche: territory.categorieMarche,
          typeZone: territory.typeZone,
          nombrePDVEstime: Math.floor(territory.nombrePDVEstime / 4),
          tauxPenetration: 12.5,
          isActive: true,
          createdBy: admins[t].id,
          notes: `Secteur commercial ${s + 1} de ${territory.name}`
        }
      });
      sectorsForTerritory.push(sector);
      console.log(`✅ Secteur créé: ${sector.name}`);
    }
    sectors.push(...sectorsForTerritory);
  }
  
  return sectors;
}

export { cleanDatabase, createManager, createTerritories, createAdmins, createSectors, NOMS_IVOIRIENS, PRENOMS_IVOIRIENS, TYPES_COMMERCES, NOMS_COMMERCES };
