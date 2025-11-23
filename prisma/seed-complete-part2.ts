import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { NOMS_IVOIRIENS, PRENOMS_IVOIRIENS, TYPES_COMMERCES, NOMS_COMMERCES } from './seed-complete';

const prisma = new PrismaClient();

async function createVendeurs(sectors: any[], admins: any[], territories: any[]) {
  console.log('\n👨‍💼 Création de 16 vendeurs REP...');
  const hashedPasswordRep = await bcrypt.hash('Vendeur@2024!', 10);
  const vendeurs = [];
  
  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    const adminIndex = Math.floor(i / 4); // 4 vendeurs par admin
    const admin = admins[adminIndex];
    
    const isHomme = Math.random() > 0.3; // 70% hommes, 30% femmes
    const prenom = isHomme 
      ? PRENOMS_IVOIRIENS.homme[i % PRENOMS_IVOIRIENS.homme.length]
      : PRENOMS_IVOIRIENS.femme[i % PRENOMS_IVOIRIENS.femme.length];
    const nom = NOMS_IVOIRIENS[i % NOMS_IVOIRIENS.length];
    
    const vendeur = await prisma.user.create({
      data: {
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@sfa-ci.com`,
        passwordHash: hashedPasswordRep,
        firstName: prenom,
        lastName: nom,
        role: 'REP',
        status: 'ACTIVE',
        phone: `+225 05 ${String(10 + i).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
        matricule: `REP-${String(i + 1).padStart(3, '0')}`,
        hireDate: new Date(2022, i % 12, Math.floor(Math.random() * 28) + 1),
        territoryId: territories[adminIndex].id,
        assignedSectorId: sector.id,
        managerId: admin.id,
        photoUrl: `https://randomuser.me/api/portraits/${isHomme ? 'men' : 'women'}/${20 + i}.jpg`,
        emailVerified: true,
        twoFactorEnabled: false
      }
    });
    vendeurs.push(vendeur);
    console.log(`✅ Vendeur créé: ${vendeur.email} - ${vendeur.firstName} ${vendeur.lastName} (Secteur: ${sector.name})`);
  }
  
  return vendeurs;
}

async function createOutlets(vendeurs: any[], sectors: any[], territories: any[], admins: any[]) {
  console.log('\n🏪 Création de 240 points de vente...');
  const outlets = [];
  let outletCounter = 1;
  
  for (let v = 0; v < vendeurs.length; v++) {
    const vendeur = vendeurs[v];
    const sector = sectors[v];
    const territory = territories[Math.floor(v / 4)];
    
    for (let p = 0; p < 15; p++) {
      const typeCommerce = TYPES_COMMERCES[Math.floor(Math.random() * TYPES_COMMERCES.length)];
      const nomCommerce = NOMS_COMMERCES[Math.floor(Math.random() * NOMS_COMMERCES.length)];
      const channel = typeCommerce.channels[Math.floor(Math.random() * typeCommerce.channels.length)];
      const segment = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
      
      const outlet = await prisma.outlet.create({
        data: {
          code: `PDV-${String(outletCounter).padStart(4, '0')}`,
          name: `${typeCommerce.prefix} ${nomCommerce}`,
          channel: channel,
          segment: segment,
          address: `${sector.quartiers[p % sector.quartiers.length] || 'Centre'}, ${sector.communes[0]}, ${sector.villes[0]}`,
          lat: Number(sector.lat) + (Math.random() - 0.5) * 0.02,
          lng: Number(sector.lng) + (Math.random() - 0.5) * 0.02,
          openHours: {
            lundi: { ouverture: '08:00', fermeture: '20:00' },
            mardi: { ouverture: '08:00', fermeture: '20:00' },
            mercredi: { ouverture: '08:00', fermeture: '20:00' },
            jeudi: { ouverture: '08:00', fermeture: '20:00' },
            vendredi: { ouverture: '08:00', fermeture: '22:00' },
            samedi: { ouverture: '09:00', fermeture: '22:00' },
            dimanche: { ouverture: '09:00', fermeture: '18:00' }
          },
          territoryId: territory.id,
          sectorId: sector.id,
          region: sector.regions[0],
          commune: sector.communes[0],
          ville: sector.villes[0],
          quartier: sector.quartiers[p % sector.quartiers.length] || null,
          codePostal: sector.codesPostaux[0],
          status: p < 12 ? 'APPROVED' : 'PENDING', // 80% approuvés
          proposedBy: vendeur.id,
          validatedBy: p < 12 ? admins[Math.floor(v / 4)].id : null,
          validatedAt: p < 12 ? new Date() : null,
          validationComment: p < 12 ? 'PDV validé après vérification terrain' : null
        }
      });
      outlets.push(outlet);
      outletCounter++;
    }
  }
  console.log(`✅ ${outlets.length} PDV créés`);
  return outlets;
}

