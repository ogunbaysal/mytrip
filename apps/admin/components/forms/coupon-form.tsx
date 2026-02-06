"use client"

import * as z from "zod"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Coupon } from "@/types/coupons"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z
  .object({
    code: z.string().min(3, "Kupon kodu en az 3 karakter olmalıdır"),
    description: z.string().optional(),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().positive("İndirim değeri 0'dan büyük olmalıdır"),
    scope: z.enum(["all_plans", "specific_plans"]),
    planIds: z.array(z.string()).default([]),
    maxRedemptions: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
    maxRedemptionsPerUser: z.coerce.number().int().min(1),
    active: z.boolean().default(true),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "percent" && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Yüzde indirim 100'den büyük olamaz",
        path: ["discountValue"],
      })
    }

    if (data.scope === "specific_plans" && data.planIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bu kapsam için en az bir plan seçmelisiniz",
        path: ["planIds"],
      })
    }

    if (data.startsAt && data.endsAt) {
      const start = new Date(data.startsAt)
      const end = new Date(data.endsAt)
      if (start > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitiş tarihi başlangıçtan önce olamaz",
          path: ["endsAt"],
        })
      }
    }
  })

type CouponFormValues = z.infer<typeof formSchema>

interface PlanOption {
  id: string
  name: string
}

interface CouponFormProps {
  initialData: Coupon | null
}

const toLocalDateTimeInput = (value?: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const tzOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

export const CouponForm: React.FC<CouponFormProps> = ({ initialData }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  const isEdit = Boolean(initialData)
  const actionLabel = isEdit ? "Değişiklikleri Kaydet" : "Kupon Oluştur"
  const successMessage = isEdit ? "Kupon güncellendi." : "Kupon oluşturuldu."

  const defaultValues: CouponFormValues = useMemo(
    () =>
      initialData
        ? {
            code: initialData.code,
            description: initialData.description || "",
            discountType: initialData.discountType,
            discountValue: Number(initialData.discountValue),
            scope: initialData.scope,
            planIds: initialData.planIds || [],
            maxRedemptions:
              initialData.maxRedemptions === null || initialData.maxRedemptions === undefined
                ? ""
                : Number(initialData.maxRedemptions),
            maxRedemptionsPerUser: initialData.maxRedemptionsPerUser ?? 1,
            active: initialData.active,
            startsAt: toLocalDateTimeInput(initialData.startsAt),
            endsAt: toLocalDateTimeInput(initialData.endsAt),
          }
        : {
            code: "",
            description: "",
            discountType: "percent",
            discountValue: 10,
            scope: "all_plans",
            planIds: [],
            maxRedemptions: "",
            maxRedemptionsPerUser: 1,
            active: true,
            startsAt: "",
            endsAt: "",
          },
    [initialData],
  )

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  })

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/admin/plans")
        if (!res.ok) throw new Error("Planlar yüklenemedi")
        const data = await res.json()
        setPlans((data.plans || []).map((p: any) => ({ id: p.id, name: p.name })))
      } catch (error) {
        console.error(error)
        toast.error("Planlar yüklenemedi")
      } finally {
        setPlansLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const scope = form.watch("scope")

  const onSubmit = async (values: CouponFormValues) => {
    try {
      setLoading(true)
      const url = isEdit ? `/api/admin/coupons/${initialData!.id}` : "/api/admin/coupons"
      const method = isEdit ? "PUT" : "POST"

      const payload = {
        code: values.code.trim().toUpperCase(),
        description: values.description || undefined,
        discountType: values.discountType,
        discountValue: values.discountValue,
        scope: values.scope,
        planIds: values.scope === "specific_plans" ? values.planIds : [],
        maxRedemptions:
          values.maxRedemptions === "" || values.maxRedemptions === undefined
            ? null
            : Number(values.maxRedemptions),
        maxRedemptionsPerUser: values.maxRedemptionsPerUser,
        active: values.active,
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "İşlem başarısız")
      }

      toast.success(successMessage)
      router.push("/subscriptions/coupons")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Bir şeyler yanlış gitti.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kupon Kodu</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="Örn: WELCOME10"
                    className="uppercase"
                    {...field}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İndirim Tipi</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="İndirim tipi seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percent">Yüzde (%)</SelectItem>
                    <SelectItem value="fixed">Sabit Tutar</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İndirim Değeri</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kapsam</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kapsam seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all_plans">Tüm Planlar</SelectItem>
                    <SelectItem value="specific_plans">Belirli Planlar</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {scope === "specific_plans" && (
            <FormField
              control={form.control}
              name="planIds"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Geçerli Planlar</FormLabel>
                  <div className="rounded-md border p-4 space-y-3">
                    {plansLoading ? (
                      <p className="text-sm text-muted-foreground">Planlar yükleniyor...</p>
                    ) : plans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Plan bulunamadı.</p>
                    ) : (
                      plans.map((plan) => (
                        <label key={plan.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={field.value.includes(plan.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, plan.id])
                              } else {
                                field.onChange(field.value.filter((id) => id !== plan.id))
                              }
                            }}
                          />
                          <span>{plan.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="maxRedemptions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Toplam Kullanım Limiti (opsiyonel)</FormLabel>
                <FormControl>
                  <Input type="number" disabled={loading} placeholder="Boş bırak: sınırsız" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxRedemptionsPerUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kullanıcı Başına Limit</FormLabel>
                <FormControl>
                  <Input type="number" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Başlangıç Tarihi (opsiyonel)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bitiş Tarihi (opsiyonel)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea disabled={loading} rows={3} placeholder="Kupon açıklaması..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="md:col-span-2 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aktif Durum</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Aktif olmayan kuponlar kullanımda görünmez.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button disabled={loading} className="ml-auto" type="submit">
          {actionLabel}
        </Button>
      </form>
    </Form>
  )
}

