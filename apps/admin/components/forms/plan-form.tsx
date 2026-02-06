"use client"

import * as z from "zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { SubscriptionPlan } from "@/types/subscriptions"

const formSchema = z.object({
  name: z.string().min(1, "Plan adı gereklidir"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Fiyat 0 veya daha büyük olmalıdır"),
  currency: z.enum(["TRY", "USD", "EUR"]),
  maxPlaces: z.coerce.number().int().min(0, "Mekan limiti 0 veya daha büyük olmalıdır"),
  maxBlogs: z.coerce.number().int().min(0, "Blog limiti 0 veya daha büyük olmalıdır"),
  featuresText: z.string().optional(),
  active: z.boolean().default(true),
})

type PlanFormValues = z.infer<typeof formSchema>

interface PlanFormProps {
  initialData: SubscriptionPlan | null
}

export const PlanForm: React.FC<PlanFormProps> = ({ initialData }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toastMessage = initialData ? "Plan güncellendi." : "Plan oluşturuldu."
  const action = initialData ? "Değişiklikleri Kaydet" : "Oluştur"

  const defaultValues: PlanFormValues = initialData ? {
    name: initialData.name,
    description: initialData.description || "",
    price: parseFloat(initialData.price.toString()),
    currency: initialData.currency as "TRY" | "USD" | "EUR",
    maxPlaces: initialData.maxPlaces ?? initialData.limits?.maxPlaces ?? 0,
    maxBlogs: initialData.maxBlogs ?? initialData.limits?.maxBlogs ?? 0,
    featuresText: (initialData.features ?? []).join("\n"),
    active: initialData.active,
  } : {
    name: "",
    description: "",
    price: 0,
    currency: "TRY",
    maxPlaces: 1,
    maxBlogs: 1,
    featuresText: "",
    active: true,
  }

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  })

  const onSubmit = async (data: PlanFormValues) => {
    try {
      setLoading(true)
      const url = initialData ? `/api/admin/plans/${initialData.id}` : `/api/admin/plans`
      const method = initialData ? "PUT" : "POST"
      const features = (data.featuresText || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          billingCycle: "yearly",
          features,
        }),
      })

      if (!res.ok) throw new Error("Bir hata oluştu")

      toast.success(toastMessage)
      router.push("/subscriptions/plans")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Bir şeyler yanlış gitti.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Adı</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Örn: Temel Paket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiyat</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="99.90" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPlaces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mekan Limiti</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxBlogs"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Blog Limiti</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para Birimi</FormLabel>
                  <FormControl>
                    <Input disabled readOnly {...field} className="bg-muted" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Şu an sadece yıllık TRY planları desteklenir.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Plan açıklaması..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="featuresText"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Plan Özellikleri</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder={"Her satıra bir özellik yazın\nÖrn: 5 mekan yayınlama hakkı"}
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Her satır ayrı özellik olarak kaydedilir.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Aktif Durum
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Bu planın satın alınabilir olup olmadığını belirler.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  )
}
