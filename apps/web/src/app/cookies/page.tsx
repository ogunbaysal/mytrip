import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası | MyTrip",
  description: "MyTrip platformunda kullanılan çerezler ve yönetim tercihleri hakkında bilgi alın.",
};

const SECTIONS = [
  {
    title: "1. Çerez nedir?",
    paragraphs: [
      "Çerezler, web sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır.",
      "Bu dosyalar, deneyiminizi kişiselleştirmek ve site performansını ölçmek için kullanılır.",
    ],
  },
  {
    title: "2. Kullanılan çerez türleri",
    list: [
      "Zorunlu çerezler: Oturum açma ve güvenlik doğrulaması için gereklidir.",
      "Performans çerezleri: Site trafiğini ölçmek ve iyileştirmeler yapmak için analitik veriler toplar.",
      "Pazarlama çerezleri: İlgi alanlarına özel kampanyalar göstermek için kullanılır.",
    ],
  },
  {
    title: "3. Çerez tercihleri",
    paragraphs: [
      "Tarayıcınızdaki ayarlar üzerinden çerezleri dilediğiniz zaman silebilir veya engelleyebilirsiniz.",
      "Pazarlama çerezleri için sayfanın alt kısmındaki &quot;Çerez tercihlerini güncelle&quot; bağlantısını kullanabilirsiniz.",
    ],
  },
  {
    title: "4. Üçüncü taraf çerezler",
    paragraphs: [
      "Google Analytics ve Meta Pixel gibi hizmet sağlayıcılarının çerezleri kullanılabilir.",
      "Üçüncü taraf çerez ayarları için ilgili sağlayıcının politikalarını inceleyebilirsiniz.",
    ],
  },
  {
    title: "5. İletişim",
    paragraphs: [
      "Çerez politikamızla ilgili sorularınız için privacy@mytrip.com adresine e-posta gönderebilirsiniz.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <article className="mx-auto w-full max-w-[820px] space-y-10 pb-24 pt-10 px-4 md:pt-14 md:px-0">
      <header className="space-y-3 text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Çerezler
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          MyTrip Çerez Politikası
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          Hangi çerezleri kullandığımızı ve tercihlerinizi nasıl yönetebileceğinizi öğrenin.
        </p>
      </header>

      <section className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3 rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-black/5">
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            {section.paragraphs && (
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                {section.paragraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}
            {section.list && (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.list.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <footer className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-sm text-primary/90">
        Çerez tercihlerinizi güncellemek için tarayıcı ayarlarınızı kullanabilir veya privacy@mytrip.com adresiyle iletişime geçebilirsiniz.
      </footer>
    </article>
  );
}
