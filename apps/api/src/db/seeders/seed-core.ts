/**
 * Core Data Seeder
 *
 * Seeds essential system data that is required for the application to function:
 * - Admin user with roles and permissions
 * - Subscription plans + entitlement limits
 * - Place kinds metadata
 * - Turkey provinces and districts
 *
 * This seeder should be run on fresh database setup and is idempotent.
 *
 * Usage: bun run db:seed:core
 */

import { db } from "../index.ts";
import { nanoid } from "nanoid";
import { and, eq, ne, notInArray } from "drizzle-orm";

// Schemas
import {
  admin,
  adminRoles,
  adminPermissions,
  adminRolePermissions,
} from "../schemas/auth.ts";
import {
  coupon,
  couponPlan,
  subscriptionPlan,
  subscriptionPlanEntitlement,
  subscriptionPlanFeature,
} from "../schemas/subscriptions.ts";
import { placeKind } from "../schemas/categories.ts";
import { blogCategory } from "../schemas/blog.ts";
import { province, district } from "../schemas/locations.ts";

// Turkey data
import { getCities, getDistrictsByCityCode } from "turkey-neighbourhoods";

// Auth helper for admin creation
import { auth } from "../../lib/auth.ts";

// ============================================================================
// HELPER UTILITIES
// ============================================================================

