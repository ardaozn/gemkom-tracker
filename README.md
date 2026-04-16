# Günlük Makine Not Takip Uygulaması

Bu proje stajyer görevi kapsamında geliştirilmiş olup, makinelerin günlük durumlarını (Çalışıyor, Beklemede, Bakım Gerekli vb.) ve notları takip etmenizi sağlayan uçtan uca bir sistemdir.

## Kullanılan Teknolojiler
- **Backend:** Python, Django, Django REST Framework, WhiteNoise (Static dosyalar için)
- **Veritabanı:** Supabase PostgreSQL
- **Frontend:** Vanilla HTML, CSS (Modern & Responsive UI), JavaScript (Fetch API)
- **Deployment:** Google Cloud Run (Backend), GitHub Pages (Frontend)

## 1. Lokal Kurulum Adımları (Yerel Bilgisayarda Çalıştırma)

### A. Backend Kurulumu
1. Bilgisayarınızda Python yüklü olduğundan emin olun.
2. Terminal (veya Komut İstemi) üzerinden proje dizinindeki `backend` klasörüne girin:
   ```bash
   cd backend
   ```
3. Sanal ortam (venv) oluşturun ve aktif edin:
   ```bash
   python -m venv venv
   # Windows için:
   venv\Scripts\activate
   # Mac/Linux için:
   source venv/bin/activate
   ```
4. Gerekli kütüphaneleri kurun:
   ```bash
   pip install -r requirements.txt
   ```
5. `.env` Dosyası Ayarları:
   `backend/.env` dosyası içindeki `[YOUR-PASSWORD]` yazan yere kendi Supabase veritabanı şifrenizi girdiğinizden emin olun. (Ayrıca URL'nin `postgresql://` ile başladığından emin olun).
   
6. Veritabanını hazırlayın (Supabase tablolarını oluşturur):
   ```bash
   python manage.py makemigrations tracker
   python manage.py migrate
   ```
7. Arka plan uygulamasını başlatın:
   ```bash
   python manage.py runserver
   ```
   API artık `http://127.0.0.1:8000/api/` adresinde çalışıyor olacaktır.

### B. Frontend Kurulumu
Frontend için herhangi bir kütüphane/paket kurulumu gerekmez. Sadece `frontend` klasörü içindeki `index.html` dosyasına çift tıklayarak modern tarayıcınızda açmanız yeterlidir. (Eğer backend yerel sunucusunu başlattıysanız, arayüz anında backend ile haberleşmeye başlayacaktır).
*Not: API bağlantı adresini `script.js` dosyasının ilk satırındaki `API_BASE_URL` değişkeninden yönetebilirsiniz.*

---

## 2. GitHub & Versiyon Kontrolü (Zorunlu İstekler)

Stajyer görevinin beklentisi olan **Branch (Dal) kullanımı, anlamlı commitler ve Pull Request** işlemleri için aşağıdaki adımları bilgisayarınızda git yüklüyken uygulayınız:

1. Proje ana klasöründe `git init` yapıp repoyu başlatın.
2. İlk commit'iniz:
   ```bash
   git add .
   git commit -m "initial project setup and structure"
   ```
3. Feature branch oluşturun:
   ```bash
   git checkout -b feature/frontend-api-integration
   # ufak bir değişiklik yapıp kaydedin...
   git add .
   git commit -m "add api integration to frontend"
   ```
4. Main branchine dönüp GitHub'a pushlayınız ve Github arayüzünden Pull Request açınız.

---

## 3. GitHub Pages ile Frontend Deployment

1. Projenizi GitHub'a pushladıktan sonra repository'nizin `Settings > Pages` kısmına gidin.
2. `Source` olarak `Deploy from a branch` seçin ve `main` branch'ini seçerek alt klasör olarak (varsa) `/root` veya `frontend` klasörü ayarlamanızı yapın (GitHub Pages genelde root dizinindeki index.html'ye bakar. `frontend` dosyalarınızı root'a almanız GH Pages için en kolayıdır).
3. Sayfa URL'nizi alın.

---

## 4. Google Cloud Run ile Backend Deployment

1. Google Cloud Console'da Cloud Run hizmetine gidin.
2. `backend` klasörümüzde hazır bir `Dockerfile` bulunmaktadır.
3. Reponuzu Cloud Run'a bağlayın (veya Google Build ile docker imajını pushlayın).
4. Container Environment Variables kısmına şu değişkenleri ekleyin:
   - `DATABASE_URL` = `postgresql://postgres:VERITABANISIFRENIZ@db...supabase.co:5432/postgres`
   - `SECRET_KEY` = `rastgele_guvenli_bir_metin`
   - `DEBUG` = `False`
5. Deploy butonuna tıklayın ve size verilen URL'yi alın.
6. **ÖNEMLİ:** Cloud Run URL'sini aldıktan sonra projenin `frontend/script.js` dosyasındaki `API_BASE_URL` adresini bu URL ile güncelleyin (`https://projeurlaniz.run.app/api`).

---

## 5. Bonus Görev: Cloud Scheduler

Backend kodumuzda günlük kontrol yapabilmesi için `/api/internal/daily-check/` POST endpoint'i hazır tanımlanmıştır! (Dosya: `backend/tracker/views.py` içerisinde `daily_check` metodu)
Cloud Scheduler üzerinde:
- **Frequency:** `0 0 * * *` (Her gün gece 12)
- **Target:** HTTP
- **URL:** `[CLOUD_RUN_URL]/api/internal/daily-check/`
- **Metod:** `POST`
olarak ayarlayıp görevi başarıyla tamamlayabilirsiniz.
