import type { Metadata } from "next";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Hakkımızda | TatilDesen",
  description: "TatilDesen hikayesini, ekibini ve Muğla deneyimini yeniden tanımlama vizyonumuzu keşfedin.",
};

const MILESTONES = [
  {
    year: "2021",
    title: "TatilDesen kuruldu",
    description:
      "Muğla&apos;ya tutkuyla bağlı dört girişimci, premium konaklama ve deneyimleri tek platformda toplamak için yola çıktı.",
  },
  {
    year: "2022",
    title: "İlk 1.000 misafir",
    description:
      "Gurme rotalar ve mavi yolculuk planlarıyla ilk bin misafirimize 4.9 memnuniyet puanı ile hizmet verdik.",
  },
  {
    year: "2024",
    title: "Editör kürasyonu",
    description:
      "Yerel yazarlar ve fotoğrafçılarla çalışarak TatilDesen koleksiyonlarını zenginleştirdik, otel seçkilerimizi %40 genişlettik.",
  },
] as const;

const TEAM_VALUES = [
  "Misafir deneyimini merkeze alan ürünler geliştiririz.",
  "Yerel üreticilerle sürdürülebilir iş birlikleri kurarız.",
  "Veri odaklı kararlar alır, şeffaf iletişime inanırız.",
  "Her sezon Muğla&apos;nın yeni hikâyelerini dünyayla paylaşırız.",
] as const;

const TEAM_ROLES = [
  {
    name: "Deniz Arslan",
    role: "Kurucu Ortak & CEO",
    bio: "Misafir deneyimini yeniden tasarlamaya odaklanan ürün lideri.",
  },
  {
    name: "Ayşe Korkmaz",
    role: "Kurucu Ortak & Chief Curator",
    bio: "Muğla&apos;nın yerel işletmeleriyle 10+ yıllık iş birliği deneyimi.",
  },
  {
    name: "Baran Yıldız",
    role: "Kurucu Ortak & CTO",
    bio: "Ölçeklenebilir seyahat platformları ve veri altyapıları geliştiriyor.",
  },
  {
    name: "Melis Soylu",
    role: "Deneyim Tasarım Direktörü",
    bio: "TatilDesen koleksiyonlarının sahadaki kürasyonundan sorumlu.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-24 pt-10 md:space-y-20 md:pt-14">
      <section className="mx-auto w-full max-w-[960px] space-y-5 px-4 text-center md:px-0">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Hakkımızda
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Muğla&apos;yı yerel gözlerle deneyimleyin
        </h1>
        <p className="mx-auto max-w-3xl text-sm text-muted-foreground md:text-base">
          TatilDesen, Muğla&apos;daki seçili konaklama, gastronomi ve deneyimleri tek çatı altında toplayarak misafirlerimize yerel kürasyonla hazırlanmış rotalar sunar.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
          <Button asChild>
            <Link href="/collections">Koleksiyonları keşfedin</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Ekibimizle tanışın</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-6 px-4 md:px-0">
        <h2 className="text-xl font-semibold text-foreground">Hikayemiz</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Muğla&apos;nın farklı ilçelerinde büyüyen kurucu ekibimiz, yerel işletmelerin benzersiz hikayelerini misafirlerle buluşturmak için TatilDesen&apos;i kurdu. Tasarım odaklı bir dijital deneyimle, konuklarımızın seyahat planlamasını kolaylaştırırken yerel ekosistemi de destekliyoruz.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-6 px-4 md:px-0">
        <h2 className="text-xl font-semibold text-foreground">Dönüm noktaları</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {MILESTONES.map((item) => (
            <div key={item.year} className="space-y-2 rounded-3xl border border-border bg-white p-6 shadow-sm shadow-black/5">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{item.year}</span>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-6 px-4 md:px-0">
        <h2 className="text-xl font-semibold text-foreground">Değerlerimiz</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {TEAM_VALUES.map((value) => (
            <li key={value} className="flex items-start gap-3 rounded-3xl border border-border bg-white/90 p-4 text-sm text-muted-foreground">
              <span className="mt-1 inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                •
              </span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-6 px-4 md:px-0">
        <h2 className="text-xl font-semibold text-foreground">Ekibimiz</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TEAM_ROLES.map((member) => (
            <div key={member.name} className="space-y-2 rounded-3xl border border-border bg-white p-5 shadow-sm shadow-black/5">
              <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
              <p className="text-sm font-medium text-primary/80">{member.role}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center text-sm text-primary/90">
        TatilDesen&apos;e katılmak ister misiniz? Açık pozisyonlarımızı <Link href="/careers" className="font-semibold underline">kariyer sayfamızdan</Link> inceleyin.
      </section>
    </div>
  );
}
