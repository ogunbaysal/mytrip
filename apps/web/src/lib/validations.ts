import { z } from "zod";

import { STAY_TYPES } from "@/stores/app-store";

export const searchFormSchema = z
  .object({
    location: z.string().min(2, "Lütfen bir lokasyon girin"),
    checkIn: z.string().nullable().optional(),
    checkOut: z.string().nullable().optional(),
    guests: z
      .number({ error: "Geçerli bir misafir sayısı girin" })
      .int({ error: "Geçerli bir misafir sayısı girin" })
      .min(1, { error: "En az bir misafir" }),
    stayType: z.enum(STAY_TYPES),
  })
  .refine(
    (data) => {
      if (data.checkIn && data.checkOut) {
        return new Date(data.checkOut) > new Date(data.checkIn);
      }

      return true;
    },
    {
      message: "Çıkış tarihi girişten sonra olmalı",
      path: ["checkOut"],
    }
  );

export type SearchFormValues = z.infer<typeof searchFormSchema>;
