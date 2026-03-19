# Finansal Yönetim Uygulaması

## Proje Özeti
Türkçe kişisel finans yönetim uygulaması. Express.js backend + React frontend + PostgreSQL veritabanı.

## Kullanıcı Bilgileri
- **Kullanıcı adı:** kalicelebi
- **Şifre:** kalicelebi
- **Kart PIN:** 1888 (cüzdan kartları ve kredi kartı görüntüleme için)

## Mimari
- **Frontend:** React + Vite + TailwindCSS + shadcn/ui
- **Backend:** Express.js + TypeScript
- **Veritabanı:** PostgreSQL (Drizzle ORM)
- **Oturum:** express-session + connect-pg-simple
- **AI:** OpenAI GPT-4o (Replit AI entegrasyonu)

## Sayfalar & Navigasyon
- `/` — Dashboard: Harcama kutusu (tam genişlik, net bakiye + eldeki para), gelir bildirimleri, gider listesi (güne göre sıralı, ödendi en sona), döviz kurları, AI danışman
- `/management` — Yönetim: Eldeki Para kutusu (en üstte, manuel düzeltme), Sabit Gelirler/Giderler (gizlenebilir), kredi kartları (SwipeRow), krediler (SwipeRow, taksit bilgisi), beklenen gelirler "Hesaba Dahil Et"
- `/wallet` — Cüzdan: Birikimlerim → IBAN'larım → Harici Birikimler (sırayla, Kartlarım kaldırıldı)
- `/reports` — Raporlar: İnfografik görünüm, yazdırılabilir
- ChatWidget — Masaüstünde sağ alt köşe floating; mobilde 5. nav sekmesi "Asistan"
- **Görünen ad:** "Ali Çelebi" (kullanıcı adı kalicelebi)

## Özellikler
1. **Kimlik Doğrulama** - Oturum tabanlı giriş/çıkış
2. **Gider Yönetimi** (4 kategori):
   - Sabit Giderler (gizlenebilir, sola kaydır: düzenle/sil)
   - Geçici Giderler (sola kaydır: düzenle/sil)
   - Kredi Kartları (kart görünümü, PIN ile numara gizleme, sola kaydır, checkbox yok)
   - Krediler (taksit bilgisi + IBAN, sola kaydır, progress bar yok, checkbox yok)
3. **Gelir Yönetimi** (3 kategori):
   - Sabit Gelirler (gizlenebilir, sola kaydır: düzenle/sil)
   - Geçici Gelirler (sola kaydır: düzenle/sil)
   - Beklenen Gelirler ("Hesaba Dahil Et" butonu, doğru endpoint: /approve)
4. **Cüzdan** (3 sekme, sıralı):
   - Birikimlerim (USD/EUR/GOLD, ondalıklı giriş, toplam TL)
   - IBAN'larım (ekle/düzenle/sil/kopyala)
   - Harici Birikimler (eski Aile Birikimi - babam için altın, gram bazlı, TL değeri belirgin)
5. **Dashboard**:
   - Harcama kutusu: tam genişlik, tahmini net + "Elde: X TL" küçük detay
   - Giderler: güne göre sıralı (küçük gün numarası önce), ödenenler en sona
   - Gelir bildirimleri: onay kartı hâlâ Dashboard'da
   - Hızlı Harcama Ekle: Gün alanı var, kullanıcı günü değiştirebilir
   - Gecikmiş badge mobilde gizli (hidden sm:flex)
   - projectedIncome = sadece alınmış gelirler (receivedIncome)
   - cashOnHand = receivedIncome - paidExpenses - bu ay birikimler (TL) + cashAdjustment
6. **Eldeki Para** (Yönetim sayfası): onaylı gelir - ödenen gider + manuel düzeltme (cashAdjustment)
7. **Raporlar**: Aylık gelir-gider dökümü, net bakiye, yazdır butonu, birikim geçmişi bölümü
8. **Floating Chat Widget**: GPT-4o finansal danışman
9. **Birikim İşlemleri**: Birikim eklendiğinde otomatik TL karşılığı hesaplanarak kayıt oluşturulur

## Veritabanı Tabloları
- users (monthlyBudget, cashAdjustment dahil)
- fixed_expenses, variable_expenses, credit_card_expenses (cvv dahil), loans
- fixed_incomes, variable_incomes, expected_incomes
- wallets (eski, aktif kullanılmıyor)
- ibans (userId, title, iban)
- wallet_cards (userId, cardName, cardNumber, cardExpiry, cardType, bankName)
- savings (userId, currency: USD|EUR|GOLD, amount)
- savings_transactions (userId, title, amountTL, currency, amount, date) — birikim geçmişi
- user_sessions (express-session store)

## API Endpointleri
- POST/GET /api/auth/login|logout|me, PUT /api/auth/me
- CRUD /api/fixed-expenses, /api/variable-expenses, /api/credit-cards, /api/loans
- CRUD /api/fixed-incomes, /api/variable-incomes, /api/expected-incomes
- PUT /api/expected-incomes/:id/approve
- GET/PUT /api/wallets (eski)
- GET/POST/DELETE /api/ibans
- GET/POST/DELETE /api/wallet-cards
- GET /api/savings, PUT /api/savings/:currency (birikim kaydı otomatik oluşur)
- GET /api/savings-transactions, DELETE /api/savings-transactions/:id
- GET /api/exchange-rates (USD/EUR/Altın, 5 dk cache)
- POST /api/chat (GPT-4o)

## Kur Kaynakları
- USD/TRY & EUR/TRY: open.er-api.com
- Gram Altın/TRY: Yahoo Finance (GC=F / troy oz → gram dönüşüm)

## UI/UX Kuralları
- Silme işlemlerinde ConfirmModal (browser confirm() YOK)
- Ödeme işaretlemede onay YOK (direkt toggle)
- Yönetim'de gider kartlarında sol yuvarlaKta kategori ikonu
- Kart numarası PIN 1888 olmadan gizli
- Light/Dark mode desteği
- Framer-motion sayfa geçiş animasyonları
