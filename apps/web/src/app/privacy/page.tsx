import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | MyTrip",
  description: "MyTrip gizlilik politikası ve kişisel verilerin korunmasına ilişkin bilgiler.",
};

const SECTIONS = [
  {
    title: "1. Genel bilgiler",
    paragraphs: [
      "MyTrip, kullanıcılarının kişisel verilerinin gizliliğine saygı duyar ve 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında gerekli tüm teknik ve idari tedbirleri alır.",
      "Bu politika, mytrip.com ve bağlı alt alan adları üzerinden sunulan tüm hizmetler için geçerlidir.",
    ],
  },
  {
    title: "2. Toplanan veriler",
    paragraphs: [
      "Rezervasyon işlemleri sırasında ad, soyad, e-posta, telefon ve ödeme bilgileri gibi veriler toplanır.",
      "Ziyaretçi davranışlarını analiz etmek için çerezler ve analitik araçlar aracılığıyla anonim veriler toplayabiliriz.",
    ],
  },
  {
    title: "3. Veri kullanım amaçları",
    paragraphs: [
      "Kullanıcı deneyimini özelleştirmek, rezervasyonları yönetmek ve müşteri desteği sağlamak.",
      "Pazarlama iletişimi göndermeden önce açık rızanız talep edilir ve istediğiniz zaman reddedebilirsiniz.",
    ],
  },
  {
    title: "4. Veri paylaşımı",
    paragraphs: [
      "Konaklama ve deneyim sağlayıcılarıyla rezervasyon sürecini tamamlamak için gerekli veriler paylaşılabilir.",
      "Yasal yükümlülükler kapsamında ilgili otoritelerle veri paylaşımı yapılabilir.",
    ],
  },
  {
    title: "5. Veri saklama süreleri",
    paragraphs: [
      "Rezervasyon verileri, 10 yıl süreyle güvenli sunucularda saklanır.",
      "Pazarlama iletişimi rızaları, geri çekilinceye kadar muhafaza edilir.",
    ],
  },
  {
    title: "6. Haklarınız",
    paragraphs: [
      "Kişisel verilerinizin silinmesini, düzeltilmesini veya taşınmasını talep edebilirsiniz.",
      "Destek talepleri için kvkk@mytrip.com adresine e-posta gönderebilirsiniz.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto w-full max-w-[820px] space-y-10 pb-24 pt-10 px-4 md:pt-14 md:px-0">
      <header className="space-y-3 text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Gizlilik
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          MyTrip Gizlilik Politikası
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          Kullanıcı verilerinin nasıl toplandığı, saklandığı ve korunduğuna dair detaylı bilgi.
        </p>
      </header>

      <section className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3 rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-black/5">
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              {section.paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-sm text-primary/90">
        Gizlilik politikamızla ilgili sorularınız için kvkk@mytrip.com adresine e-posta gönderebilirsiniz.
      </footer>
    </article>
  );
}