// Images réalistes pour chaque type de produit
const PRODUCT_IMAGES: { [key: string]: { unit: string; pack: string } } = {
  // Bières
  'BOCK': {
    unit: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop', // Bouteille de bière
    pack: 'https://images.unsplash.com/photo-1567696911980-2c669aad3e50?w=400&h=400&fit=crop'  // Pack de bières
  },
  'CASTEL': {
    unit: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop', // Bouteille de bière brune
    pack: 'https://images.unsplash.com/photo-1505075106905-fb052892c116?w=400&h=400&fit=crop'  // Carton de bières
  },
  // Sodas
  'COCA': {
    unit: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop', // Canette Coca
    pack: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=400&h=400&fit=crop'  // Pack Coca
  },
  'PEPSI': {
    unit: 'https://images.unsplash.com/photo-1629203851288-7ececa5f05c4?w=400&h=400&fit=crop', // Canette Pepsi
    pack: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop'  // Pack Pepsi
  },
  // Jus
  'DAFANI': {
    unit: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop', // Bouteille de jus d'orange
    pack: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop'  // Pack de jus
  },
  // Biscuits
  'PARLE': {
    unit: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', // Paquet de biscuits
    pack: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop'  // Carton de biscuits
  },
  // Conserves
  'SANIA': {
    unit: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop', // Boîte de conserve
    pack: 'https://images.unsplash.com/photo-1612892483236-52d32a0e0ac1?w=400&h=400&fit=crop'  // Pack de conserves
  },
  // Savons/Détergents
  'OMO': {
    unit: 'https://images.unsplash.com/photo-1585221140117-bdea706fa2ce?w=400&h=400&fit=crop', // Paquet de lessive
    pack: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop'  // Carton de lessive
  }
};

