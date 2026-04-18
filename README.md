# Gemkom Makine Takip Sistemi

## Proje Aciklamasi
Bu proje, makine calisma durumunu kaydetmek ve filtrelemek gibi operasyonlari hizli bir sekilde gerceklestirmeyi saglayan bir web uygulamasidir. Amaci, makineler icin gunluk durum notlarinin girilmesini ve goruntulenmesini saglamaktir. Projenin backend tarafinda Python tabanli Django REST Framework, frontend tarafinda ise herhangi bir framework olmadan sadece Vanilla JavaScript, HTML ve CSS kullanilmistir. Veritabani olarak Supabase (PostgreSQL) yapilandirilmistir.

## Lokal Kurulum Adimlari

Projeyi bilgisayarinizda calistirmak icin asagidaki adimlari izleyebilirsiniz. Proje "frontend" ve "backend" olarak iki ana dizine ayrilmistir.

### Gereksinimler
- Python 3.10 veya uzeri
- Git

### Backend Kurulumu
1. Repoyu bilgisayariniza klonlayin:
   ```bash
   git clone https://github.com/ardaozn/gemkom-tracker.git
   cd gemkom-tracker/backend
   ```
2. Sanal ortami (virtual environment) olusturun ve aktif edin:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows icin: venv\Scripts\activate
   ```
3. Gerekli paketleri yukleyin:
   ```bash
   pip install -r requirements.txt
   ```
4. Supabase bilgilerinin bulundugu .env dosyanizin "backend" dizininde olduguna emin olduktan sonra veritabani tablolarini olusturun:
   ```bash
   python manage.py migrate
   ```
5. Sunucuyu baslatin:
   ```bash
   python manage.py runserver
   ```
   API artik "http://localhost:8000/api/" adresinde calismaktadir.

### Frontend Kurulumu
1. "frontend" dizinine gidin.
2. "index.html" dosyasini herhangi bir web tarayicisinda dogrudan acabilir veya "Live Server" tarzi bir lokal sunucu ile acabilirsiniz.
3. Lokal gelistirme sirasinda backend ile iletisim kurmak icin "script.js" icerisindeki API_BASE_URL degiskenini "http://localhost:8000/api" olarak degistirmelisiniz. (Remote yayinda bu alan Cloud Run adresiniz olarak kalmalidir).

## Environment Variable (Cevre Degiskenleri) Aciklamalari

Uygulamanin arka yuzu icin guvenli bir sekilde yonetilmesi gereken yapilandirmalar ".env" dosyasi ile yonetilmektedir. Asagidaki degiskenler konfigurasyon icin kullanilmaktadir:

- DATABASE_URL: Veritabani islemlerini yonetebilmek icin gerekli olan Supabase PostgreSQL baglanti dizesi.
- SECRET_KEY: Django projesine ozel uretilmis ve guvenlik islemleri (ornek olarak parola hashlama) icin kullanilan gizli kimliklik anahtari.
- DEBUG: Uygulamanin gelistirme modunda mi yoksa canli modda mi calisacagini belirler. Sistemde hata yonetiminin nasil gosterilecegine karar verdirtir. (Lokalde True, canli platformda eksiksiz guvenlik icin False olmalidir).

## Supabase Baglanti Ayarlari

Projeyi veritabanina baglamak icin Supabase projenizden aldiginiz PostgreSQL baglanti url'sini backend dizininde yer alan ".env" dosyasina asagidaki formati kullanarak eklemelisiniz:

```properties
DATABASE_URL=postgresql://[kullaniciadi]:[sifre]@[ilgili-host].supabase.co:5432/postgres
SECRET_KEY=django-insecure-gizli-anahtariniz
DEBUG=True
```
Bu ayarlar uygulandiktan sonra, Django otomatik olarak Supabase uzerinden okuma ve yazma islemlerine baslayacaktir.

## Backend'i Cloud Run'a Deploy Etme Adimlari

Sunucu tarafina ait uygulamayi paylasima acmak icin Google Cloud Run ortaminda konumlandirabilirsiniz:

1. Gcloud komut satiri aracina ilgili Google hesabi ile islem yapabilmek uzere giris yapilir:
   ```bash
   gcloud auth login
   ```
2. Terminal uzerinden backend klasorune gecis yapilir:
   ```bash
   cd backend
   ```
3. Cloud Build ile proje imaji build edilerek Container Registry'e gonderilir:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJE_ID]/gemkom-tracker --project [PROJE_ID]
   ```
4. Container Registry'deki derlenmis bu yapi Google Cloud Run uzerine Deploy edilir:
   ```bash
   gcloud run deploy gemkom-tracker --image gcr.io/[PROJE_ID]/gemkom-tracker --region europe-west1 --allow-unauthenticated --project [PROJE_ID]
   ```
   Not: Veritabani (Supabase) baglantilarinin gecerli ve aktif olmasi adina migrasyon kodu Dockerfile icerisinden calistirilacaktir ("migrate --noinput"). Boylelikle API endpoint'iniz herkese erisilebilir olarak bir servis URL'inde ayaga kalkar.

## Frontend'i GitHub Pages'e Yayinlama Adimlari

Statik dosyalardan olusan kullanici arayuzu, GitHub uzerinde GitHub Pages sistemi kullanilarak yayinlanabilmektedir.

1. Proje dosyalari, icinde frontend klasoru bulunacak sekilde GitHub projesi (repo) olarak gonderilir (Push edilir).
2. Ilgili Repository (depo) icerisinden "Settings" (Ayarlar) menusune gecis yapilir.
3. Sol menuden "Pages" sekmesi isaretlenir.
4. "Build and deployment" kaynak seciminden, branch secenegine tiklanarak "main" ve ardindan ana projedeki klasor yapisina gore dosyalariniz gosterilir (ornek: /root).
5. Secim kaydedildikten hemen sonra GitHub Action calisir, bu operasyon frontend belgelerinizi yayina alir. Projeniz, bir sure sonra olusacak "https://[kullanici_adiniz].github.io/[repo_adiniz]" adresi araciligiyla kullanilabilir hale gelir.
