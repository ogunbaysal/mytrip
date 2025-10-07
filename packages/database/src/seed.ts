import { db } from './connection';
import { subscriptionPlans, users, places, blogs, collections } from './schema';
import { generateSlug } from './utils';

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Seed subscription plans
    console.log('📦 Seeding subscription plans...');
    await db.insert(subscriptionPlans).values([
      {
        name: 'Temel Plan',
        nameEn: 'Basic Plan',
        description: 'Küçük işletmeler için ideal başlangıç paketi',
        descriptionEn: 'Perfect starter package for small businesses',
        planType: 'basic',
        monthlyPrice: '99.00',
        yearlyPrice: '990.00',
        currency: 'TRY',
        features: JSON.stringify([
          { key: 'listings', value: '1', nameEn: '1 Listing', nameTr: '1 İlan' },
          { key: 'images', value: '10', nameEn: '10 Images', nameTr: '10 Resim' },
          { key: 'blogs', value: '2', nameEn: '2 Blog Posts/Month', nameTr: '2 Blog/Ay' }
        ]),
        maxListings: '1',
        maxImages: '10',
        maxBlogPosts: '2',
        sortOrder: '1',
      },
      {
        name: 'Premium Plan',
        nameEn: 'Premium Plan',
        description: 'Büyüyen işletmeler için gelişmiş özellikler',
        descriptionEn: 'Advanced features for growing businesses',
        planType: 'premium',
        monthlyPrice: '199.00',
        yearlyPrice: '1990.00',
        currency: 'TRY',
        features: JSON.stringify([
          { key: 'listings', value: '5', nameEn: '5 Listings', nameTr: '5 İlan' },
          { key: 'images', value: '50', nameEn: '50 Images', nameTr: '50 Resim' },
          { key: 'blogs', value: '10', nameEn: '10 Blog Posts/Month', nameTr: '10 Blog/Ay' },
          { key: 'priority', value: 'true', nameEn: 'Priority Support', nameTr: 'Öncelikli Destek' }
        ]),
        maxListings: '5',
        maxImages: '50',
        maxBlogPosts: '10',
        sortOrder: '2',
      },
      {
        name: 'Enterprise Plan',
        nameEn: 'Enterprise Plan',
        description: 'Büyük işletmeler için sınırsız imkanlar',
        descriptionEn: 'Unlimited possibilities for large enterprises',
        planType: 'enterprise',
        monthlyPrice: '499.00',
        yearlyPrice: '4990.00',
        currency: 'TRY',
        features: JSON.stringify([
          { key: 'listings', value: '-1', nameEn: 'Unlimited Listings', nameTr: 'Sınırsız İlan' },
          { key: 'images', value: '-1', nameEn: 'Unlimited Images', nameTr: 'Sınırsız Resim' },
          { key: 'blogs', value: '-1', nameEn: 'Unlimited Blog Posts', nameTr: 'Sınırsız Blog' },
          { key: 'analytics', value: 'true', nameEn: 'Advanced Analytics', nameTr: 'Gelişmiş Analitik' },
          { key: 'api', value: 'true', nameEn: 'API Access', nameTr: 'API Erişimi' }
        ]),
        maxListings: '-1',
        maxImages: '-1',
        maxBlogPosts: '-1',
        sortOrder: '3',
      }
    ]);

    // Create admin user
    console.log('👤 Seeding admin user...');
    await db.insert(users).values([
      {
        email: 'admin@mytrip.com',
        passwordHash: '$2b$10$example.hash.here', // This should be properly hashed
        firstName: 'Admin',
        lastName: 'User',
        userType: 'admin',
        status: 'active',
        languagePreference: 'tr',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }
    ]);

    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.main) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
