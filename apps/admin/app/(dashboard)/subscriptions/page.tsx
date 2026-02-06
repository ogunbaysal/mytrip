"use client"

import { useEffect, useState } from "react"
import { SubscriptionsTable } from "@/components/tables/subscriptions-table"
import { Subscription } from "@/types/subscriptions"
import { toast } from "sonner"

interface ApiSubscription {
  id: string
  userId: string
  planId: string
  status: Subscription["status"]
  startDate: string
  endDate: string
  nextBillingDate?: string | null
  cancelledAt?: string | null
  trialEndsAt?: string | null
  price: number | string
  currency: Subscription["currency"]
  billingCycle: Subscription["billingCycle"]
  usage?: {
    currentPlaces?: number
    currentBlogs?: number
  }
  paymentMethod?: {
    type?: string
    lastFour?: string
    brand?: string
  }
  user?: {
    id?: string
    name?: string
    email?: string
  }
  plan?: {
    id?: string
    name?: string
    maxPlaces?: number
    maxBlogs?: number
  }
  createdAt?: string
  updatedAt?: string
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/subscriptions");
        if (!res.ok) throw new Error("Failed to fetch subscriptions");
        
        const data = await res.json();
        if (data.subscriptions) {
          const mappedSubs: Subscription[] = data.subscriptions.map((sub: ApiSubscription) => ({
            id: sub.id,
            userId: sub.userId || sub.user?.id || "",
            planId: sub.planId || sub.plan?.id || "",
            status: sub.status,
            startDate: new Date(sub.startDate),
            endDate: new Date(sub.endDate),
            nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate) : undefined,
            cancelledAt: sub.cancelledAt ? new Date(sub.cancelledAt) : undefined,
            trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : undefined,
            ownerName: sub.user?.name || "Bilinmeyen Kullanıcı",
            ownerEmail: sub.user?.email || "unknown@example.com",
            planName: sub.plan?.name || "Bilinmeyen Plan",
            ownerId: sub.user?.id || sub.userId || "",
            price: typeof sub.price === "number" ? sub.price : parseFloat(sub.price || "0"),
            currency: sub.currency || "TRY",
            billingCycle: "yearly",
            features: [],
            limits: {
              maxPlaces: sub.plan?.maxPlaces ?? 0,
              maxBlogs: sub.plan?.maxBlogs ?? 0,
            },
            usage: {
              currentPlaces: sub.usage?.currentPlaces ?? 0,
              currentBlogs: sub.usage?.currentBlogs ?? 0,
              currentPhotos: 0,
              featuredListingsUsed: 0,
            },
            paymentMethod: {
              type:
                sub.paymentMethod?.type === "credit_card" ||
                sub.paymentMethod?.type === "bank_transfer" ||
                sub.paymentMethod?.type === "paypal"
                  ? sub.paymentMethod.type
                  : "unknown",
              lastFour: sub.paymentMethod?.lastFour,
              brand: sub.paymentMethod?.brand,
            },
            paymentHistory: [],
            createdAt: sub.createdAt ? new Date(sub.createdAt) : undefined,
            updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : undefined,
          }))
          setSubscriptions(mappedSubs)
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error)
        toast.error("Abonelikler yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    fetchSubscriptions()
  }, [])

  if (loading) return <div>Yükleniyor...</div>

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SubscriptionsTable initialData={subscriptions} />
    </div>
  )
}
