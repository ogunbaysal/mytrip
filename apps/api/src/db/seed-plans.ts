import { db } from "./index.ts";
import { subscriptionPlan } from "./schemas/subscriptions.ts";
import { nanoid } from "nanoid";

const plans = [
  {
    id: "plan-basic-monthly",
    name: "Başlangıç",
    description: "Küçük işletmeler için ideal",
    price: 500,
    currency: "TRY",
    billingCycle: "monthly" as const,
    features: [
      "3 Mekan",
      "5 Blog yazısı",
      "Temel istatistikler",
      "E-posta desteği",
    ],
    limits: {
      maxPlaces: 3,
      maxBlogs: 5,
      maxPhotos: 15,
      featuredListing: false,
      analyticsAccess: true,
      prioritySupport: false,
    },
    active: true,
    sortOrder: 0,
  },
  {
    id: "plan-standard-monthly",
    name: "Standart",
    description: "Büyüyen işletmeler için",
    price: 1000,
    currency: "TRY",
    billingCycle: "monthly" as const,
    features: [
      "10 Mekan",
      "20 Blog yazısı",
      "Öne çıkan listeleme",
      "Detaylı analitik",
      "Öncelikli destek",
    ],
    limits: {
      maxPlaces: 10,
      maxBlogs: 20,
      maxPhotos: 50,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    },
    active: true,
    sortOrder: 1,
  },
  {
    id: "plan-pro-monthly",
    name: "Profesyonel",
    description: "Büyük işletmeler ve zincirler için",
    price: 2500,
    currency: "TRY",
    billingCycle: "monthly" as const,
    features: [
      "Sınırsız mekan",
      "Sınırsız blog yazısı",
      "Sınırsız fotoğraf",
      "Premium analitik",
      "7/24 destek",
      "Özel markalama",
    ],
    limits: {
      maxPlaces: 9999,
      maxBlogs: 9999,
      maxPhotos: 9999,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    },
    active: true,
    sortOrder: 2,
  },
  {
    id: "plan-basic-quarterly",
    name: "Başlangıç",
    description: "Küçük işletmeler için ideal",
    price: 1500,
    currency: "TRY",
    billingCycle: "quarterly" as const,
    features: [
      "3 Mekan",
      "5 Blog yazısı",
      "Temel istatistikler",
      "E-posta desteği",
    ],
    limits: {
      maxPlaces: 3,
      maxBlogs: 5,
      maxPhotos: 15,
      featuredListing: false,
      analyticsAccess: true,
      prioritySupport: false,
    },
    active: true,
    sortOrder: 0,
  },
  {
    id: "plan-standard-quarterly",
    name: "Standart",
    description: "Büyüyen işletmeler için",
    price: 3000,
    currency: "TRY",
    billingCycle: "quarterly" as const,
    features: [
      "10 Mekan",
      "20 Blog yazısı",
      "Öne çıkan listeleme",
      "Detaylı analitik",
      "Öncelikli destek",
    ],
    limits: {
      maxPlaces: 10,
      maxBlogs: 20,
      maxPhotos: 50,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    },
    active: true,
    sortOrder: 1,
  },
  {
    id: "plan-pro-quarterly",
    name: "Profesyonel",
    description: "Büyük işletmeler ve zincirler için",
    price: 7500,
    currency: "TRY",
    billingCycle: "quarterly" as const,
    features: [
      "Sınırsız mekan",
      "Sınırsız blog yazısı",
      "Sınırsız fotoğraf",
      "Premium analitik",
      "7/24 destek",
      "Özel markalama",
    ],
    limits: {
      maxPlaces: 9999,
      maxBlogs: 9999,
      maxPhotos: 9999,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    },
    active: true,
    sortOrder: 2,
  },
  {
    id: "plan-basic-yearly",
    name: "Başlangıç",
    description: "Küçük işletmeler için ideal",
    price: 6000,
    currency: "TRY",
    billingCycle: "yearly" as const,
    features: [
      "3 Mekan",
      "5 Blog yazısı",
      "Temel istatistikler",
      "E-posta desteği",
      "2 ay ücretsiz",
    ],
    limits: {
      maxPlaces: 3,
      maxBlogs: 5,
      maxPhotos: 15,
      featuredListing: false,
      analyticsAccess: true,
      prioritySupport: false,
    },
    active: true,
    sortOrder: 0,
  },
  {
    id: "plan-standard-yearly",
    name: "Standart",
    description: "Büyüyen işletmeler için",
    price: 12000,
    currency: "TRY",
    billingCycle: "yearly" as const,
    features: [
      "10 Mekan",
      "20 Blog yazısı",
      "Öne çıkan listeleme",
      "Detaylı analitik",
      "Öncelikli destek",
      "2 ay ücretsiz",
    ],
    limits: {
      maxPlaces: 10,
      maxBlogs: 20,
      maxPhotos: 50,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    },
    active: true,
    sortOrder: 1,
  },
  {
    id: "plan-pro-yearly",
    name: "Profesyonel",
    description: "Büyük işletmeler ve zincirler için",
    price: 30000,
    currency: "TRY",
    billingCycle: "yearly" as const,
    features: [
      "Sınırsız mekan",
      "Sınırsız blog yazısı",
      "Sınırsız fotoğraf",
      "Premium analitik",
      "7/24 destek",
      "Özel markalama",
      "2 ay ücretsiz",
    ],
    limits: {
      maxPlaces: 9999,
      maxBlogs: 9999,
      maxPhotos: 9999,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    },
    active: true,
    sortOrder: 2,
  },
];

async function main() {
  console.log("Seeding subscription plans...");

  for (const plan of plans) {
    await db
      .insert(subscriptionPlan)
      .values({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price.toString(),
        currency: plan.currency as "TRY" | "USD" | "EUR",
        billingCycle: plan.billingCycle,
        features: JSON.stringify(plan.features),
        limits: JSON.stringify(plan.limits),
        active: plan.active,
        sortOrder: plan.sortOrder,
      })
      .onConflictDoNothing({ target: subscriptionPlan.id });
  }

  console.log("✅ Subscription plans seeded successfully!");
  console.log(`   - ${plans.length} plans created`);
  console.log(`   - 3 plans per billing cycle (monthly, quarterly, yearly)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
