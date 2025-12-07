

import { Edit, MoreHorizontal, Trash } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SubscriptionPlan } from "@/types/subscriptions"

interface CellActionProps {
  data: SubscriptionPlan
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter()
  // const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    // Delete logic
    toast.success("Plan silindi.")
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
        <DropdownMenuItem onClick={() => router.push(`/subscriptions/plans/${data.id}`)}>
          <Edit className="mr-2 h-4 w-4" /> Düzenle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onConfirm}>
          <Trash className="mr-2 h-4 w-4" /> Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
