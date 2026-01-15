export default function BookingsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-3xl font-bold">Rezervasyonlarım</h1>
        <p className="text-muted-foreground">
          Henüz bir rezervasyonunuz bulunmuyor.
        </p>
        <div className="mt-8 rounded-lg border border-dashed p-12">
          <p className="mb-4 text-lg">
            İlk seyahatinizi planlamaya hazır mısınız?
          </p>
          <a
            href="/places"
            className="inline-block rounded-full bg-primary px-6 py-3 text-white transition hover:bg-primary/90"
          >
            Yerleri Keşfet
          </a>
        </div>
      </div>
    </div>
  );
}
