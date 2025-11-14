export interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  authorId: string
  authorName: string
  authorEmail: string
  authorAvatar?: string
  category: "travel" | "food" | "culture" | "history" | "activity" | "lifestyle" | "business"
  tags: string[]
  status: "published" | "draft" | "archived" | "pending_review"
  featured: boolean
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  views: number
  readTime: number
  likeCount: number
  commentCount: number
  shareCount: number
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  featuredImage?: string
  images: string[]
  language: "tr" | "en"
  readingLevel: "easy" | "medium" | "hard"
  targetAudience: "travelers" | "locals" | "business_owners" | "all"
}

export const blogCategories = [
  { value: "all", label: "Tüm Kategoriler" },
  { value: "travel", label: "Seyahat" },
  { value: "food", label: "Yemek" },
  { value: "culture", label: "Kültür" },
  { value: "history", label: "Tarih" },
  { value: "activity", label: "Aktiviteler" },
  { value: "lifestyle", label: "Yaşam Tarzı" },
  { value: "business", label: "İş" },
]

export const blogStatuses = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "published", label: "Yayında" },
  { value: "draft", label: "Taslak" },
  { value: "pending_review", label: "İnceleme Bekliyor" },
  { value: "archived", label: "Arşivlendi" },
]

export const languages = [
  { value: "all", label: "Tüm Diller" },
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
]

export const targetAudiences = [
  { value: "all", label: "Tüm Kitleler" },
  { value: "travelers", label: "Seyahatçiler" },
  { value: "locals", label: "Yerel Halk" },
  { value: "business_owners", label: "İşletme Sahipleri" },
]

