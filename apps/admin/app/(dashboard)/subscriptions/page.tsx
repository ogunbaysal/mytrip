"use client"

import { useEffect, useState } from "react"
import { SubscriptionsTable } from "@/components/tables/subscriptions-table"
import { Subscription } from "@/types/subscriptions"
import { toast } from "sonner" 

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
           const mappedSubs: Subscription[] = data.subscriptions.map((sub) => ({
             id: sub.id,
             userId: sub.user?.id || "",
             planId: sub.plan?.id || "",
             status: sub.status,
             startDate: new Date(sub.startDate),
             endDate: new Date(sub.endDate),
             
             // Flattened fields
             ownerName: sub.user?.name || "Unknown",
             ownerEmail: sub.user?.email || "Unknown",
             planName: sub.plan?.name || "Unknown",
             ownerId: sub.user?.id || "",

             // Defaults for fields possibly missing from this specific API endpoint
             price: sub.plan?.price ? parseFloat(sub.plan.price) : 0,
             currency: "TRY",
             billingCycle: "monthly",
             features: [],
             limits: { maxPlaces: 0, maxBlogs: 0, maxPhotos: 0, featuredListing: false, analyticsAccess: false, prioritySupport: false },
             usage: { currentPlaces: 0, currentBlogs: 0, currentPhotos: 0, featuredListingsUsed: 0 },
             paymentMethod: { type: "unknown" },
             paymentHistory: [],
             createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
             updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : new Date(),
           }));
           setSubscriptions(mappedSubs);
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