# Gemkom Makine Takip Sistemi

Bu uygulama, fabrika ve atölye ortamındaki makinelerin günlük durumunu, arıza kayıtlarını ve iş süreçlerini kolayca takip etmeniz için geliştirilmiştir.

**Uygulamaya Git:** [https://ardaozn.github.io/gemkom-tracker/](https://ardaozn.github.io/gemkom-tracker/)

---

## 📌 Ne İşe Yarar?

*   Makinelerin o anki durumunu (Çalışıyor, Beklemede, Arızalı vb.) anlık olarak izlemenizi sağlar.
*   İşlerin ne kadar sürede tamamlanacağını takip etmenize yardımcı olur.
*   Arıza nedeniyle kaybedilen toplam iş saatlerini hesaplar.
*   Geçmişe dönük kayıtları arşivler ve ihtiyacınız olduğunda hızlıca bulmanızı sağlar.

---

## 🖱️ Nasıl Kullanılır?

### 1. Yeni Not Ekleme
Ekranın üst kısmındaki formu doldurarak kayıt ekleyebilirsiniz:
- **Makine:** Listeden ilgili makineyi seçin.
- **Tahmini Süre:** İşin kaç saat süreceğini girin (bu, ilerleme çubuğunu başlatır).
- **Kayıp Saat:** Varsa zaman kaybını girin.
- **Not Ekle:** Butona bastığınızda kayıt tabloya eklenir.

### 2. Durum Güncelleme
Tabloda listelenen bir kaydın durumunu değiştirmek için:
- "Durum" sütunundaki kutucuğa tıklayın.
- Yeni durumu (Çalışıyor / Beklemede / Bakım Gerekli) seçin. Değişiklik anında kaydedilir.

### 3. İlerleme Takibi
Tahmini süre girilen işlerin yanında bir **İlerleme Çubuğu** belirir:
- İş bittiğinde yanındaki **✓ (Yeşil)** butonuna basarak "Tamamlandı" yapabilirsiniz.
- İşten vazgeçildiğinde **✕ (Kırmızı)** butonu ile iptal edebilirsiniz.

### 4. Kayıt Silme
Bir kaydı tamamen kaldırmak için satırın en sağındaki **🗑️ (Çöp Kutusu)** ikonuna tıklamanız ve onay vermeniz yeterlidir.

### 5. Filtrelemek
Çok fazla kayıt olduğunda aradığınızı bulmak için tablonun üstündeki filtre alanlarını kullanın:
- Sadece belirli bir **makineyi** seçebilir,
- Belirli bir **tarihe** bakabilir,
- Veya sadece **"Arızalı"** olanları listeleyebilirsiniz.

---

## 🏗️ Proje Mimarisi ve Teknolojiler

Bu proje, modern web geliştirme standartlarına uygun olarak tasarlanmış iki ana katmandan oluşmaktadır:

*   **Frontend (Arayüz):** Kullanıcı etkileşimleri için herhangi bir kütüphane/çerçeve kullanılmadan tamamen **Vanilla HTML, CSS ve JavaScript** ile donatılmıştır. Veri akışı `Fetch API` aracılığıyla sağlanır. GitHub Pages üzerinde barındırılmaktadır.
*   **Backend (Sunucu):** Güçlü bir temel sunan **Python, Django ve Django REST Framework (DRF)** kullanılarak geliştirilmiştir. Tüm veri işleme mantığı ve API uçları bu katmandadır. Google Cloud Run üzerinde çalışmaktadır.
*   **Veritabanı:** Bulut tabanlı, ölçeklenebilir ve güvenli **Supabase PostgreSQL** üzerine kuruludur.

---

## 📡 API Uçları (Endpoints)

Bu uygulama ile konuşmak isteyen herhangi bir istemci (client) için aşağıdaki açık API uçları tasarlanmıştır:

| Metod | İstek Adresi (URL) | Ne İşe Yarar? |
| :--- | :--- | :--- |
| **GET** | `/api/machines/` | Sistemde kayıtlı olan tüm makinelerin listesini kodlarıyla birlikte getirir. |
| **GET** | `/api/notes/` | Atılmış olan tüm günlük makine notlarını listeler (tarih, durum, makine bazlı filtrelenebilir). |
| **POST** | `/api/notes/` | Sisteme yepyeni bir makine notu ekler. |
| **PATCH** | `/api/notes/{id}/` | Var olan bir notun güncel durumunu (ör. Çalışıyor -> Beklemede) değiştirir. |
| **DELETE** | `/api/notes/{id}/` | Hatalı veya istenmeyen bir not kaydını sistemden tamamen siler. |
| **GET** | `/api/summary/` | Arka planda tüm istatistikleri (aktif, bekleyen ve toplam kayıp saat) hesaplayıp tek bir özet paketi olarak sunar. |
| **POST** | `/api/internal/daily-check/` | Cloud Scheduler tarafından her gece tetiklenip rutin kontrollerin yapılmasını sağlar. |
