"use client"

import { useEffect, useState } from "react"
import { Heading } from "@/components/ui/heading"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// Define Payment Type loosely based on expected API response
interface Payment {
  id: string
  userId: string
  userEmail: string
  subscriptionId: string
  amount: number
  currency: string
  status: "success" | "failed" | "pending"
  providerTransactionId?: string
  date: Date
}

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "İşlem ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>
  },
  {
    accessorKey: "userEmail",
    header: "Kullanıcı",
  },
  {
    accessorKey: "amount",
    header: "Tutar",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: row.original.currency || "TRY"
        }).format(row.original.amount)}
      </div>
    )
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={status === "success" ? "default" : status === "pending" ? "secondary" : "destructive"}>
          {status === "success" ? "Başarılı" : status === "pending" ? "Beklemede" : "Başarısız"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "date",
    header: "Tarih",
    cell: ({ row }) => (
      <div className="text-sm">
        {format(row.original.date, "d MMMM yyyy HH:mm", { locale: tr })}
      </div>
    )
  },
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/payments");
        if (!res.ok) throw new Error("Ödemeler yüklenemedi");
        
        const data = await res.json();
        
        if (data.payments) {
            interface ApiPayment {
                id: string;
                user?: { id: string; email: string };
                subscriptionId?: string;
                amount: string | number;
                currency: string;
                status: "success" | "failed" | "pending";
                date: string;
                providerTransactionId?: string;
            }
            const mappedPayments: Payment[] = data.payments.map((p: ApiPayment) => ({
                id: p.id,
                userId: p.user?.id || "",
                userEmail: p.user?.email || "Bilinmiyor",
                subscriptionId: p.subscriptionId || "", // API might need to return this if not already
                amount: typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount,
                currency: p.currency,
                status: p.status,
                date: new Date(p.date),
                providerTransactionId: p.providerTransactionId
            }));
            setPayments(mappedPayments);
        }
      } catch (error) {
        console.error("Failed to fetch payments", error);
        toast.error("Ödeme geçmişi yüklenemedi");
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title={`Ödeme Geçmişi (${payments.length})`}
          description="Sistemdeki tüm abonelik ödemelerini görüntüleyin."
        />
      </div>
      <Separator />
      <DataTable searchKey="userEmail" columns={columns} data={payments} />
    </div>
  )
}