const slugify = (text: string): string => {
  const turkishMap: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };
  return text
    .split("")
    .map((char) => turkishMap[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const logSection = (title: string): void => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
};

const logSuccess = (message: string): void => {
  console.log(`  ✅ ${message}`);
};

const logInfo = (message: string): void => {
  console.log(`  ℹ️  ${message}`);
};

const logSkip = (message: string): void => {
  console.log(`  ⏭️  ${message}`);
};

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

const ADMIN_CONFIG = {
  email: "admin@tatildesen.com",
  password: "demo1234",
  name: "Tatildesen Admin",
};

const PERMISSIONS = [
  { slug: "manage:all", description: "Full access to everything" },
  { slug: "create:admin", description: "Can create other admins" },
  { slug: "read:admin", description: "Can view admins" },
  { slug: "update:admin", description: "Can update admin details" },
  { slug: "delete:admin", description: "Can delete admins" },
  { slug: "manage:users", description: "Can manage user accounts" },
  { slug: "manage:places", description: "Can manage all places" },
  { slug: "manage:blogs", description: "Can manage all blog posts" },
  { slug: "manage:subscriptions", description: "Can manage subscriptions" },
  { slug: "manage:settings", description: "Can manage system settings" },
  { slug: "view:analytics", description: "Can view analytics and reports" },
] as const;

const ROLES = [
  {
    name: "Super Admin",
    description: "Full system access",
    permissions: ["manage:all"], // Super admin gets all via manage:all
  },
  {
    name: "Admin",
    description: "Standard admin access",
    permissions: [
      "manage:users",
      "manage:places",
      "manage:blogs",
      "view:analytics",
    ],
  },
  {
    name: "Moderator",
    description: "Content moderation access",
    permissions: ["manage:places", "manage:blogs", "view:analytics"],
  },
] as const;

type PlanEntitlementSeed = {
  resourceKey:
    | "place.hotel"
    | "place.villa"
    | "place.restaurant"
    | "place.cafe"
    | "place.bar_club"
    | "place.beach"
    | "place.natural_location"
    | "place.activity_location"
    | "place.visit_location"
    | "place.other_monetized"
    | "blog.post";
  limitCount: number | null;
  isUnlimited?: boolean;
};

const SUBSCRIPTION_PLANS = [
  {
    id: "plan-starter-yearly",
    name: "Başlangıç Planı",
    description: "Yeni başlayan işletmeler için yıllık temel paket",
    price: 4990,
    currency: "TRY" as const,
    billingCycle: "yearly" as const,
    maxPlaces: 1,
    maxBlogs: 1,
    entitlements: [
      { resourceKey: "place.hotel", limitCount: 1 },
      { resourceKey: "place.villa", limitCount: 1 },
      { resourceKey: "place.restaurant", limitCount: 1 },
      { resourceKey: "place.cafe", limitCount: 1 },
      { resourceKey: "place.bar_club", limitCount: 1 },
      { resourceKey: "place.beach", limitCount: 1 },
      { resourceKey: "place.natural_location", limitCount: 1 },
      { resourceKey: "place.activity_location", limitCount: 1 },
      { resourceKey: "place.other_monetized", limitCount: 1 },
      { resourceKey: "place.visit_location", limitCount: null, isUnlimited: true },
      { resourceKey: "blog.post", limitCount: 1 },
    ] as PlanEntitlementSeed[],
    features: [
      "Monetize edilen her mekan türü için 1 ilan hakkı",
      "Ziyaret lokasyonlarında sınırsız ilan",
      "1 blog yazısı hakkı",
      "Temel görünürlük",
      "E-posta desteği",
    ],
    sortOrder: 0,
  },
  {
    id: "plan-standard-yearly",
    name: "Standart Plan",
    description: "Büyümek isteyen işletmeler için yıllık plan",
    price: 11990,
    currency: "TRY" as const,
    billingCycle: "yearly" as const,
    maxPlaces: 5,
    maxBlogs: 10,
    entitlements: [
      { resourceKey: "place.hotel", limitCount: 5 },
      { resourceKey: "place.villa", limitCount: 5 },
      { resourceKey: "place.restaurant", limitCount: 5 },
      { resourceKey: "place.cafe", limitCount: 5 },
      { resourceKey: "place.bar_club", limitCount: 5 },
      { resourceKey: "place.beach", limitCount: 5 },
      { resourceKey: "place.natural_location", limitCount: 5 },
      { resourceKey: "place.activity_location", limitCount: 5 },
      { resourceKey: "place.other_monetized", limitCount: 5 },
      { resourceKey: "place.visit_location", limitCount: null, isUnlimited: true },
      { resourceKey: "blog.post", limitCount: 10 },
    ] as PlanEntitlementSeed[],
    features: [
      "Monetize edilen her mekan türü için 5 ilan hakkı",
      "Ziyaret lokasyonlarında sınırsız ilan",
      "10 blog yazısı hakkı",
      "Öne çıkan listeleme desteği",
      "Gelişmiş raporlama",
      "Öncelikli destek",
    ],
    sortOrder: 1,
  },
  {
    id: "plan-growth-yearly",
    name: "Büyüme Planı",
    description: "Birden fazla lokasyon yöneten işletmeler için yıllık plan",
    price: 24990,
    currency: "TRY" as const,
    billingCycle: "yearly" as const,
    maxPlaces: 20,
    maxBlogs: 40,
    entitlements: [
      { resourceKey: "place.hotel", limitCount: 20 },
      { resourceKey: "place.villa", limitCount: 20 },
      { resourceKey: "place.restaurant", limitCount: 20 },
      { resourceKey: "place.cafe", limitCount: 20 },
      { resourceKey: "place.bar_club", limitCount: 20 },
      { resourceKey: "place.beach", limitCount: 20 },
      { resourceKey: "place.natural_location", limitCount: 20 },
      { resourceKey: "place.activity_location", limitCount: 20 },
      { resourceKey: "place.other_monetized", limitCount: 20 },
      { resourceKey: "place.visit_location", limitCount: null, isUnlimited: true },
      { resourceKey: "blog.post", limitCount: 40 },
    ] as PlanEntitlementSeed[],
    features: [
      "Monetize edilen her mekan türü için 20 ilan hakkı",
      "Ziyaret lokasyonlarında sınırsız ilan",
      "40 blog yazısı hakkı",
      "Premium görünürlük",
      "Detaylı performans paneli",
      "Öncelikli operasyon desteği",
    ],
    sortOrder: 2,
  },
] as const;

type CouponSeed = {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  scope: "all_plans" | "specific_plans";
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number;
  active: boolean;
  planIds: string[];
};

const COUPONS: CouponSeed[] = [
  {
    id: "coupon-welcome-10",
    code: "WELCOME10",
    description: "İlk abonelikte %10 indirim",
    discountType: "percent" as const,
    discountValue: 10,
    scope: "all_plans" as const,
    maxRedemptions: 10000,
    maxRedemptionsPerUser: 1,
    active: true,
    planIds: [],
  },
  {
    id: "coupon-free-100",
    code: "FREE100",
    description: "Tam indirim kuponu (%100)",
    discountType: "percent" as const,
    discountValue: 100,
    scope: "all_plans" as const,
    maxRedemptions: 1000,
    maxRedemptionsPerUser: 1,
    active: true,
    planIds: [],
  },
];

const PLACE_KINDS = [
  {
    id: "hotel",
    name: "Otel",
    slug: "hotel",
    icon: "hotel",
    description: "Oda bazlı konaklama işletmeleri",
    monetized: true,
    supportsRooms: true,
    supportsMenu: false,
    supportsPackages: false,
    sortOrder: 0,
  },
  {
    id: "villa",
    name: "Villa",
    slug: "villa",
    icon: "home",
    description: "Müstakil konaklama birimleri",
    monetized: true,
    supportsRooms: false,
    supportsMenu: false,
    supportsPackages: false,
    sortOrder: 1,
  },
  {
    id: "restaurant",
    name: "Restoran",
    slug: "restaurant",
    icon: "restaurant",
    description: "Yeme-içme işletmeleri",
    monetized: true,
    supportsRooms: false,
    supportsMenu: true,
    supportsPackages: false,
    sortOrder: 2,
  },
  {
    id: "cafe",
    name: "Kafe",
    slug: "cafe",
    icon: "local_cafe",
    description: "Kafe ve kahve dükkanları",
    monetized: true,
    supportsRooms: false,
    supportsMenu: true,
    supportsPackages: false,
    sortOrder: 3,
  },
  {
    id: "bar_club",
    name: "Bar/Club",
    slug: "bar-club",
    icon: "local_bar",
    description: "Bar, kulüp ve gece hayatı işletmeleri",
    monetized: true,
    supportsRooms: false,
    supportsMenu: true,
    supportsPackages: false,
    sortOrder: 4,
  },
  {
    id: "beach",
    name: "Plaj",
    slug: "beach",
    icon: "beach_access",
    description: "Plaj ve beach facility lokasyonları",
    monetized: true,
    supportsRooms: false,
    supportsMenu: false,
    supportsPackages: false,
    sortOrder: 5,
  },
  {
    id: "natural_location",
    name: "Doğal Lokasyon",
    slug: "natural-location",
    icon: "terrain",
    description: "Doğa odaklı gezilecek lokasyonlar",
    monetized: true,
    supportsRooms: false,
    supportsMenu: false,
    supportsPackages: false,
    sortOrder: 6,
  },
  {
    id: "activity_location",
    name: "Aktivite Lokasyonu",
    slug: "activity-location",
    icon: "directions_boat",
    description: "Dalış, paraşüt vb. aktivite işletmeleri",
    monetized: true,
    supportsRooms: false,
    supportsMenu: false,
    supportsPackages: true,
    sortOrder: 7,
  },
  {
    id: "visit_location",
    name: "Ziyaret Lokasyonu",
    slug: "visit-location",
    icon: "explore",
    description: "Ziyaret ve keşif amaçlı lokasyonlar",
    monetized: false,
    supportsRooms: false,
    supportsMenu: false,
    supportsPackages: false,
    sortOrder: 8,
  },
  {
    id: "other_monetized",
    name: "Diğer Monetize",
    slug: "other-monetized",
    icon: "store",
    description: "Diğer ücretli/rentable lokasyonlar",
    monetized: true,
    supportsRooms: false,
    supportsMenu: false,
    supportsPackages: false,
    sortOrder: 9,
  },
] as const;

const BLOG_CATEGORIES = [
  {
    name: "Seyahat",
    slug: "travel",
    description: "Rota, gezi planı ve seyahat önerileri",
    sortOrder: 0,
  },
  {
    name: "Yeme & İçme",
    slug: "food",
    description: "Yerel lezzetler, restoran önerileri ve gurme içerikler",
    sortOrder: 1,
  },
  {
    name: "Kültür",
    slug: "culture",
    description: "Yerel yaşam, gelenekler ve kültürel keşif içerikleri",
    sortOrder: 2,
  },
  {
    name: "Tarih",
    slug: "history",
    description: "Bölgenin tarihi noktaları ve hikayeleri",
    sortOrder: 3,
  },
  {
    name: "Aktivite",
    slug: "activity",
    description: "Deneyim, macera ve aktivite önerileri",
    sortOrder: 4,
  },
  {
    name: "Yaşam Tarzı",
    slug: "lifestyle",
    description: "Yaşam, tasarım ve trend odaklı içerikler",
    sortOrder: 5,
  },
  {
    name: "İş Dünyası",
    slug: "business",
    description: "İşletme sahipleri ve sektör odaklı içerikler",
    sortOrder: 6,
  },
] as const;

// Turkey province coordinates (approximate city center coordinates)
const PROVINCE_COORDINATES: Record<string, { lat: string; lng: string }> = {
  "01": { lat: "37.0000", lng: "35.3213" }, // Adana
  "02": { lat: "37.7648", lng: "38.2786" }, // Adıyaman
  "03": { lat: "38.7507", lng: "30.5567" }, // Afyonkarahisar
  "04": { lat: "39.7191", lng: "43.0503" }, // Ağrı
  "05": { lat: "40.5499", lng: "40.0000" }, // Amasya
  "06": { lat: "39.9334", lng: "32.8597" }, // Ankara
  "07": { lat: "36.8841", lng: "30.7056" }, // Antalya
  "08": { lat: "41.1828", lng: "41.8183" }, // Artvin
  "09": { lat: "37.8560", lng: "27.8416" }, // Aydın
  "10": { lat: "39.6484", lng: "26.5546" }, // Balıkesir
  "11": { lat: "39.7477", lng: "29.9859" }, // Bilecik
  "12": { lat: "38.8853", lng: "40.4988" }, // Bingöl
  "13": { lat: "38.4007", lng: "42.1183" }, // Bitlis
  "14": { lat: "40.7391", lng: "31.6089" }, // Bolu
  "15": { lat: "37.4613", lng: "30.0665" }, // Burdur
  "16": { lat: "40.1826", lng: "29.0665" }, // Bursa
  "17": { lat: "40.1553", lng: "26.4142" }, // Çanakkale
  "18": { lat: "40.6013", lng: "33.6134" }, // Çankırı
  "19": { lat: "40.8106", lng: "34.9557" }, // Çorum
  "20": { lat: "37.7765", lng: "29.0864" }, // Denizli
  "21": { lat: "37.9144", lng: "40.2306" }, // Diyarbakır
  "22": { lat: "41.6818", lng: "26.5623" }, // Edirne
  "23": { lat: "38.6810", lng: "39.2264" }, // Elazığ
  "24": { lat: "39.7500", lng: "39.5000" }, // Erzincan
  "25": { lat: "39.9000", lng: "41.2700" }, // Erzurum
  "26": { lat: "39.7667", lng: "30.5256" }, // Eskişehir
  "27": { lat: "37.0662", lng: "37.3833" }, // Gaziantep
  "28": { lat: "40.4386", lng: "39.5086" }, // Giresun
  "29": { lat: "40.4608", lng: "39.4703" }, // Gümüşhane
  "30": { lat: "37.5833", lng: "43.7333" }, // Hakkari
  "31": { lat: "36.2021", lng: "36.1605" }, // Hatay
  "32": { lat: "37.7648", lng: "30.5566" }, // Isparta
  "33": { lat: "36.8000", lng: "34.6333" }, // Mersin
  "34": { lat: "41.0082", lng: "28.9784" }, // İstanbul
  "35": { lat: "38.4237", lng: "27.1428" }, // İzmir
  "36": { lat: "40.6167", lng: "43.1000" }, // Kars
  "37": { lat: "41.3887", lng: "33.7827" }, // Kastamonu
  "38": { lat: "38.7312", lng: "35.4787" }, // Kayseri
  "39": { lat: "41.7333", lng: "27.2167" }, // Kırklareli
  "40": { lat: "39.1425", lng: "34.1709" }, // Kırşehir
  "41": { lat: "40.8533", lng: "29.8815" }, // Kocaeli
  "42": { lat: "37.8714", lng: "32.4846" }, // Konya
  "43": { lat: "39.4167", lng: "29.9833" }, // Kütahya
  "44": { lat: "38.3552", lng: "38.3095" }, // Malatya
  "45": { lat: "38.6191", lng: "27.4289" }, // Manisa
  "46": { lat: "37.5847", lng: "36.9228" }, // Kahramanmaraş
  "47": { lat: "37.3212", lng: "40.7245" }, // Mardin
  "48": { lat: "37.2153", lng: "28.3636" }, // Muğla
  "49": { lat: "38.7432", lng: "41.4910" }, // Muş
  "50": { lat: "38.6250", lng: "34.7239" }, // Nevşehir
  "51": { lat: "37.9667", lng: "34.6833" }, // Niğde
  "52": { lat: "40.9833", lng: "37.8833" }, // Ordu
  "53": { lat: "41.0231", lng: "40.5175" }, // Rize
  "54": { lat: "40.6940", lng: "30.4358" }, // Sakarya
  "55": { lat: "41.2867", lng: "36.3300" }, // Samsun
  "56": { lat: "37.9274", lng: "41.9423" }, // Siirt
  "57": { lat: "42.0268", lng: "35.1550" }, // Sinop
  "58": { lat: "39.7477", lng: "37.0179" }, // Sivas
  "59": { lat: "41.2381", lng: "28.9858" }, // Tekirdağ
  "60": { lat: "40.3000", lng: "36.5500" }, // Tokat
  "61": { lat: "41.0015", lng: "39.7178" }, // Trabzon
  "62": { lat: "39.1074", lng: "39.5480" }, // Tunceli
  "63": { lat: "37.1591", lng: "38.7969" }, // Şanlıurfa
  "64": { lat: "38.6823", lng: "29.4082" }, // Uşak
  "65": { lat: "38.4891", lng: "43.4089" }, // Van
  "66": { lat: "39.8181", lng: "34.8147" }, // Yozgat
  "67": { lat: "41.4564", lng: "31.7987" }, // Zonguldak
  "68": { lat: "38.3750", lng: "34.0250" }, // Aksaray
  "69": { lat: "41.9500", lng: "40.2167" }, // Bayburt
  "70": { lat: "36.8219", lng: "32.5421" }, // Karaman
  "71": { lat: "38.6114", lng: "33.5263" }, // Kırıkkale
  "72": { lat: "37.8833", lng: "41.1333" }, // Batman
  "73": { lat: "37.5164", lng: "42.4611" }, // Şırnak
  "74": { lat: "41.4583", lng: "32.0667" }, // Bartın
  "75": { lat: "40.0000", lng: "42.0333" }, // Ardahan
  "76": { lat: "40.5333", lng: "43.2333" }, // Iğdır
  "77": { lat: "40.7350", lng: "29.9106" }, // Yalova
  "78": { lat: "41.1667", lng: "32.6167" }, // Karabük
  "79": { lat: "37.0742", lng: "37.3833" }, // Kilis
  "80": { lat: "37.0000", lng: "35.3333" }, // Osmaniye
  "81": { lat: "40.8438", lng: "31.1565" }, // Düzce
};

// ============================================================================
// SEEDER FUNCTIONS
// ============================================================================

async function seedPermissions(): Promise<Map<string, string>> {
  logSection("Seeding Admin Permissions");

  const permissionMap = new Map<string, string>();

  for (const perm of PERMISSIONS) {
    const existing = await db.query.adminPermissions.findFirst({
      where: eq(adminPermissions.slug, perm.slug),
    });

    if (existing) {
      permissionMap.set(perm.slug, existing.id);
      logSkip(`Permission "${perm.slug}" already exists`);
      continue;
    }

    const id = nanoid();
    await db.insert(adminPermissions).values({
      id,
      slug: perm.slug,
      description: perm.description,
    });
    permissionMap.set(perm.slug, id);
    logSuccess(`Created permission: ${perm.slug}`);
  }

  return permissionMap;
}

async function seedRoles(
  permissionMap: Map<string, string>,
): Promise<Map<string, string>> {
  logSection("Seeding Admin Roles");

  const roleMap = new Map<string, string>();

  for (const role of ROLES) {
    let roleRecord = await db.query.adminRoles.findFirst({
      where: eq(adminRoles.name, role.name),
    });

    if (!roleRecord) {
      const id = nanoid();
      const [newRole] = await db
        .insert(adminRoles)
        .values({
          id,
          name: role.name,
          description: role.description,
        })
        .returning();
      roleRecord = newRole;
      logSuccess(`Created role: ${role.name}`);
    } else {
      logSkip(`Role "${role.name}" already exists`);
    }

    roleMap.set(role.name, roleRecord!.id);

    // Assign permissions to role
    for (const permSlug of role.permissions) {
      const permId = permissionMap.get(permSlug);
      if (permId) {
        await db
          .insert(adminRolePermissions)
          .values({
            roleId: roleRecord!.id,
            permissionId: permId,
          })
          .onConflictDoNothing();
      }
    }
  }

  return roleMap;
}

async function seedAdminUser(roleMap: Map<string, string>): Promise<void> {
  logSection("Seeding Admin User");

  const superAdminRoleId = roleMap.get("Super Admin");

  const existingAdmin = await db.query.admin.findFirst({
    where: eq(admin.email, ADMIN_CONFIG.email),
  });

  if (existingAdmin) {
    // Update existing admin to have super admin role
    await db
      .update(admin)
      .set({
        roleId: superAdminRoleId,
        status: "active",
      })
      .where(eq(admin.email, ADMIN_CONFIG.email));
    logSkip(`Admin "${ADMIN_CONFIG.email}" already exists, updated role`);
    return;
  }

  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: ADMIN_CONFIG.email,
        password: ADMIN_CONFIG.password,
        name: ADMIN_CONFIG.name,
      },
      asResponse: false,
    });

    if (res?.user && superAdminRoleId) {
      await db
        .update(admin)
        .set({
          roleId: superAdminRoleId,
          status: "active",
        })
        .where(eq(admin.id, res.user.id));
      logSuccess(`Created admin: ${ADMIN_CONFIG.email}`);
    }
  } catch (error) {
    console.error("  ❌ Error creating admin:", error);
  }
}

