import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.ts";
import {
  user,
  businessRegistration,
  businessProfile,
} from "../db/schemas/index.ts";
import { eq, and, desc } from "drizzle-orm";
import { getSessionFromRequest } from "../lib/session.ts";

const app = new Hono();

const businessRegistrationSchema = z.object({
  companyName: z
    .string()
    .min(2, "Şirket adı en az 2 karakter olmalıdır")
    .max(200),
  taxId: z
    .string()
    .min(10, "Vergi numarası en az 10 karakter olmalıdır")
    .max(20),
  businessAddress: z.string().optional(),
  contactPhone: z
    .string()
    .min(10, "Telefon numarası en az 10 karakter olmalıdır"),
  contactEmail: z.string().email("Geçerli bir e-posta adresi giriniz"),
  businessType: z.string().min(2).max(100),
  documents: z.array(z.string()).optional(),
});

const businessProfileSchema = z.object({
  logo: z.string().optional(),
  description: z.string().max(1000).optional(),
  website: z
    .string()
    .url("Geçerli bir website adresi giriniz")
    .optional()
    .or(z.literal("")),
  socialMedia: z.record(z.string(), z.string()).optional(),
  businessHours: z.record(z.string(), z.any()).optional(),
  responseTime: z.string().optional(),
});

app.post(
  "/register",
  zValidator("json", businessRegistrationSchema),
  async (c) => {
    try {
      const sessionData = await getSessionFromRequest(c);
      if (!sessionData?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const userId = sessionData.user.id;
      const data = c.req.valid("json");
      const { nanoid } = await import("nanoid");

      const [existingRegistration] = await db
        .select()
        .from(businessRegistration)
        .where(eq(businessRegistration.userId, userId));

      if (existingRegistration) {
        if (existingRegistration.status === "pending") {
          return c.json(
            {
              error: "Zaten beklemede olan bir işletme kaydınız bulunmaktadır",
              status: existingRegistration.status,
              registrationId: existingRegistration.id,
            },
            400,
          );
        }
        if (existingRegistration.status === "approved") {
          return c.json(
            {
              error: "İşletmeniz zaten onaylanmış durumda",
              status: existingRegistration.status,
            },
            400,
          );
        }
        if (existingRegistration.status === "rejected") {
          return c.json(
            {
              error:
                "Önceki başvurunuz reddedildi. Yeni bir başvuru oluşturabilirsiniz",
              previousRejection: existingRegistration.rejectionReason,
            },
            400,
          );
        }
      }

      const [newRegistration] = await db
        .insert(businessRegistration)
        .values({
          id: nanoid(),
          userId,
          companyName: data.companyName,
          taxId: data.taxId,
          businessAddress: data.businessAddress || null,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          businessType: data.businessType,
          documents: data.documents ? JSON.stringify(data.documents) : null,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(
        {
          success: true,
          message:
            "İşletme kaydınız başarıyla alındı. İncelendikten sonra size bildirim gönderilecektir.",
          registrationId: newRegistration.id,
          status: "pending",
        },
        201,
      );
    } catch (error) {
      console.error("Business registration error:", error);
      if (error instanceof z.ZodError) {
        return c.json(
          { error: "Validation failed", issues: error.issues },
          400,
        );
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.get("/profile", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;

    const [registration] = await db
      .select()
      .from(businessRegistration)
      .where(eq(businessRegistration.userId, userId))
      .limit(1);

    const [profile] = await db
      .select()
      .from(businessProfile)
      .where(eq(businessProfile.userId, userId))
      .limit(1);

    return c.json({
      registration: registration || null,
      profile: profile || null,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role,
        subscriptionStatus: (session.user as any).subscriptionStatus,
      },
    });
  } catch (error) {
    console.error("Get business profile error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/profile", zValidator("json", businessProfileSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const data = c.req.valid("json");

    const [registration] = await db
      .select()
      .from(businessRegistration)
      .where(eq(businessRegistration.userId, userId))
      .limit(1);

    if (!registration || registration.status !== "approved") {
      return c.json(
        {
          error:
            "İşletme profili güncellemek için öncelikle kaydınızın onaylanmış olması gerekir",
        },
        403,
      );
    }

    const existingProfile = await db
      .select()
      .from(businessProfile)
      .where(eq(businessProfile.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      await db
        .update(businessProfile)
        .set({
          logo: data.logo || null,
          description: data.description || null,
          website: data.website || null,
          socialMedia: data.socialMedia
            ? JSON.stringify(data.socialMedia)
            : null,
          businessHours: data.businessHours
            ? JSON.stringify(data.businessHours)
            : null,
          responseTime: data.responseTime || null,
          updatedAt: new Date(),
        })
        .where(eq(businessProfile.userId, userId));
    } else {
      const { nanoid } = await import("nanoid");
      await db.insert(businessProfile).values({
        id: nanoid(),
        userId,
        logo: data.logo || null,
        description: data.description || null,
        website: data.website || null,
        socialMedia: data.socialMedia ? JSON.stringify(data.socialMedia) : null,
        businessHours: data.businessHours
          ? JSON.stringify(data.businessHours)
          : null,
        responseTime: data.responseTime || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return c.json({
      success: true,
      message: "İşletme profiliniz başarıyla güncellendi",
    });
  } catch (error) {
    console.error("Update business profile error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/status", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;

    const [registration] = await db
      .select({ status: businessRegistration.status })
      .from(businessRegistration)
      .where(eq(businessRegistration.userId, userId))
      .limit(1);

    return c.json({
      hasRegistration: !!registration,
      status: registration?.status || null,
      role: (session.user as any).role,
    });
  } catch (error) {
    console.error("Get business status error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { app as businessRoutes };
