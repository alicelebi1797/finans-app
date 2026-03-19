export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground">Sayfa bulunamadı</p>
        <a href="/" className="text-primary hover:underline mt-4 inline-block">Anasayfaya dön</a>
      </div>
    </div>
  );
}
