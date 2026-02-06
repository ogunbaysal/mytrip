export interface CouponPlanRef {
  id: string
  name: string
}

export interface Coupon {
  id: string
  code: string
  description?: string | null
  discountType: "percent" | "fixed"
  discountValue: string | number
  scope: "all_plans" | "specific_plans"
  planIds: string[]
  plans: CouponPlanRef[]
  maxRedemptions?: number | null
  maxRedemptionsPerUser: number
  active: boolean
  startsAt?: string | null
  endsAt?: string | null
  usageCount: number
  createdAt: string
  updatedAt: string
}

