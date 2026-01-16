import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları | TatilDesen",
  description: "TatilDesen platformunun kullanım koşulları ve hizmet şartları.",
};

const SECTIONS = [
  {
    title: "1. Taraflar",
    paragraphs: [
      "Bu kullanım şartları, TatilDesen Teknoloji A.Ş. ile kullanıcı arasında akdedilmiştir.",
      "Platformu kullanmakla şartları kabul etmiş sayılırsınız.",
    ],
  },
  {
    title: "2. Hizmet tanımı",
    paragraphs: [
      "TatilDesen, seçili konaklama ve deneyim sağlayıcılarını misafirlerle buluşturan bir aracı hizmet platformudur.",
      "Sunulan içerikler düzenli olarak güncellense de hatalar içerebilir; bu durumda düzeltme hakkımız saklıdır.",
    ],
  },
  {
    title: "3. Kullanıcı yükümlülükleri",
    paragraphs: [
      "Platform üzerindeki tüm bilgileri doğru ve güncel tutmak, rezervasyonlarda belirtilen kurallara uymak kullanıcı sorumluluğundadır.",
      "Hesap güvenliği için güçlü şifreler kullanılmalı, üçüncü kişilerle paylaşılmamalıdır.",
    ],
  },
  {
    title: "4. Rezervasyon ve iptal",
    paragraphs: [
      "Rezervasyon, ilgili konaklama veya deneyim sağlayıcısının şartlarına tabidir.",
      "İptal ve değişiklik koşulları, rezervasyon esnasında sunulan politikalara göre uygulanır.",
    ],
  },
  {
    title: "5. Ücretlendirme",
    paragraphs: [
      "Fiyatlar vergiler dahil olarak gösterilir; ek hizmet ücretleri belirtilir.",
      "Ödeme sağlayıcılarından doğan ek masraflardan kullanıcı sorumludur.",
    ],
  },
  {
    title: "6. Fikri mülkiyet",
    paragraphs: [
      "TatilDesen logosu, tasarım sistemi ve içerikleri telif hakları ile korunmaktadır.",
      "İzinsiz kullanım, kopyalama ve çoğaltma yasaktır.",
    ],
  },
  {
    title: "7. Sorumluluk sınırları",
    paragraphs: [
      "TatilDesen, üçüncü taraf sağlayıcıların eylemlerinden doğan doğrudan zararlardan sorumlu değildir.",
      "Ancak müşteri memnuniyeti için gerekli arabuluculuk sürecini yürütürüz.",
    ],
  },
  {
    title: "8. Uyuşmazlık çözümü",
    paragraphs: [
      "Uyuşmazlıkların çözümünde Türk hukuku uygulanır ve Muğla mahkemeleri yetkilidir.",
    ],
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-[820px] space-y-10 pb-24 pt-10 px-4 md:pt-14 md:px-0">
      <header className="space-y-3 text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Kullanım şartları
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          TatilDesen Kullanım Şartları
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          Platformumuzu kullanmadan önce lütfen aşağıdaki hüküm ve koşulları dikkatlice okuyun.
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

      <footer className="rounded-3xl border border-border bg-white/80 p-6 text-sm text-muted-foreground">
        Şartlar hakkında sorularınız için legal@tatildesen.com adresinden bize ulaşabilirsiniz.
      </footer>
    </article>
  );
}
