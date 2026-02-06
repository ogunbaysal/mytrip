"use client"

import { Edit, MoreHorizontal, Trash } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Coupon } from "@/types/coupons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CellActionProps {
  data: Coupon
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter()

  const handleDeactivate = async () => {
    try {
      const res = await fetch(`/api/admin/coupons/${data.id}`, {
        method: "DELETE",
      })
      const response = await res.json()

      if (!res.ok) {
        throw new Error(response.error || "Kupon pasife alınamadı")
      }

      toast.success("Kupon pasife alındı.")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Bir şeyler yanlış gitti.")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Menüyü aç</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => router.push(`/subscriptions/coupons/${data.id}`)}>
          <Edit className="mr-2 h-4 w-4" /> Düzenle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDeactivate}>
          <Trash className="mr-2 h-4 w-4" /> Pasife Al
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
