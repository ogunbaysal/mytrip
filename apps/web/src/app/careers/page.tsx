import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kariyer | MyTrip",
  description: "MyTrip ekibine katılın ve seyahat deneyimini yeniden tasarlayın.",
};

const BENEFITS = [
  "Muğla merkezli hibrit çalışma modeli ve sezonluk sahil ofisi",
  "Yılda iki kez MyTrip lokasyonlarında ekip buluşmaları",
  "Özel sağlık sigortası ve sınırsız MyTrip deneyim kredisi",
  "Ürün geliştirme süreçlerinde doğrudan misafir geri bildirimi",
] as const;

const OPEN_ROLES = [
  {
    title: "Kıdemli Frontend Developer",
    location: "Uzaktan / İstanbul",
    type: "Tam zamanlı",
    description:
      "Design system odaklı, performanslı ve erişilebilir kullanıcı arayüzleri inşa edecek ekip arkadaşı arıyoruz.",
    link: "mailto:careers@mytrip.com?subject=Frontend%20Developer%20Başvurusu",
  },
  {
    title: "Deneyim Kürasyon Uzmanı",
    location: "Muğla",
    type: "Tam zamanlı",
    description:
      "Yerel işletmelerle partnerlik kuracak, yeni deneyimleri kürate edecek saha ekibimize katılın.",
    link: "mailto:careers@mytrip.com?subject=Deneyim%20K%C3%BCrasyon%20Uzman%C4%B1%20Başvurusu",
  },
  {
    title: "Lifecycle Marketing Manager",
    location: "Uzaktan / İstanbul",
    type: "Tam zamanlı",
    description:
      "E-posta, push ve CRM kampanyalarıyla MyTrip misafir yolculuğunu güçlendirecek pazarlama lideri arıyoruz.",
    link: "mailto:careers@mytrip.com?subject=Lifecycle%20Marketing%20Manager%20Başvurusu",
  },
] as const;

export default function CareersPage() {
  return (
    <div className="space-y-14 pb-24 pt-10 md:space-y-16 md:pt-14">
      <section className="mx-auto w-full max-w-[960px] space-y-5 px-4 text-center md:px-0">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Kariyer
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          MyTrip ekibine katılın
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          Misafirlerimize Muğla&apos;da unutulmaz deneyimler sunmak için ürün, tasarım ve saha ekipleriyle birlikte çalışın.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[960px] rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-black/5 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">MyTrip&apos;te hayat</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                •
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-4 px-4 md:px-0">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-foreground">Açık pozisyonlar</h2>
          <span className="text-sm text-muted-foreground">{OPEN_ROLES.length} pozisyon</span>
        </div>
        <div className="space-y-4">
          {OPEN_ROLES.map((role) => (
            <div key={role.title} className="space-y-3 rounded-3xl border border-border bg-white p-6 shadow-sm shadow-black/5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {role.location} • {role.type}
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full md:w-auto">
                  <a href={role.link}>Başvur</a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
