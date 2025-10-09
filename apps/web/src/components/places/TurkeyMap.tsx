"use client";

import dynamic from "next/dynamic";

const DynamicTurkeyMap = dynamic(() => import("./TurkeyMap.client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Harita yükleniyor...
    </div>
  ),
});

interface TurkeyMapProps {
  className?: string;
  onProvinceClick?: (provinceName: string) => void;
}

export default function TurkeyMap(props: TurkeyMapProps) {
  return <DynamicTurkeyMap {...props} />;
}