export const mockBlogs: Blog[] = [
  {
    id: "1",
    title: "Bodrum'un Gizli Koyları: Keşfedilmemiş Cennetler",
    slug: "bodrumun-gizli-koylari-kesfedilmemis-cennetler",
    excerpt: "Bodrum'un turist kalabalığından uzak, saklı kalmış koylarını keşfe çıkın. Bu yazıda size sadece yerlerin bilgisini vereceğim, aynı zamanda bu koylara nasıl ulaşabileceğinizi de anlatacağım.",
    content: `Bodrum'un popüler plajları herkes tarafından bilinir, ancak yarımadının gerçek hazineleri genellikle saklı kalır. İşte yerel halkın bile az bildiği o büyüleyici koylar...

## Kargıcak Koyu
Bodrum'un en güney ucunda yer alan bu koy, sakinliği ve temizliği ile ünlüdür. Mavi bayraklı plajı, zeytin ağaçları arasında kaybolur ve yazın bile kalabalık olmaz.

## Akvaryum Koyu
Adından da anlaşılacağı gibi, suyunun berraklığıyla göz kamaştıran bu koy, şnorkelle dalış için mükemmeldir. Koyun tabanındaki kayıklar, suyun rengini akvaryum gibi gösterir.

## Pabuçburnu
Turgutreis'in hemen yanında yer alan bu koy, batış manzarasıyla ünlüdür. Gün batımını izlemek için en iyi noktalardan biridir...`,
    authorId: "1",
    authorName: "Ahmet Yılmaz",
    authorEmail: "ahmet@example.com",
    authorAvatar: "/avatars/user1.jpg",
    category: "travel",
    tags: ["bodrum", "koyler", "plajlar", "gezilecek-yerler", "deniz"],
    status: "published",
    featured: true,
    publishedAt: new Date("2024-11-01"),
    createdAt: new Date("2024-10-25"),
    updatedAt: new Date("2024-11-01"),
    views: 15420,
    readTime: 8,
    likeCount: 342,
    commentCount: 28,
    shareCount: 89,
    seoTitle: "Bodrum'un Gizli Koyları 2024 | Keşfedilmemiş Plajlar",
    seoDescription: "Bodrum'un turist kalabalığından uzak, saklı kalmış koylarını keşfedin. Kargıcak, Akvaryum, Pabuçburnu ve daha fazlası.",
    seoKeywords: ["bodrum koyleri", "bodrum plajları", "ege koyleri", "saklı koyler", "bodrum gezilecek yerler"],
    featuredImage: "/blogs/bodrum-koyleri-featured.jpg",
    images: ["/blogs/kargicak.jpg", "/blogs/akvaryum-koyu.jpg", "/blogs/pabucburnu.jpg"],
    language: "tr",
    readingLevel: "easy",
    targetAudience: "travelers"
  },
  {
    id: "2",
    title: "Marmaris'e Özel: Deniz Mahsülleri Rehberi",
    slug: "marmaris-deniz-mahsulleri-rehberi",
    excerpt: "Ege Denizi'nin taze lezzetlerini sunan Marmaris restoranlarında hangi deniz ürünlerini denemelisiniz? İşte yerel halkın tavsiye ettiği en iyi lezzetler.",
    content: `Marmaris sadece tatil cenneti değil, aynı zamanda deniz ürünleri tutkunları için bir cennettir. Ege Denizi'nin taze balıkları ve deniz ürünleri, şehfinin ellerinde unutulmaz lezzetlere dönüşür...

## Lüfer
Ege'nin en lezzetli balıklarından biri olan lüfer, özellikle ızgarada harikadır. Marmaris'in balıkçılarında sabah saatlerinde taze olarak bulunur.

## Kalamar
Taze kalamar, Marmaris restoranlarının vazgeçilmezidir. İster kızartma ister ızgara olarak tüketebilirsiniz...`,
    authorId: "4",
    authorName: "Zeynep Çelik",
    authorEmail: "zeynep@example.com",
    authorAvatar: "/avatars/user4.jpg",
    category: "food",
    tags: ["marmaris", "deniz-urunleri", "restaurant", "yemek", "ege-mutfagi"],
    status: "published",
    featured: true,
    publishedAt: new Date("2024-10-28"),
    createdAt: new Date("2024-10-20"),
    updatedAt: new Date("2024-10-28"),
    views: 8765,
    readTime: 6,
    likeCount: 189,
    commentCount: 15,
    shareCount: 45,
    seoTitle: "Marmaris Deniz Mahsülleri Rehberi 2024",
    seoDescription: "Marmaris'te hangi deniz ürünlerini denemelisiniz? Yerel restoranların en iyi lezzetleri.",
    featuredImage: "/blogs/marmaris-deniz-urunleri.jpg",
    images: ["/blogs/lufer.jpg", "/blogs/kalamar.jpg", "/blogs/istakoz.jpg"],
    language: "tr",
    readingLevel: "medium",
    targetAudience: "travelers"
  },
  {
    id: "3",
    title: "Fethiye'den Dalyan'a: Tarihi Kaunos Yolculuğu",
    slug: "fethiyeden-dalyana-tarihi-kaunos-yolculugu",
    excerpt: "Binlerce yılın izini süren Dalyan Kaunos Antik Kenti'ne yapacağınız yolculuk, size sadece tarih değil, aynı zamanda doğanın büyüsünü de sunacak.",
    content: `Dalyan, sadece İztuzu Plajı'nın kaplumbağalarıyla değil, aynı zamanda M.Ö. 9. yüzyılda kurulan Kaunos Antik Kenti ile de ünlüdür...

## Kaunos Antik Kenti'nin Tarihi
Kauros'un kızı Kaunos tarafından kurulan şehir, antik dönemin önemli liman kentlerinden biriydi. Karya'nın en önemli kentlerinden olan Kaunos, aynı zamanda önemli bir ticaret merkeziydi.

## Kaya Mezarları
Denizden yaklaşık 200 metre yükseklikteki kayalara oyulmuş bu mezarlar, Lidya krallarına aittir. Özellikle gün batımında ortaya çıkan silüetleri büyüleyicidir...`,
    authorId: "10",
    authorName: "Murat Demir",
    authorEmail: "murat@example.com",
    authorAvatar: "/avatars/user6.jpg",
    category: "history",
    tags: ["dalyan", "kaunos", "antik-kent", "tarih", "kaya-mezarlari"],
    status: "published",
    featured: false,
    publishedAt: new Date("2024-10-15"),
    createdAt: new Date("2024-10-10"),
    updatedAt: new Date("2024-10-15"),
    views: 12340,
    readTime: 10,
    likeCount: 267,
    commentCount: 34,
    shareCount: 67,
    seoTitle: "Kaunos Antik Kenti Tarihi | Dalyan Gezi Rehberi",
    seoDescription: "Dalyan Kaunos Antik Kenti'nin tarihi, kaya mezarları ve gezilecek yerleri hakkında detaylı bilgi.",
    featuredImage: "/blogs/kaunos-antik-kenti.jpg",
    images: ["/blogs/kaunos-tiyatro.jpg", "/blogs/kaya-mezarlari.jpg", "/blogs/dalyan-marina.jpg"],
    language: "tr",
    readingLevel: "hard",
    targetAudience: "all"
  },
  {
    id: "4",
    title: "Ölüdeniz Paragliding: Adrenalin Dolu Bir Deneyim",
    slug: "oludeniz-paragliding-adrenalin-dolu-bir-deneyim",
    excerpt: "Dünyanın en güzel iniş yaptığı yerlerden biri olan Ölüdeniz'de paragliding yapmaya hazır mısınız? İşte bilmeniz gereken her şey.",
    content: `Ölüdeniz, sadece turkuaz sularıyla değil, aynı zamanda Baba Dağı'ndan yapılan paragliding uçuşlarıyla da ünlüdür. Mavi ve yeşilin iç içe geçtiği bu eşsiz deneyim...`,
    authorId: "9",
    authorName: "Selin Korkmaz",
    authorEmail: "selin@example.com",
    authorAvatar: "/avatars/user11.jpg",
    category: "activity",
    tags: ["oludeniz", "paragliding", "adrenalin", "baba-dagi", "fethiye"],
    status: "published",
    featured: true,
    publishedAt: new Date("2024-11-05"),
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-05"),
    views: 28900,
    readTime: 7,
    likeCount: 423,
    commentCount: 56,
    shareCount: 156,
    seoTitle: "Ölüdeniz Paraglading Rehberi 2024 | Fiyatlar ve İpuçları",
    seoDescription: "Ölüdeniz'de paragluding yapmaya hazır mısınız? Fiyatlar, güvenlik ipuçları ve rezervasyon bilgileri.",
    featuredImage: "/blogs/oludeniz-paragliding.jpg",
    images: ["/blogs/baba-dagi.jpg", "/blogs/oludeniz-havuz.jpg", "/blogs/paragliding-ucus.jpg"],
    language: "tr",
    readingLevel: "medium",
    targetAudience: "travelers"
  },
  {
    id: "5",
    title: "Turistik İşletmeler İçin Dijital Pazarlama Stratejileri",
    slug: "turistik-isletmeler-icin-dijital-pazarlama-stratejileri",
    excerpt: "Muğla bölgesindeki işletmenizin dijital varlığını güçlendirmek için etkili pazarlama stratejileri ve uygulama ipuçları.",
    content: `Turizm sektöründe rekabet her geçen gün artarken, dijital pazarlama stratejileri işletmeler için hayati önem taşıyor. Özellikle Muğla gibi popüler turistik destinasyonlarda...`,
    authorId: "7",
    authorName: "Fatma Yıldız",
    authorEmail: "fatma@example.com",
    authorAvatar: "/avatars/user5.jpg",
    category: "business",
    tags: ["dijital-pazarlama", "turizm", "isletme", "sosyal-medya", "seo"],
    status: "draft",
    featured: false,
    createdAt: new Date("2024-11-10"),
    updatedAt: new Date("2024-11-12"),
    views: 0,
    readTime: 12,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    seoTitle: "Turistik İşletmeler Dijital Pazarlama Rehberi 2024",
    seoDescription: "Turizm işletmeleri için etkili dijital pazarlama stratejileri ve uygulama önerileri.",
    featuredImage: "/blogs/dijital-pazarlama.jpg",
    images: ["/blogs/sosyal-medya.jpg", "/blogs/seo-analizi.jpg"],
    language: "tr",
    readingLevel: "hard",
    targetAudience: "business_owners"
  },
  {
    id: "6",
    title: "Muğla'nın Yerel Lezzetleri: Geleneksel Tarifler",
    slug: "muglanin-yerel-lezzetleri-geleneksel-tarifler",
    excerpt: "Ege'nin zengin mutfak kültürünü yansıtan Muğla'nın geleneksel lezzetlerini ve ev yapımı tariflerini keşfedin.",
    content: `Muğla mutfakları, sadece yemek değil, aynı zamanda bir kültür mirasıdır. Nesiller boyu aktarılan tarifler, zeytinyağının sihirli dokunuşuyla buluşur...`,
    authorId: "2",
    authorName: "Ayşe Demir",
    authorEmail: "ayse@example.com",
    authorAvatar: "/avatars/user2.jpg",
    category: "food",
    tags: ["mugla-mutfagi", "yerel-lezzetler", "ege-mutfagi", "geleneksel-tarifler", "zeytinyagli"],
    status: "published",
    featured: false,
    publishedAt: new Date("2024-11-08"),
    createdAt: new Date("2024-11-05"),
    updatedAt: new Date("2024-11-08"),
    views: 5678,
    readTime: 9,
    likeCount: 145,
    commentCount: 23,
    shareCount: 34,
    seoTitle: "Muğla'nın Yerel Lezzetleri | Geleneksel Ege Mutfağı",
    seoDescription: "Muğla'nın geleneksel lezzetleri, ev yapımı tarifler ve Ege mutfağının en özel yemekleri.",
    featuredImage: "/blogs/mugla-yemekleri.jpg",
    images: ["/blogs/cerkez-musakka.jpg", "/blogs/muğla-çorbası.jpg", "/blogs/zeytinyagli-sarmalar.jpg"],
    language: "tr",
    readingLevel: "medium",
    targetAudience: "all"
  },
  {
    id: "7",
    title: "Saklıkent Kanyonu: Doğa Sporcuları İçin Cennet",
    slug: "saklikent-kanyonu-doga-sporculari-icin-cennet",
    excerpt: "Türkiye'nin en uzun kanyonunda doğa yürüyüşü, kano ve tırmanış gibi birçok spor aktivitesini aynı anda deneyimleyin.",
    content: `Saklıkent Kanyonu, sadece bir doğa harikası değil, aynı zamanda doğa sporları tutkunları için bir oyun alanıdır...`,
    authorId: "12",
    authorName: "Hüseyin Gül",
    authorEmail: "huseyin@example.com",
    authorAvatar: "/avatars/user12.jpg",
    category: "activity",
    tags: ["saklikent", "kanyon", "doga-yuruyusu", "doga-sporlari", "kano"],
    status: "published",
    featured: false,
    publishedAt: new Date("2024-11-12"),
    createdAt: new Date("2024-11-08"),
    updatedAt: new Date("2024-11-12"),
    views: 3456,
    readTime: 8,
    likeCount: 98,
    commentCount: 12,
    shareCount: 23,
    seoTitle: "Saklıkent Kanyonu Doğa Sporları Rehberi 2024",
    seoDescription: "Saklıkent Kanyonu'nda yapabileceğiniz doğa sporları, aktiviteler ve güvenlik ipuçları.",
    featuredImage: "/blogs/saklikent-kanyonu-spor.jpg",
    images: ["/blogs/kanyon-yuruyusu.jpg", "/blogs/kano-aktivitesi.jpg", "/blogs-kanyon-tirmanisi.jpg"],
    language: "tr",
    readingLevel: "medium",
    targetAudience: "travelers"
  },
  {
    id: "8",
    title: "Gümüşlük Sanat Galerileri: Bozca'da Sanatla Buluşma",
    slug: "gumusluk-sanat-galerileri-bozcada-sanatla-bulusma",
    excerpt: "Bodrum Gümüşlük'ün sanat dolu sokaklarında gezinirken, bölgenin en iyi sanat galerilerini ve yerel sanatçıların çalışmalarını keşfedin.",
    content: `Gümüşlük, sadece balık restoranları ve deniz manzarasıyla değil, aynı zamanda sanat galerileriyle de ünlüdür...`,
    authorId: "11",
    authorName: "Elif Aksoy",
    authorEmail: "elif@example.com",
    authorAvatar: "/avatars/user9.jpg",
    category: "culture",
    tags: ["gumusluk", "sanat-galerileri", "bodrum-sanati", "yerel-sanatcilar", "kultur"],
    status: "pending_review",
    featured: false,
    createdAt: new Date("2024-11-12"),
    updatedAt: new Date("2024-11-13"),
    views: 0,
    readTime: 6,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    seoTitle: "Gümüşlük Sanat Galerileri ve Bodrum Sanat Rehberi",
    seoDescription: "Gümüşlük'teki en iyi sanat galerileri, yerel sanatçılar ve Bodrum sanat sahnesi hakkında bilgiler.",
    featuredImage: "/blogs/gumusluk-sanat.jpg",
    images: ["/blogs/sanat-galerisi.jpg", "/blogs/yerel-sanatci.jpg"],
    language: "tr",
    readingLevel: "easy",
    targetAudience: "travelers"
  },
  {
    id: "9",
    title: "Muğla'nın Saklı Kalmış Plajları: Kalabalıktan Uzak",
    slug: "muglanin-sakli-kalmis-plajlari-kalabaliktan-uzak",
    excerpt: "Popüler plajların dışında, Muğla'nın hala saklı kalmış sakin ve doğal plajlarını keşfedin. İşte yerel halkın mekanı bile paylaşmadığı o özel koyler.",
    content: `Muğla'nın plajları herkes tarafından bilinen Ölüdeniz veya İztuzu ile sınırlı değil. Bölgede hala keşfedilmeyi bekleyen, kalabalıktan uzak, sakin plajlar var...`,
    authorId: "3",
    authorName: "Mehmet Kaya",
    authorEmail: "mehmet@example.com",
    authorAvatar: "/avatars/user3.jpg",
    category: "travel",
    tags: ["mugla-plajlari", "sakli-plajlar", "kalabaliktan-uzak", "dogal-plajlar", "koyler"],
    status: "archived",
    featured: false,
    publishedAt: new Date("2024-08-15"),
    createdAt: new Date("2024-08-10"),
    updatedAt: new Date("2024-10-20"),
    views: 18900,
    readTime: 7,
    likeCount: 234,
    commentCount: 19,
    shareCount: 45,
    seoTitle: "Muğla'nın Saklı Plajları 2024 | Kalabalıktan Uzak Koyler",
    seoDescription: "Muğla'nın turist kalabalığından uzak, hala saklı kalmış doğal plajları ve koyları keşfedin.",
    featuredImage: "/blogs/sakli-plajlar.jpg",
    images: ["/blogs/kargicak-plaji.jpg", "/blogs/kum-yaka-plaji.jpg", "/blogs/cennet-koyu.jpg"],
    language: "tr",
    readingLevel: "easy",
    targetAudience: "travelers"
  },
  {
    id: "10",
    title: "Bodrum'da Sürdürülebilir Turizm: Gelecek İçin Adımlar",
    slug: "bodrumda-surdurulebilir-turizm-gelecek-icin-adimlar",
    excerpt: "Bodrum'un doğal ve kültürel mirasını korurken turizmi sürdürülebilir hale getirmek için atılması gereken adımlar ve başarılı örnekler.",
    content: `Bodrum, Türkiye'nin en popüler turistik destinasyonlarından biri, ancak bu popülerlik doğal ve kültürel miras üzerinde baskı oluşturuyor...`,
    authorId: "4",
    authorName: "Zeynep Çelik",
    authorEmail: "zeynep@example.com",
    authorAvatar: "/avatars/user4.jpg",
    category: "lifestyle",
    tags: ["surdurulebilir-turizm", "bodrum", "cevre-koruma", "ekolojik-turizm", "gelecek"],
    status: "published",
    featured: false,
    publishedAt: new Date("2024-11-10"),
    createdAt: new Date("2024-11-05"),
    updatedAt: new Date("2024-11-10"),
    views: 4567,
    readTime: 11,
    likeCount: 167,
    commentCount: 28,
    shareCount: 56,
    seoTitle: "Bodrum Sürdürülebilir Turizm 2024 | Çevre Koruma Projeleri",
    seoDescription: "Bodrum'de sürdürülebilir turizm uygulamaları, çevre koruma projeleri ve ekolojik turizm örnekleri.",
    featuredImage: "/blogs/surdurulebilir-turizm.jpg",
    images: ["/blogs/temiz-deni.jpg", "/blogs/ekolojik-otel.jpg", "/blogs/koru-alani.jpg"],
    language: "tr",
    readingLevel: "hard",
    targetAudience: "all"
  }
]