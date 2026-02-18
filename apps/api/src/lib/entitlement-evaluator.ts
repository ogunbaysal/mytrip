export type EntitlementRule = {
  resourceKey: string;
  limitCount: number | null;
  isUnlimited: boolean;
};

export type EntitlementDecision = {
  allowed: boolean;
  current: number;
  max: number | null;
  isUnlimited: boolean;
};

export const evaluateEntitlementLimit = ({
  resourceKey,
  entitlements,
  usageByResource,
}: {
  resourceKey: string;
  entitlements: EntitlementRule[];
  usageByResource: Record<string, number>;
}): EntitlementDecision => {
  const entitlement = entitlements.find((item) => item.resourceKey === resourceKey);
  if (!entitlement) {
    return { allowed: false, current: 0, max: 0, isUnlimited: false };
  }

  const currentCount = usageByResource[resourceKey] ?? 0;
  if (entitlement.isUnlimited) {
    return {
      allowed: true,
      current: currentCount,
      max: null,
      isUnlimited: true,
    };
  }

  const max = entitlement.limitCount ?? 0;
  return {
    allowed: currentCount < max,
    current: currentCount,
    max,
    isUnlimited: false,
  };
};