async function seedSubscriptionPlans(): Promise<void> {
  logSection("Seeding Subscription Plans");

  const managedPlanIds = SUBSCRIPTION_PLANS.map((plan) => plan.id);

  // Legacy monthly/quarterly plans stay in DB history, but are set inactive.
  await db
    .update(subscriptionPlan)
    .set({ active: false, updatedAt: new Date() })
    .where(
      and(
        ne(subscriptionPlan.billingCycle, "yearly"),
        eq(subscriptionPlan.active, true),
      ),
    );

  // Deactivate plans not present in the curated yearly catalog.
  await db
    .update(subscriptionPlan)
    .set({ active: false, updatedAt: new Date() })
    .where(
      and(
        notInArray(subscriptionPlan.id, managedPlanIds),
        eq(subscriptionPlan.active, true),
      ),
    );

  for (const plan of SUBSCRIPTION_PLANS) {
    const existing = await db.query.subscriptionPlan.findFirst({
      where: eq(subscriptionPlan.id, plan.id),
    });

    if (existing) {
      await db
        .update(subscriptionPlan)
        .set({
          name: plan.name,
          description: plan.description,
          price: plan.price.toString(),
          currency: plan.currency,
          billingCycle: "yearly",
          maxPlaces: plan.maxPlaces,
          maxBlogs: plan.maxBlogs,
          active: true,
          sortOrder: plan.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlan.id, plan.id));

      logSkip(`Plan "${plan.name}" already exists, updated`);
    } else {
      await db.insert(subscriptionPlan).values({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price.toString(),
        currency: plan.currency,
        billingCycle: "yearly",
        maxPlaces: plan.maxPlaces,
        maxBlogs: plan.maxBlogs,
        active: true,
        sortOrder: plan.sortOrder,
      });
      logSuccess(`Created plan: ${plan.name}`);
    }

    await db
      .delete(subscriptionPlanFeature)
      .where(eq(subscriptionPlanFeature.planId, plan.id));

    if (plan.features.length > 0) {
      await db.insert(subscriptionPlanFeature).values(
        plan.features.map((feature, index) => ({
          id: nanoid(),
          planId: plan.id,
          label: feature,
          sortOrder: index,
        })),
      );
    }

    await db
      .delete(subscriptionPlanEntitlement)
      .where(eq(subscriptionPlanEntitlement.planId, plan.id));

    if (plan.entitlements.length > 0) {
      await db.insert(subscriptionPlanEntitlement).values(
        plan.entitlements.map((entitlement) => ({
          id: nanoid(),
          planId: plan.id,
          resourceKey: entitlement.resourceKey,
          limitCount: entitlement.limitCount,
          isUnlimited: Boolean(entitlement.isUnlimited),
          updatedAt: new Date(),
        })),
      );
    }
  }
}

