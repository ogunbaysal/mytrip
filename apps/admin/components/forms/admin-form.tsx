"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Admin, useAdminRoles } from "@/hooks/use-admins"

const adminFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  status: z.enum(["active", "suspended"]).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
})

type AdminFormValues = z.infer<typeof adminFormSchema>

interface AdminFormProps {
  initialData?: Admin | null;
  onSubmit: (data: AdminFormValues) => void;
  isLoading: boolean;
  isEdit?: boolean;
}

export function AdminForm({ initialData, onSubmit, isLoading, isEdit = false }: AdminFormProps) {
  const { data: roleOptions = [], isLoading: isRolesLoading } = useAdminRoles()

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      roleId: initialData?.roleId || "",
      status:
        initialData?.status && initialData.status !== "pending"
          ? initialData.status
          : "active",
      password: "",
    },
  })

  const roles = [...roleOptions]
  if (
    initialData?.roleId &&
    !roles.some((role) => role.id === initialData.roleId)
  ) {
    roles.push({
      id: initialData.roleId,
      name: initialData.role || "Mevcut Rol",
      description: null,
    })
  }

  const handleSubmit = (data: AdminFormValues) => {
    // Remove password if empty in edit mode
    if (isEdit && !data.password) {
        delete data.password;
    }
    onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full max-w-lg">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Only show/require password on create, optional on edit */}
        {(!isEdit) && (
             <FormField
             control={form.control}
             name="password"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Şifre</FormLabel>
                 <FormControl>
                   <Input type="password" placeholder="******" {...field} />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
        )}

        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isRolesLoading ? (
                    <SelectItem value="__loading__" disabled>
                      Roller yükleniyor...
                    </SelectItem>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && (
             <FormField
             control={form.control}
             name="status"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Durum</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value}>
                   <FormControl>
                     <SelectTrigger>
                       <SelectValue placeholder="Durum seçin" />
                     </SelectTrigger>
                   </FormControl>
                   <SelectContent>
                     <SelectItem value="active">Aktif</SelectItem> 
                     <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                   </SelectContent>
                 </Select>
                 <FormMessage />
               </FormItem>
             )}
           />
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
        </Button>
      </form>
    </Form>
  )
}
