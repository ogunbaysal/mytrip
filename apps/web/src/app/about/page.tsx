import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "TatildeSen.com hakkında daha fazla bilgi alın: platformumuz, misyonumuz ve vizyonumuz.",
};

export default function AboutPage() {
  return (
    <div className="pb-24 pt-10 md:pt-14">
      <article className="mx-auto w-full max-w-[960px] space-y-10 px-4 md:space-y-12 md:px-0">
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Biz Kimiz?
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            TatildeSen.com, Türkiye&apos;nin eşsiz tatil duraklarını, mülk sahipleri
            ve tatil severlerle en şeffaf platformda buluşturmak amacıyla kurulmuş
            bir ilan platformudur. Geleneksel tatil planlama süreçlerindeki karmaşayı
            ortadan kaldırmak ve mülk sahiplerine mülklerini özgürce
            sergileyebilecekleri modern bir dijital vitrin sunmak için buradayız.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Neden TatildeSen?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Biz sadece bir &quot;ilan sitesi&quot; değiliz; tatil ekosistemindeki
            güven boşluğunu doldurmayı hedefleyen bir köprüyüz.
          </p>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            <li>
              <span className="font-medium text-foreground">Doğrudan İletişim:</span>{" "}
              Aracıları aradan çıkarıyor, ilan veren ile tatilciyi en kısa yoldan
              buluşturuyoruz.
            </li>
            <li>
              <span className="font-medium text-foreground">Seçkin İlan Portföyü:</span>{" "}
              Platformumuzdaki her ilanın doğruluğunu ve kalitesini önemsiyor,
              kullanıcı deneyimini her şeyin üzerinde tutuyoruz.
            </li>
            <li>
              <span className="font-medium text-foreground">Kolaylık ve Hız:</span>{" "}
              Dakikalar içinde ilan verebileceğiniz, kullanıcı dostu arayüzümüzle
              hem mülk sahiplerinin hem de gezginlerin zamanına değer veriyoruz.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Misyonumuz
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Türkiye&apos;nin her köşesindeki konaklama seçeneklerini tek bir çatı
            altında toplayarak, tatil planlamayı her iki taraf için de stressiz,
            güvenli ve keyifli bir sürece dönüştürmek.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Vizyonumuz
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Teknolojinin gücünü kullanarak, Türkiye&apos;nin en güvenilen ve en çok
            tercih edilen yerli ilan platformu olmak.
          </p>
        </section>
      </article>
    </div>
  );
}