async function seedCoupons(): Promise<void> {
  logSection("Seeding Coupons");

  for (const item of COUPONS) {
    const normalizedCode = item.code.trim().toUpperCase();
    const existing = await db.query.coupon.findFirst({
      where: eq(coupon.code, normalizedCode),
    });

    let couponId = existing?.id;

    if (existing) {
      couponId = existing.id;
      await db
        .update(coupon)
        .set({
          description: item.description,
          discountType: item.discountType,
          discountValue: item.discountValue.toString(),
          scope: item.scope,
          maxRedemptions: item.maxRedemptions,
          maxRedemptionsPerUser: item.maxRedemptionsPerUser,
          active: item.active,
          updatedAt: new Date(),
        })
        .where(eq(coupon.id, existing.id));
      logSkip(`Coupon "${normalizedCode}" already exists, updated`);
    } else {
      couponId = item.id;
      await db.insert(coupon).values({
        id: item.id,
        code: normalizedCode,
        description: item.description,
        discountType: item.discountType,
        discountValue: item.discountValue.toString(),
        scope: item.scope,
        maxRedemptions: item.maxRedemptions,
        maxRedemptionsPerUser: item.maxRedemptionsPerUser,
        active: item.active,
      });
      logSuccess(`Created coupon: ${normalizedCode}`);
    }

    if (!couponId) continue;

    await db.delete(couponPlan).where(eq(couponPlan.couponId, couponId));
    if (item.scope === "specific_plans" && item.planIds.length > 0) {
      await db.insert(couponPlan).values(
        item.planIds.map((planId) => ({
          id: nanoid(),
          couponId: couponId!,
          planId,
        })),
      );
    }
  }
}