async function createProductHierarchy() {
  console.log('\n📦 Création de la hiérarchie produits complète...');
  
  // Catégories
  const categories = await Promise.all([
    prisma.productCategory.create({
      data: {
        code: 'BOISSONS',
        name: 'Boissons',
        displayName: 'Boissons et Rafraîchissements',
        description: 'Toutes les boissons alcoolisées et non-alcoolisées',
        sortOrder: 1,
        active: true
      }
    }),
    prisma.productCategory.create({
      data: {
        code: 'ALIMENTAIRE',
        name: 'Alimentaire',
        displayName: 'Produits Alimentaires',
        description: 'Produits alimentaires et denrées',
        sortOrder: 2,
        active: true
      }
    }),
    prisma.productCategory.create({
      data: {
        code: 'HYGIENE',
        name: 'Hygiène',
        displayName: 'Hygiène et Beauté',
        description: 'Produits d\'hygiène et de beauté',
        sortOrder: 3,
        active: true
      }
    })
  ]);
  console.log(`✅ ${categories.length} catégories créées`);
  
  // Sous-catégories
  const subCategories = await Promise.all([
    // Boissons
    prisma.productSubCategory.create({
      data: {
        code: 'BIERES',
        name: 'Bières',
        displayName: 'Bières et Boissons Maltées',
        categoryId: categories[0].id,
        sortOrder: 1,
        active: true
      }
    }),
    prisma.productSubCategory.create({
      data: {
        code: 'SODAS',
        name: 'Sodas',
        displayName: 'Sodas et Boissons Gazeuses',
        categoryId: categories[0].id,
        sortOrder: 2,
        active: true
      }
    }),
    prisma.productSubCategory.create({
      data: {
        code: 'JUS',
        name: 'Jus',
        displayName: 'Jus de Fruits',
        categoryId: categories[0].id,
        sortOrder: 3,
        active: true
      }
    }),
    // Alimentaire
    prisma.productSubCategory.create({
      data: {
        code: 'BISCUITS',
        name: 'Biscuits',
        displayName: 'Biscuits et Gâteaux',
        categoryId: categories[1].id,
        sortOrder: 1,
        active: true
      }
    }),
    prisma.productSubCategory.create({
      data: {
        code: 'CONSERVES',
        name: 'Conserves',
        displayName: 'Conserves Alimentaires',
        categoryId: categories[1].id,
        sortOrder: 2,
        active: true
      }
    }),
    // Hygiène
    prisma.productSubCategory.create({
      data: {
        code: 'SAVONS',
        name: 'Savons',
        displayName: 'Savons et Détergents',
        categoryId: categories[2].id,
        sortOrder: 1,
        active: true
      }
    })
  ]);
  console.log(`✅ ${subCategories.length} sous-catégories créées`);
  
  // Marques
  const brands = await Promise.all([
    // Bières
    prisma.productBrand.create({
      data: {
        code: 'BOCK',
        name: 'Bock',
        displayName: 'Bière Bock',
        subCategoryId: subCategories[0].id,
        sortOrder: 1,
        active: true
      }
    }),
    prisma.productBrand.create({
      data: {
        code: 'CASTEL',
        name: 'Castel',
        displayName: 'Bière Castel',
        subCategoryId: subCategories[0].id,
        sortOrder: 2,
        active: true
      }
    }),
    // Sodas
    prisma.productBrand.create({
      data: {
        code: 'COCA',
        name: 'Coca-Cola',
        displayName: 'Coca-Cola Company',
        subCategoryId: subCategories[1].id,
        sortOrder: 1,
        active: true
      }
    }),
    prisma.productBrand.create({
      data: {
        code: 'PEPSI',
        name: 'Pepsi',
        displayName: 'PepsiCo',
        subCategoryId: subCategories[1].id,
        sortOrder: 2,
        active: true
      }
    }),
    // Jus
    prisma.productBrand.create({
      data: {
        code: 'DAFANI',
        name: 'Dafani',
        displayName: 'Jus Dafani',
        subCategoryId: subCategories[2].id,
        sortOrder: 1,
        active: true
      }
    }),
    // Biscuits
    prisma.productBrand.create({
      data: {
        code: 'PARLE',
        name: 'Parle',
        displayName: 'Parle Products',
        subCategoryId: subCategories[3].id,
        sortOrder: 1,
        active: true
      }
    }),
    // Conserves
    prisma.productBrand.create({
      data: {
        code: 'SANIA',
        name: 'Sania',
        displayName: 'Conserves Sania',
        subCategoryId: subCategories[4].id,
        sortOrder: 1,
        active: true
      }
    }),
    // Savons
    prisma.productBrand.create({
      data: {
        code: 'OMO',
        name: 'OMO',
        displayName: 'Détergent OMO',
        subCategoryId: subCategories[5].id,
        sortOrder: 1,
        active: true
      }
    })
  ]);
  console.log(`✅ ${brands.length} marques créées`);
  
  // Formats de pack et tailles
  const skus = [];
  for (const brand of brands) {
    // Créer 2 formats par marque
    const formats = await Promise.all([
      prisma.productPackFormat.create({
        data: {
          code: `${brand.code}_UNIT`,
          name: 'Unité',
          displayName: 'Format Unitaire',
          brandId: brand.id,
          sortOrder: 1,
          active: true
        }
      }),
      prisma.productPackFormat.create({
        data: {
          code: `${brand.code}_PACK`,
          name: 'Pack',
          displayName: 'Format Pack',
          brandId: brand.id,
          sortOrder: 2,
          active: true
        }
      })
    ]);
    
    // Créer 2 tailles par format
    for (const format of formats) {
      const sizes = await Promise.all([
        prisma.productPackSize.create({
          data: {
            code: `${format.code}_SMALL`,
            name: format.name === 'Unité' ? '33cl' : 'Pack x6',
            displayName: format.name === 'Unité' ? 'Petite taille 33cl' : 'Pack de 6',
            packFormatId: format.id,
            sortOrder: 1,
            active: true
          }
        }),
        prisma.productPackSize.create({
          data: {
            code: `${format.code}_LARGE`,
            name: format.name === 'Unité' ? '65cl' : 'Pack x12',
            displayName: format.name === 'Unité' ? 'Grande taille 65cl' : 'Pack de 12',
            packFormatId: format.id,
            sortOrder: 2,
            active: true
          }
        })
      ]);
      
      // Créer 1 SKU par taille
      for (const size of sizes) {
        const basePrice = Math.floor(Math.random() * 5000) + 500; // Entre 500 et 5500 FCFA
        const vatRate = 18.00; // TVA standard
        const priceTtc = basePrice * (1 + vatRate / 100);
        
        // Déterminer l'image appropriée selon le format (unité ou pack)
        const isUnitFormat = format.name === 'Unité';
        const imageUrl = PRODUCT_IMAGES[brand.code] 
          ? (isUnitFormat ? PRODUCT_IMAGES[brand.code].unit : PRODUCT_IMAGES[brand.code].pack)
          : `https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop`; // Image par défaut
        
        const sku = await prisma.sKU.create({
          data: {
            code: `SKU-${size.code}`,
            ean: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`, // EAN-13 aléatoire
            fullDescription: `${brand.displayName} - ${size.displayName}`,
            shortDescription: `${brand.name} ${size.name}`,
            packSizeId: size.id,
            barCode: `BC${Math.floor(Math.random() * 1000000)}`,
            baseUom: 'Piece',
            defaultUom: 'Piece',
            priceHt: basePrice,
            vatRate: vatRate,
            priceTtc: priceTtc,
            photo: imageUrl,
            weight: Math.random() * 2 + 0.5, // Entre 0.5 et 2.5 kg
            volume: Math.random() * 2 + 0.3, // Entre 0.3 et 2.3 L
            isSaleable: true,
            active: true
          }
        });
        skus.push(sku);
      }
    }
  }
  
  console.log(`✅ ${skus.length} SKUs créés avec hiérarchie complète`);
  return skus;
}

async function createRoutes(vendeurs: any[], outlets: any[]) {
  console.log('\n🚗 Création des routes pour chaque vendeur...');
  const routePlans = [];
  
  // Créer une route pour chaque vendeur
  for (let v = 0; v < vendeurs.length; v++) {
    const vendeur = vendeurs[v];
    const vendeurOutlets = outlets.slice(v * 15, (v + 1) * 15); // 15 PDV par vendeur
    
    // Créer 3 routes par vendeur (3 jours différents)
    for (let day = 0; day < 3; day++) {
      const routeDate = new Date();
      routeDate.setDate(routeDate.getDate() + day);
      
      const routePlan = await prisma.routePlan.create({
        data: {
          userId: vendeur.id,
          sectorId: vendeur.assignedSectorId,
          date: routeDate,
          status: day === 0 ? 'IN_PROGRESS' : 'PLANNED',
          isOffRoute: false,
          constraints: {
            maxDistance: 50, // km
            maxDuration: 480, // minutes (8 heures)
            maxOutlets: 5 // 5 PDV par jour
          }
        }
      });
      
      // Créer les stops pour cette route (5 PDV par jour)
      const startIndex = day * 5;
      const endIndex = Math.min(startIndex + 5, vendeurOutlets.length);
      
      for (let s = startIndex; s < endIndex; s++) {
        const outlet = vendeurOutlets[s];
        const eta = new Date(routeDate);
        eta.setHours(8 + Math.floor((s - startIndex) * 1.5)); // Espacement de 1h30 entre PDV
        
        await prisma.routeStop.create({
          data: {
            routePlanId: routePlan.id,
            outletId: outlet.id,
            seq: s - startIndex + 1,
            eta: eta,
            durationPlanned: 30, // 30 minutes par PDV
            status: day === 0 && s === startIndex ? 'VISITED' : 'PLANNED'
          }
        });
      }
      
      routePlans.push(routePlan);
    }
  }
  
  console.log(`✅ ${routePlans.length} routes créées avec stops`);
  return routePlans;
}

async function createVendorStock(vendeurs: any[], skus: any[]) {
  console.log('\n📦 Attribution du stock initial aux vendeurs...');
  
  for (const vendeur of vendeurs) {
    // Donner 10 SKUs aléatoires à chaque vendeur
    const selectedSkus = skus.sort(() => Math.random() - 0.5).slice(0, 10);
    
    for (const sku of selectedSkus) {
      const quantity = Math.floor(Math.random() * 50) + 10; // Entre 10 et 60 unités
      
      await prisma.vendorStock.create({
        data: {
          userId: vendeur.id,
          skuId: sku.id,
          quantity: quantity,
          alertThreshold: 10
        }
      });
      
      // Créer l'historique de stock initial
      await prisma.stockHistory.create({
        data: {
          userId: vendeur.id,
          skuId: sku.id,
          movementType: 'ADD',
          quantity: quantity,
          beforeQty: 0,
          afterQty: quantity,
          notes: 'Stock initial'
        }
      });
    }
  }
  
  console.log('✅ Stock initial attribué aux vendeurs');
}

export { createVendeurs, createOutlets, createProductHierarchy, createRoutes, createVendorStock };
