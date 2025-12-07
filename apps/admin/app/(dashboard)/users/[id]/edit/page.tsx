"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useUser, useUpdateUser } from "@/hooks/use-users"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "İsim en az 2 karakter olmalıdır.",
  }),
  role: z.enum(["admin", "owner", "traveler"]),
  status: z.enum(["active", "suspended", "pending"]),
  phone: z.string().optional(),
})

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const { data: user, isLoading: isUserLoading } = useUser(userId)
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "traveler",
      status: "active",
      phone: "",
    },
  })

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        role: user.role,
        status: user.status,
        phone: user.phone || "",
      })
    }
  }, [user, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateUser({ userId, data: values }, {
      onSuccess: () => {
        toast.success("Kullanıcı başarıyla güncellendi")
        router.push(`/users/${userId}`)
      },
      onError: (error: any) => {
        toast.error(error.message || "Kullanıcı güncellenirken bir hata oluştu")
      }
    })
  }

  if (isUserLoading) {
     return (
        <div className="flex-1 space-y-4 p-8 pt-6">
           <Skeleton className="h-8 w-64 mb-6" />
           <Skeleton className="h-[400px]" />
        </div>
     )
  }

  if (!user) {
    return (
       <div className="flex-1 p-8 pt-6 flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold mb-2">Kullanıcı Bulunamadı</h2>
          <Button onClick={() => router.push("/users")}>Listeye Dön</Button>
       </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/users/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Kullanıcıyı Düzenle</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Bilgileri</CardTitle>
            <CardDescription>
              <b>{user.email}</b> hesabını düzenliyorsunuz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İsim Soyisim</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Rol seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="traveler">Gezgin</SelectItem>
                            <SelectItem value="owner">Mekan Sahibi</SelectItem>
                            <SelectItem value="admin">Yönetici</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durum</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Durum seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="pending">Beklemede</SelectItem>
                            <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon (İsteğe Bağlı)</FormLabel>
                      <FormControl>
                        <Input placeholder="+90 ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isUpdating}>
                  {isUpdating ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}