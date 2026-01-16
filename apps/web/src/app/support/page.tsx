import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Destek | TatilDesen",
  description:
    "Rezervasyon, üyelik ve ödeme konularında sık sorulan sorular ve destek kanallarımız.",
};

const FAQ_GROUPS = [
  {
    title: "Rezervasyon ve iptal",
    items: [
      {
        question: "Rezervasyonumu nasıl iptal ederim?",
        answer:
          "Hesabınızda &quot;Rezervasyonlarım&quot; bölümüne giderek ilgili rezervasyonu seçin ve iptal talebini başlatın. Ev sahibinin politikalarına göre iade süreci sistem tarafından gösterilecektir.",
      },
      {
        question: "Konaklama için ödeme planı sunuyor musunuz?",
        answer:
          "TatilDesen&apos;te seçili konaklamalar için %30 ön ödeme, kalan tutar check-in&apos;den 7 gün önce olacak şekilde esnek ödeme planları sunuyoruz.",
      },
    ],
  },
  {
    title: "Üyelik ve hesap",
    items: [
      {
        question: "Üyelik seviyelerim nasıl yükselir?",
        answer:
          "Toplam rezervasyon tutarı ve TatilDesen deneyim puanlarınıza göre hesabınız otomatik olarak yükselir. Premium statünüzde özel concierge desteği sağlarız.",
      },
      {
        question: "Hesabımı nasıl kapatırım?",
        answer:
          "support@tatildesen.com adresine talebinizi iletin. 48 saat içinde hesabınızı kapatıp size onay maili gönderiyoruz.",
      },
    ],
  },
  {
    title: "Ödeme ve faturalar",
    items: [
      {
        question: "Fatura talebinde bulunabilir miyim?",
        answer:
          "Rezervasyon onay e-postanızdaki &quot;Fatura oluştur&quot; bağlantısına tıklayarak şirket bilgilerinizi paylaşmanız yeterli. Faturalar 72 saat içinde e-posta ile iletilir.",
      },
      {
        question: "Ödeme yöntemleri güvenli mi?",
        answer:
          "Tüm ödemeler TLS 1.3 sertifikalı altyapıda şifrelenir. Kart bilgileriniz TatilDesen sunucularında tutulmaz, yalnızca ödeme sağlayıcısında saklanır.",
      },
    ],
  },
] as const;

const SUPPORT_CHANNELS = [
  {
    title: "Canlı destek",
    description: "Hafta içi 09.00 - 20.00 arasında canlı sohbet ile destek alın.",
    action: {
      label: "Canlı sohbeti başlat",
      href: "mailto:support@tatildesen.com",
    },
  },
  {
    title: "WhatsApp",
    description: "Rezervasyon öncesi sorularınızı WhatsApp üzerinden 7/24 cevaplıyoruz.",
    action: {
      label: "+90 555 000 00 00",
      href: "https://wa.me/905550000000",
    },
  },
  {
    title: "E-posta",
    description: "48 saat içinde çözümleyeceğimiz detaylı destek talebi oluşturun.",
    action: {
      label: "support@tatildesen.com",
      href: "mailto:support@tatildesen.com",
    },
  },
] as const;

export default function SupportPage() {
  return (
    <div className="space-y-14 pb-24 pt-10 md:space-y-16 md:pt-14">
      <section className="mx-auto w-full max-w-[960px] space-y-5 px-4 text-center md:px-0">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Destek merkezi
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Yardıma mı ihtiyacınız var?
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          Sık sorulan soruları inceleyebilir, canlı destek ekibimizle sohbet başlatabilir veya WhatsApp üzerinden bize yazabilirsiniz.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-6 px-4 md:px-0">
        <div className="grid gap-4 md:grid-cols-3">
          {SUPPORT_CHANNELS.map((channel) => (
            <div
              key={channel.title}
              className="space-y-3 rounded-3xl border border-border bg-white p-5 shadow-sm shadow-black/5"
            >
              <h2 className="text-lg font-semibold text-foreground">{channel.title}</h2>
              <p className="text-sm text-muted-foreground">{channel.description}</p>
              <Button asChild variant="outline" className="w-full">
                <a href={channel.action.href}>{channel.action.label}</a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-8 px-4 md:px-0">
        {FAQ_GROUPS.map((group) => (
          <div key={group.title} className="space-y-4 rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-black/5">
            <h2 className="text-xl font-semibold text-foreground">{group.title}</h2>
            <div className="space-y-4">
              {group.items.map((item) => (
                <div key={item.question} className="space-y-2 rounded-2xl border border-border/60 bg-white p-4">
                  <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
