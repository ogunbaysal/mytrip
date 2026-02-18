"use client";

import { Phone } from "lucide-react";

import { DashboardCard, SectionHeader } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PlaceContactInfoValue = {
  phone: string;
  email: string;
  website: string;
};

type PlaceContactSectionProps = {
  value: PlaceContactInfoValue;
  onChange: (value: PlaceContactInfoValue) => void;
};

export function PlaceContactSection({ value, onChange }: PlaceContactSectionProps) {
  return (
    <DashboardCard padding="md">
      <SectionHeader
        title="Iletisim Bilgileri"
        subtitle="Opsiyonel"
        icon={<Phone className="size-5" />}
        size="sm"
        className="mb-6"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={value.phone}
            onChange={(event) => onChange({ ...value, phone: event.target.value })}
            placeholder="+90 5xx xxx xx xx"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={value.email}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
            placeholder="info@ornek.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Web Sitesi</Label>
          <Input
            id="website"
            type="url"
            value={value.website}
            onChange={(event) => onChange({ ...value, website: event.target.value })}
            placeholder="https://"
          />
        </div>
      </div>
    </DashboardCard>
  );
}
