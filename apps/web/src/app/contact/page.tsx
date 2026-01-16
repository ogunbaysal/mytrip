import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "İletişim | TatilDesen",
  description:
    "TatilDesen ekibiyle iletişime geçin, iş birlikleri ve destek taleplerinizi iletin.",
};

const CONTACT_ENTRIES = [
  {
    title: "Genel iletişim",
    description: "Ekip sorularınız ve ortaklık talepleriniz için bizimle iletişime geçin.",
    href: "mailto:hello@tatildesen.com",
    label: "hello@tatildesen.com",
  },
  {
    title: "Basın ve iş birlikleri",
    description: "Basın kitleri, röportaj talepleri ve marka ortaklıkları.",
    href: "mailto:press@tatildesen.com",
    label: "press@tatildesen.com",
  },
  {
    title: "Destek",
    description: "Rezervasyon ve üyelikle ilgili tüm sorularınız için destek ekibimiz yanınızda.",
    href: "mailto:support@tatildesen.com",
    label: "support@tatildesen.com",
  },
] as const;

const TEXTAREA_CLASS =
  "min-h-[140px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export default function ContactPage() {
  return (
    <div className="space-y-14 pb-24 pt-10 md:space-y-16 md:pt-14">
      <section className="mx-auto w-full max-w-[960px] space-y-6 px-4 md:px-0">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Bize ulaşın
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            TatilDesen ekibiyle iletişime geçin
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Rezervasyon sorularınız, iş birlikleri veya ürün önerileriniz için formu doldurun ya da aşağıdaki kanallardan bize ulaşın.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {CONTACT_ENTRIES.map((contact) => (
            <a
              key={contact.title}
              href={contact.href}
              className="group space-y-2 rounded-3xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <h2 className="text-lg font-semibold text-foreground">{contact.title}</h2>
              <p className="text-sm text-muted-foreground">{contact.description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {contact.label}
                <span aria-hidden>→</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[760px] rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-black/5 md:p-8">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">İletişim formu</h2>
          <p className="text-sm text-muted-foreground">
            Size en kısa sürede dönüş yapabilmemiz için bilgilerinizi paylaşın.
          </p>
        </div>
        <form className="mt-6 grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Adınız
              </label>
              <Input id="name" name="name" placeholder="Ad Soyad" required />
            </div>
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-posta
              </label>
              <Input id="email" name="email" type="email" placeholder="ornek@tatildesen.com" required />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="subject" className="text-sm font-medium text-foreground">
              Konu
            </label>
            <Input id="subject" name="subject" placeholder="İş birliği talebi, soru vb." />
          </div>
          <div className="space-y-1">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Mesajınız
            </label>
            <textarea id="message" name="message" className={TEXTAREA_CLASS} placeholder="Bize iletmek istediğiniz detaylar" required />
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Mesajı gönder
          </Button>
        </form>
      </section>
    </div>
  );
}
