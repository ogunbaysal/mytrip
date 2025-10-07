import type { BlogPostDetail } from "@/types";

import { BLOG_POSTS } from "./blog-posts";

function getBase(slug: string) {
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  if (!post) {
    throw new Error(`Blog post not found for slug: ${slug}`);
  }
  return post;
}

export const BLOG_POST_DETAILS: BlogPostDetail[] = [
  {
    ...getBase("bodrum-gurme-rehberi"),
    heroImage:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1800&q=80",
    intro:
      "Türkbükü&apos;nden Yalıkavak&apos;a uzanan gurme rotada şef restoranlarını, butik bağları ve gizli kokteyl barlarını keşfedin. MyTrip editörlerinin seçtiği mekanlarla dolu bu plan, Bodrum&apos;da lezzet odaklı bir hafta sonu için rehberiniz olacak.",
    sections: [
      {
        title: "1. Gün: Sahil kahvaltısı ve bağ gezisi",
        paragraphs: [
          "Sabahı Türkbükü&apos;nde denize karşı organik kahvaltıyla başlatın. Ardından Yalıçiftlik&apos;teki yerel üreticilerle tanışıp zeytinyağı tadımı yapın.",
          "Öğleden sonra Yalıkavak&apos;taki butik bağ evinde rehberli tur ve premium şarap tadımına katılın. Gün batımında marinada modern meze barını deneyimleyin.",
        ],
        image: {
          src: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1600&q=80",
          alt: "Bodrum bağ turu",
        },
      },
      {
        title: "2. Gün: Şef menüleri ve gizli kokteyl barları",
        paragraphs: [
          "Günü, Dibeklihan&apos;da yerel şeflerin hazırladığı fırın ekşi maya atölyesiyle açın.",
          "Akşam Yalıkavak&apos;ta rezervasyonlu tadım menüsü sizi bekliyor. Gecenin sonunda marina arka sokaklarındaki speakeasy barlarda craft kokteyller deneyin.",
        ],
      },
      {
        title: "3. Gün: Yerel pazar keşfi",
        paragraphs: [
          "Pazar sabahı Bodrum merkezdeki üretici pazarında mandalina reçelleri, otlar ve keçi peynirlerini deneyimleyin.",
          "Dönüş öncesi denize nazır bir lokantada taze deniz ürünleriyle uzun bir öğle yemeği planlayın.",
        ],
      },
    ],
    tips: [
      "Popüler restoranlar için en az üç gün önceden rezervasyon yaptırın.",
      "Bağ ziyaretlerinde rahat ayakkabı tercih edin; yürüyüşlü turlar bulunuyor.",
      "Akşam menülerinde yerel şarap eşleşmelerini tercih ederek üreticileri destekleyin.",
    ],
  },
  {
    ...getBase("mavi-yolculuk-servisi"),
    heroImage:
      "https://images.unsplash.com/photo-1493555049923-7928e27c57c4?auto=format&fit=crop&w=1800&q=80",
    intro:
      "Mavi yolculuğa çıkmadan önce gulet seçiminden bavul hazırlığına kadar bilmeniz gerekenleri bu rehberde topladık. Marmaris, Göcek ve Fethiye rotaları için ideal seyahat taktikleri burada.",
    sections: [
      {
        title: "Gulet seçerken nelere dikkat etmeli?",
        paragraphs: [
          "Kişi sayısına göre kabin planı, klima ve duş olanaklarını gözden geçirin. Mürettebat profili ve referanslarını mutlaka sorun.",
          "Rotaya göre tekne boyutu değişebilir; dar koylara girecek rotalarda daha küçük guletler tercih edin.",
        ],
      },
      {
        title: "Rota planlama",
        paragraphs: [
          "Göcek koyları için 4-5 günlük rotalar idealdir. Marmaris&apos;ten çıkacaksanız Datça Yarımadası&apos;nı dahil ederek plan yapın.",
          "Her gün için yüzme, keşif ve yemek molalarını dengeleyen bir akış oluşturun.",
        ],
      },
      {
        title: "Bavul hazırlığı",
        paragraphs: [
          "Teknede yer kısıtlı olduğundan yumuşak bavul tercih edin. Gündüz için keten, akşam için hafif triko öneriyoruz.",
          "Güneş koruyucu, deniz gözlüğü ve kaymaz sandalet mutlaka listede olsun.",
        ],
      },
    ],
    tips: [
      "Gulet şefine sevdiğiniz kahvaltılıkları önceden ileterek menüleri kişiselleştirin.",
      "Gün batımlarını izlemek için hafif bir şal bulundurun; rüzgâr serin olabiliyor.",
      "Snorkel ve deniz oyuncağı gibi ekipmanları tekne rezervasyonunda talep edin.",
    ],
  },
  {
    ...getBase("datca-zeytin-rotasi"),
    heroImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    intro:
      "Datça&apos;da zeytin hasadı dönemine özel hazırlanan bu deneyimde yerel üreticilerle tanışacak, badem bahçelerinde yürüyüş yapacak ve gurme sofralarda buluşacaksınız.",
    sections: [
      {
        title: "Hasat sabahı",
        paragraphs: [
          "Sabah erken saatlerde zeytin bahçesine giderek üreticilerle tanışın, toplama tekniklerini öğrenin.",
          "Güneş yükselirken badem bahçesinde kısa bir yürüyüşle mola verin.",
        ],
      },
      {
        title: "Atölyeler ve tadımlar",
        paragraphs: [
          "Taş baskı zeytinyağı atölyesinde ilk sıkım sürecine tanıklık edin.",
          "Öğle yemeğinde soğuk sıkım yağlarla hazırlanan meze ve salataların tadını çıkarın.",
        ],
      },
      {
        title: "Akşam deneyimi",
        paragraphs: [
          "Eski Datça sokaklarında butik şarap tadımı yapın ve geceyi mandalina kokteylleriyle kapatın.",
        ],
      },
    ],
    tips: [
      "Hasat günlerinde rahat giysiler ve güneş koruması şart.",
      "Atölye sonrası tadımlarda ürünlerden satın alarak üreticileri destekleyin.",
    ],
  },
  {
    ...getBase("marmaris-yeni-oteller"),
    heroImage:
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1800&q=80",
    intro:
      "Marmaris&apos;te 2025 sezonuna damga vuracak yeni butik otelleri keşfedin. Her biri benzersiz tasarım ve deneyim vaat ediyor.",
    sections: [
      {
        paragraphs: [
          "Selimiye&apos;de denize sıfır, 12 odalı yeni açılan tesis, sürdürülebilir malzemelerle tasarlanmış.",
          "Bozburun&apos;da yalnızca yetişkinlere hizmet veren konsept otel, misafirlerine özel tekne turları sunuyor.",
        ],
      },
      {
        title: "Mimari detaylar",
        paragraphs: [
          "Minimalist çizgilerle yerel taş ve ahşabın birleştiği odalar, açık duş alanları sunuyor.",
          "Spa alanlarında yöresel bitki yağlarıyla yapılan terapi seansları öne çıkıyor.",
        ],
      },
      {
        title: "Rezervasyon ipuçları",
        paragraphs: [
          "Yaz sezonu için en az iki ay önceden rezervasyon öneriyoruz.",
          "Mayıs ve Eylül dönemi hem hava hem kalabalık açısından en ideal zaman.",
        ],
      },
    ],
  },
  {
    ...getBase("fethiye-dalis-deneyimi"),
    heroImage:
      "https://images.unsplash.com/photo-1544551763-ceda7fbaf902?auto=format&fit=crop&w=1800&q=80",
    intro:
      "Fethiye&apos;de dalışa yeni başlayanlar için MyTrip eğitmenlerinin hazırladığı beş adımlı rehber ile güvenle su altını keşfedin.",
    sections: [
      {
        title: "Hazırlık",
        paragraphs: [
          "Teorik eğitimle başlayın ve ekipman tanıtımını eğitmen eşliğinde tamamlayın.",
          "Sığ suda pratik yaparak maske temizleme ve dengeleme tekniklerini öğrenin.",
        ],
      },
      {
        title: "İlk dalış noktaları",
        paragraphs: [
          "Afkule ve Dalyan koyu, yeni başlayanlar için ideal görüş alanı sunar.",
          "Deniz kaplumbağaları ve renkli mercanları gözlemlemek için sabah saatlerini tercih edin.",
        ],
      },
      {
        title: "Dalış sonrası",
        paragraphs: [
          "Deniz sonrası hafif yemekler seçin, bol su tüketin.",
          "Gün batımında sahil yürüyüşü ile günü tamamlayın.",
        ],
      },
    ],
    tips: [
      "Dalıştan 12 saat öncesinde alkol almamaya özen gösterin.",
      "Yanınızda yedek maske kayışı ve kulak tıkacı bulundurun.",
    ],
  },
];

export const BLOG_POST_DETAILS_BY_SLUG = new Map(
  BLOG_POST_DETAILS.map((detail) => [detail.slug, detail]),
);