async function seedPlaceKinds(): Promise<void> {
  logSection("Seeding Place Kinds");

  for (const kind of PLACE_KINDS) {
    const existing = await db.query.placeKind.findFirst({
      where: eq(placeKind.id, kind.id),
    });

    if (existing) {
      await db
        .update(placeKind)
        .set({
          slug: kind.slug,
          name: kind.name,
          icon: kind.icon,
          description: kind.description,
          monetized: kind.monetized,
          supportsRooms: kind.supportsRooms,
          supportsMenu: kind.supportsMenu,
          supportsPackages: kind.supportsPackages,
          sortOrder: kind.sortOrder,
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(placeKind.id, kind.id));
      logSkip(`Place kind "${kind.name}" already exists, updated`);
      continue;
    }

    await db.insert(placeKind).values({
      id: kind.id,
      slug: kind.slug,
      name: kind.name,
      icon: kind.icon,
      description: kind.description,
      monetized: kind.monetized,
      supportsRooms: kind.supportsRooms,
      supportsMenu: kind.supportsMenu,
      supportsPackages: kind.supportsPackages,
      sortOrder: kind.sortOrder,
      active: true,
    });
    logSuccess(`Created place kind: ${kind.name}`);
  }
}

async function seedBlogCategories(): Promise<void> {
  logSection("Seeding Blog Categories");

  for (const item of BLOG_CATEGORIES) {
    const existing = await db.query.blogCategory.findFirst({
      where: eq(blogCategory.slug, item.slug),
    });

    if (existing) {
      await db
        .update(blogCategory)
        .set({
          name: item.name,
          description: item.description,
          sortOrder: item.sortOrder,
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(blogCategory.id, existing.id));
      logSkip(`Blog category "${item.name}" already exists, updated`);
      continue;
    }

    await db.insert(blogCategory).values({
      id: nanoid(),
      slug: item.slug,
      name: item.name,
      description: item.description,
      sortOrder: item.sortOrder,
      active: true,
    });
    logSuccess(`Created blog category: ${item.name}`);
  }
}

async function seedProvinces(): Promise<Map<string, string>> {
  logSection("Seeding Turkey Provinces (81 İl)");

  const cities = getCities();
  const provinceMap = new Map<string, string>();

  let created = 0;
  let skipped = 0;

  for (const city of cities) {
    const existing = await db.query.province.findFirst({
      where: eq(province.code, city.code),
    });

    if (existing) {
      provinceMap.set(city.code, existing.id);
      skipped++;
      continue;
    }

    const coords = PROVINCE_COORDINATES[city.code];
    const id = nanoid();

    await db.insert(province).values({
      id,
      code: city.code,
      name: city.name,
      slug: slugify(city.name),
      latitude: coords?.lat,
      longitude: coords?.lng,
    });

    provinceMap.set(city.code, id);
    created++;
  }

  if (created > 0) {
    logSuccess(`Created ${created} provinces`);
  }
  if (skipped > 0) {
    logSkip(`${skipped} provinces already existed`);
  }

  return provinceMap;
}

async function seedDistricts(provinceMap: Map<string, string>): Promise<void> {
  logSection("Seeding Turkey Districts (İlçeler)");

  const cities = getCities();
  let totalCreated = 0;
  let totalSkipped = 0;

  for (const city of cities) {
    const provinceId = provinceMap.get(city.code);
    if (!provinceId) continue;

    const districts = getDistrictsByCityCode(city.code);
    let created = 0;
    let skipped = 0;

    for (const districtName of districts) {
      const slug = `${slugify(city.name)}-${slugify(districtName)}`;

      // Check if district exists by province and name combo
      const existing = await db.query.district.findFirst({
        where: (d, { and, eq }) =>
          and(eq(d.provinceId, provinceId), eq(d.name, districtName)),
      });

      if (existing) {
        skipped++;
        totalSkipped++;
        continue;
      }

      await db.insert(district).values({
        id: nanoid(),
        provinceId,
        provinceCode: city.code,
        name: districtName,
        slug,
      });

      created++;
      totalCreated++;
    }
  }

  if (totalCreated > 0) {
    logSuccess(`Created ${totalCreated} districts`);
  }
  if (totalSkipped > 0) {
    logSkip(`${totalSkipped} districts already existed`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  console.log("\n🌱 Starting Core Data Seeder...");
  console.log("   This seeds essential system data\n");

  const startTime = Date.now();

  try {
    // 1. Seed permissions
    const permissionMap = await seedPermissions();

    // 2. Seed roles with permissions
    const roleMap = await seedRoles(permissionMap);

    // 3. Seed admin user
    await seedAdminUser(roleMap);

    // 4. Seed subscription plans
    await seedSubscriptionPlans();

    // 5. Seed coupons
    await seedCoupons();

    // 6. Seed place kinds
    await seedPlaceKinds();

    // 7. Seed blog categories
    await seedBlogCategories();

    // 8. Seed provinces
    const provinceMap = await seedProvinces();

    // 9. Seed districts
    await seedDistricts(provinceMap);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection("Core Data Seeding Complete");
    console.log(`\n  ⏱️  Completed in ${elapsed}s`);
    console.log("\n  Summary:");
    console.log(`    • ${PERMISSIONS.length} permissions`);
    console.log(`    • ${ROLES.length} roles`);
    console.log(`    • 1 admin user`);
    console.log(`    • ${SUBSCRIPTION_PLANS.length} subscription plans`);
    console.log(`    • ${COUPONS.length} coupons`);
    console.log(`    • ${PLACE_KINDS.length} place kinds`);
    console.log(`    • ${BLOG_CATEGORIES.length} blog categories`);
    console.log(`    • 81 provinces`);
    console.log(`    • ~970 districts`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
