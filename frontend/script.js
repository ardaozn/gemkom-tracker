/* =========================================
   Gemkom - Makine Not Takip Sistemi
   Frontend JavaScript
   ========================================= */
const API_BASE_URL = 'https://gemkom-tracker-171910651490.europe-west1.run.app/api';

// ---- DOM Elements ----
const form = document.getElementById('add-note-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');
const machineSelect = document.getElementById('machine');
const tbody = document.getElementById('notes-tbody');
const recordCountEl = document.getElementById('record-count');

const filterMachine = document.getElementById('filter-machine');
const filterDate = document.getElementById('filter-date');
const filterStatus = document.getElementById('filter-status');
const resetFiltersBtn = document.getElementById('reset-filters');

const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');
const toastIconEl = document.getElementById('toast-icon');
const themeToggle = document.getElementById('theme-toggle');

// Set today's date
document.getElementById('date').valueAsDate = new Date();

// Status labels
const statusLabels = {
    'working': 'Çalışıyor',
    'waiting': 'Beklemede',
    'maintenance_needed': 'Bakım Gerekli'
};

let machinesData = [];
let toastTimeout = null;

const addMachineForm = document.getElementById('add-machine-form');
const addMachineBtn  = document.getElementById('add-machine-btn');
const machineNameInput = document.getElementById('machine-name');
const machineCodeInput = document.getElementById('machine-code');

// =========================================
//  localStorage — SADECE YEDEK olarak kullanılır
//  Asıl kayıt artık backend'de (is_completed, is_canceled)
// =========================================
const PROGRESS_KEY = 'gemkom-progress';
function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch { return {}; }
}
function saveProgress(data) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

// =========================================
//  Theme Toggle
// =========================================
function initTheme() {
    const saved = localStorage.getItem('gemkom-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gemkom-theme', next);
    lucide.createIcons();
});

// =========================================
//  Init
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    lucide.createIcons();
    initApp();
});

async function initApp() {
    await fetchMachines();
    fetchSummary();
    fetchNotes();
    startProgressUpdater();
}

// =========================================
//  Toast
// =========================================
function showToast(message, type = 'success') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMsg.textContent = message;
    toastIconEl.innerHTML = type === 'success'
        ? '<i data-lucide="check-circle"></i>'
        : '<i data-lucide="alert-circle"></i>';
    toastEl.className = 'toast' + (type === 'error' ? ' error' : '');
    lucide.createIcons({ nodes: [toastEl] });
    toastTimeout = setTimeout(() => toastEl.classList.add('hidden'), 3000);
}

// =========================================
//  API: Machines
// =========================================
async function fetchMachines() {
    try {
        const res = await fetch(`${API_BASE_URL}/machines/`);
        if (res.ok) {
            machinesData = await res.json();
            populateDropdowns(machinesData);
            renderMachineList(machinesData);
            submitBtn.disabled = false;
        }
    } catch (e) {
        console.error('Makineler yüklenemedi:', e);
    }
}

// =========================================
//  Render Machine List (with delete)
// =========================================
function renderMachineList(machines) {
    const container = document.getElementById('machine-list');
    if (!container) return;
    if (machines.length === 0) {
        container.innerHTML = '';
        return;
    }
    let html = '<div class="machine-chips">';
    machines.forEach(m => {
        html += `
            <div class="machine-chip">
                <span class="machine-chip-name">${m.name}</span>
                <span class="machine-chip-code">${m.code}</span>
                <button class="machine-chip-delete" onclick="deleteMachine(${m.id}, '${m.name.replace(/'/g, "\\'")}')"
                        title="Makineyi Sil">
                    <i data-lucide="trash-2" style="width:13px;height:13px"></i>
                </button>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
    lucide.createIcons({ nodes: [container] });
}

// =========================================
//  Delete Machine
// =========================================
async function deleteMachine(id, name) {
    if (!confirm(`"${name}" makinesini silmek istediğinize emin misiniz?\nBu makineye ait tüm notlar da silinebilir!`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/machines/${id}/`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            showToast(`"${name}" silindi.`);
            await fetchMachines();
            fetchNotes();
        } else {
            showToast('Makine silinemedi!', 'error');
        }
    } catch {
        showToast('Bağlantı hatası!', 'error');
    }
}

// =========================================
//  API: Add Machine
// =========================================
addMachineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = machineNameInput.value.trim();
    const code = machineCodeInput.value.trim();
    if (!name || !code) return;

    const addMachineBtnText   = addMachineBtn.querySelector('.btn-text');
    const addMachineBtnLoader = addMachineBtn.querySelector('.btn-loader');
    addMachineBtn.disabled = true;
    addMachineBtnText.classList.add('hidden');
    addMachineBtnLoader.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE_URL}/machines/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, code })
        });
        if (res.ok) {
            showToast(`"${name}" makinesi eklendi!`);
            addMachineForm.reset();
            await fetchMachines();
        } else {
            const err = await res.json().catch(() => ({}));
            const msg = err.code ? `Kod: ${err.code[0]}` : (err.name ? err.name[0] : 'Makine eklenemedi!');
            showToast(msg, 'error');
        }
    } catch {
        showToast('Bağlantı hatası!', 'error');
    } finally {
        addMachineBtn.disabled = false;
        addMachineBtnText.classList.remove('hidden');
        addMachineBtnLoader.classList.add('hidden');
    }
});

function populateDropdowns(machines) {
    let opts = '';
    machines.forEach(m => {
        opts += `<option value="${m.id}">${m.name} (${m.code})</option>`;
    });
    machineSelect.innerHTML = '<option value="" disabled selected>Makine seçiniz...</option>' + opts;
    filterMachine.innerHTML = '<option value="">Tüm Makineler</option>' + opts;
}

// =========================================
//  API: Summary
// =========================================
async function fetchSummary() {
    try {
        const res = await fetch(`${API_BASE_URL}/summary/`);
        if (res.ok) {
            const data = await res.json();
            animateCount('count-working', data.working || 0);
            animateCount('count-waiting', data.waiting || 0);
            animateCount('count-maintenance', data.maintenance_needed || 0);
            if (data.total_lost_hours !== undefined) {
                animateCount('count-lost-hours', parseFloat(data.total_lost_hours) || 0, true);
            }
        }
    } catch (e) {
        console.error('Özet yüklenemedi:', e);
    }
}

function animateCount(elId, target, isFloat = false) {
    const el = document.getElementById(elId);
    if (!el) return;
    const start = parseFloat(el.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();
    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;
        el.textContent = isFloat ? current.toFixed(1) : Math.round(current);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// =========================================
//  API: Notes
// =========================================
async function fetchNotes() {
    try {
        const params = new URLSearchParams();
        if (filterMachine.value) params.append('machine', filterMachine.value);
        if (filterDate.value) params.append('date', filterDate.value);
        if (filterStatus.value) {
            if (filterStatus.value === 'completed') {
                params.append('is_completed', 'true');
            } else if (filterStatus.value === 'canceled') {
                params.append('is_canceled', 'true');
            } else {
                params.append('status', filterStatus.value);
                params.append('is_completed', 'false');
                params.append('is_canceled', 'false');
            }
        }

        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(`${API_BASE_URL}/notes/${qs}`);

        if (res.ok) {
            const data = await res.json();
            renderTable(data);
            recordCountEl.textContent = `${data.length} kayıt`;
        }
    } catch (e) {
        console.error('Notlar yüklenemedi:', e);
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p class="empty-state-text">Backend bağlantısı kurulamadı.</p></div></td></tr>`;
    }
}

// =========================================
//  Progress Color (Red → Orange → Green)
// =========================================
function getProgressColor(percent) {
    const p = Math.min(100, Math.max(0, percent));
    if (p <= 50) {
        const g = Math.round(50 + (170 * p / 50));
        return `rgb(220, ${g}, 30)`;
    } else {
        const r = Math.round(220 - (190 * (p - 50) / 50));
        const g = Math.round(220 - (20 * (p - 50) / 50));
        const b = Math.round(30 + (50 * (p - 50) / 50));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// =========================================
//  Render Table
// =========================================
function renderTable(notes) {
    if (notes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p class="empty-state-text">Kayıt bulunamadı. Yukarıdaki formu kullanarak yeni not ekleyebilirsiniz.</p></div></td></tr>`;
        return;
    }

    // localStorage yedek verisi (geriye dönük uyumluluk için)
    const progressData = loadProgress();
    let html = '';

    notes.forEach(note => {
        const dateStr = new Date(note.date).toLocaleDateString('tr-TR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const mName = note.machine_details ? note.machine_details.name : '—';
        const mCode = note.machine_details ? note.machine_details.code : '';
        const lostHours = note.lost_hours ? `${note.lost_hours}s` : '—';
        const lostClass = note.lost_hours ? 'lost-hours-cell' : '';

        // ─────────────────────────────────────────────────────────────
        //  İlerleme durumunu belirle:
        //  1. Backend'den gelen is_completed / is_canceled → EN GÜVENİLİR
        //  2. localStorage yedek (eski notlar için geriye uyumluluk)
        // ─────────────────────────────────────────────────────────────
        const localProg = progressData[note.id] || {};

        const isCompleted = note.is_completed === true || localProg.completed === true;
        const isCanceled  = note.is_canceled  === true || localProg.canceled  === true
                            || (note.description && note.description.toLowerCase().includes('iptal'));

        // estimated_hours: backend öncelikli, yoksa localStorage yedek
        const backendEst = parseFloat(note.estimated_hours);
        const localEst   = parseFloat(localProg.estimatedHours);
        const estHours   = (backendEst > 0) ? backendEst : (localEst > 0 ? localEst : 0);

        // Başlangıç zamanı: her zaman created_at
        const startTime = new Date(note.created_at).getTime();

        // ─────────────────────────────────────────────────────────────
        //  İlerleme HTML'i oluştur
        // ─────────────────────────────────────────────────────────────
        let progressHtml = '';

        if (isCompleted) {
            // Tamamlandı — estimated_hours olsun olmasın göster
            progressHtml = `
                <div class="mini-progress">
                    <div class="mini-progress-track">
                        <div class="mini-progress-fill" style="width:100%;background:#22c55e"></div>
                    </div>
                    <span class="mini-progress-label" style="color:#22c55e">✓ Tamamlandı</span>
                    <div style="display:flex;gap:4px;width:48px;flex-shrink:0;"></div>
                </div>`;
        } else if (isCanceled) {
            // İptal edildi — estimated_hours olsun olmasın göster
            progressHtml = `
                <div class="mini-progress">
                    <div class="mini-progress-track">
                        <div class="mini-progress-fill" style="width:100%;background:#ef4444"></div>
                    </div>
                    <span class="mini-progress-label" style="color:#ef4444">✕ İptal Edildi</span>
                    <div style="display:flex;gap:4px;width:48px;flex-shrink:0;"></div>
                </div>`;
        } else if (estHours > 0) {
            // Aktif ilerleme barı
            const totalPausedMs = localProg.totalPausedMs || 0;
            const pausedAt = localProg.pausedAt || null;

            let elapsedMs = Date.now() - startTime;
            elapsedMs -= totalPausedMs;
            if (pausedAt) {
                elapsedMs -= (Date.now() - pausedAt);
            }
            elapsedMs = Math.max(0, elapsedMs);

            const elapsedHours = elapsedMs / 3600000;
            const percent = Math.min((elapsedHours / estHours) * 100, 100);
            const color = getProgressColor(percent);
            const pctText = percent.toFixed(0);

            progressHtml = `
                <div class="mini-progress">
                    <div class="mini-progress-track">
                        <div class="mini-progress-fill" id="mbar-${note.id}"
                             data-start="${startTime}"
                             data-est="${estHours}"
                             data-paused-ms="${totalPausedMs}"
                             data-paused-at="${pausedAt ? pausedAt : ''}"
                             style="width:${percent}%;background:${color}"></div>
                    </div>
                    <span class="mini-progress-label" id="mpct-${note.id}" style="color:${color}">${pctText}%</span>
                    <div style="display:flex;gap:4px">
                        <button class="btn-finish-mini" onclick="finishProgress(${note.id})" title="İşi Bitir">
                            <i data-lucide="check" style="width:12px;height:12px;color:#22c55e"></i>
                        </button>
                        <button class="btn-finish-mini" onclick="cancelProgress(${note.id})" title="İptal Et">
                            <i data-lucide="x" style="width:12px;height:12px;color:#ef4444"></i>
                        </button>
                    </div>
                </div>`;
        } else {
            progressHtml = `<span class="no-progress">—</span>`;
        }

        // ---- Status dropdown ----
        let selectElement = '';
        if (isCompleted) {
            selectElement = `
                <select class="status-select completed" disabled>
                    <option selected>Tamamlandı</option>
                </select>
            `;
        } else if (isCanceled) {
            selectElement = `
                <select class="status-select canceled" disabled>
                    <option selected>İptal Edildi</option>
                </select>
            `;
        } else {
            const statusOptions = `
                <option value="working"             ${note.status === 'working' ? 'selected' : ''}>Çalışıyor</option>
                <option value="waiting"             ${note.status === 'waiting' ? 'selected' : ''}>Beklemede</option>
                <option value="maintenance_needed"  ${note.status === 'maintenance_needed' ? 'selected' : ''}>Bakım Gerekli</option>`;
            selectElement = `
                <select class="status-select ${note.status}" onchange="updateNoteStatus(${note.id}, this.value)">
                    ${statusOptions}
                </select>
            `;
        }

        html += `
            <tr>
                <td class="date-cell">${dateStr}</td>
                <td class="machine-cell">${mName}<span class="machine-code">${mCode}</span></td>
                <td>
                    ${selectElement}
                </td>
                <td class="description-cell" title="${note.description}">${note.description}</td>
                <td class="progress-cell">${progressHtml}</td>
                <td class="${lostClass}">${lostHours}</td>
                <td>
                    <button class="btn-delete" onclick="deleteNote(${note.id})" title="Sil">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>`;
    });

    tbody.innerHTML = html;
    lucide.createIcons({ nodes: [tbody] });
}

// =========================================
//  Update Note Status (PATCH)
// =========================================
async function updateNoteStatus(noteId, newStatus) {
    // ----------------------------------------------
    // İlerlemeyi Dondurma Mantığı (LocalStorage)
    // ----------------------------------------------
    const data = loadProgress();
    if (!data[noteId]) data[noteId] = { totalPausedMs: 0 };
    if (data[noteId].totalPausedMs === undefined) data[noteId].totalPausedMs = 0;
    
    const isNowPaused = newStatus === 'waiting' || newStatus === 'maintenance_needed';
    
    // Eğer önceden duraklatıldıysa ve şimdi devam ediyorsa, geçen süreyi totalPausedMs'e ekle
    if (!isNowPaused && data[noteId].pausedAt) {
        data[noteId].totalPausedMs += (Date.now() - data[noteId].pausedAt);
        data[noteId].pausedAt = null;
    } 
    // Eğer önceden çalışıyorsa ve şimdi duraklatıldıysa, pausedAt anını kaydet
    else if (isNowPaused && !data[noteId].pausedAt) {
        data[noteId].pausedAt = Date.now();
    }
    saveProgress(data);

    try {
        const res = await fetch(`${API_BASE_URL}/notes/${noteId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showToast(`Durum güncellendi: ${statusLabels[newStatus]}`);
            fetchSummary();
            fetchNotes();
        } else {
            showToast('Durum güncellenemedi!', 'error');
            fetchNotes();
        }
    } catch (e) {
        showToast('Bağlantı hatası!', 'error');
        fetchNotes();
    }
}

// =========================================
//  Finish Progress
//  Backend'e PATCH + localStorage yedek
// =========================================
async function finishProgress(noteId) {
    if (!confirm('İşi bitirmek istediğinize emin misiniz?')) return;

    // önce UI'ı hemen güncelle (optimistik)
    const data = loadProgress();
    if (!data[noteId]) data[noteId] = {};
    data[noteId].completed  = true;
    data[noteId].canceled   = false;
    data[noteId].completedAt = Date.now();
    saveProgress(data);

    // backend'e kaydet
    try {
        await fetch(`${API_BASE_URL}/notes/${noteId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: true, is_canceled: false })
        });
    } catch (e) {
        console.warn('Backend güncellenemedi, localStorage yedekte:', e);
    }

    showToast('İş tamamlandı! ✓');
    fetchNotes();
}

// =========================================
//  Cancel Progress
//  Backend'e PATCH + localStorage yedek
// =========================================
async function cancelProgress(noteId) {
    if (!confirm('İşi iptal etmek istediğinize emin misiniz?')) return;

    // önce UI'ı hemen güncelle (optimistik)
    const data = loadProgress();
    if (!data[noteId]) data[noteId] = {};
    data[noteId].canceled  = true;
    data[noteId].completed = false;
    saveProgress(data);

    // backend'e kaydet
    try {
        await fetch(`${API_BASE_URL}/notes/${noteId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_canceled: true, is_completed: false })
        });
    } catch (e) {
        console.warn('Backend güncellenemedi, localStorage yedekte:', e);
    }

    showToast('İş iptal edildi.');
    fetchNotes();
}

// =========================================
//  Create Note
// =========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    const formData = Object.fromEntries(new FormData(form).entries());
    if (!formData.lost_hours) delete formData.lost_hours;

    const estimatedHoursVal = parseFloat(document.getElementById('estimated_hours').value);
    if (estimatedHoursVal && estimatedHoursVal > 0) {
        formData.estimated_hours = estimatedHoursVal;  // FormData'da name attr olmadığı için elle ekliyoruz
    } else {
        delete formData.estimated_hours;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/notes/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            const newNote = await res.json();

            // localStorage'a da yedek olarak kaydet (geriye uyumluluk)
            if (newNote.estimated_hours) {
                const progressData = loadProgress();
                if (!progressData[newNote.id]) {
                    progressData[newNote.id] = {
                        completed: false,
                        canceled: false,
                        completedAt: null,
                        estimatedHours: parseFloat(newNote.estimated_hours),
                        startTime: new Date(newNote.created_at).getTime()
                    };
                    saveProgress(progressData);
                }
            }

            form.reset();
            document.getElementById('date').valueAsDate = new Date();
            fetchSummary();
            fetchNotes();
            showToast('Not başarıyla kaydedildi!');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(Object.values(err).flat().join(', ') || 'Kayıt başarısız', 'error');
        }
    } catch (e) {
        showToast('Sunucu bağlantı hatası!', 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
});

// =========================================
//  Delete Note
// =========================================
async function deleteNote(id) {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/notes/${id}/`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            const progressData = loadProgress();
            delete progressData[id];
            saveProgress(progressData);
            showToast('Not silindi.');
            fetchSummary();
            fetchNotes();
        } else {
            showToast('Silme başarısız!', 'error');
        }
    } catch (e) {
        showToast('Bağlantı hatası!', 'error');
    }
}

// =========================================
//  Filters
// =========================================
filterMachine.addEventListener('change', fetchNotes);
filterDate.addEventListener('change', fetchNotes);
filterStatus.addEventListener('change', fetchNotes);

resetFiltersBtn.addEventListener('click', () => {
    filterMachine.value = '';
    filterDate.value = '';
    filterStatus.value = '';
    fetchNotes();
});

// =========================================
//  Live Progress Updater (every second)
//  Reads start/est from data-* attributes
// =========================================
function startProgressUpdater() {
    setInterval(() => {
        document.querySelectorAll('.mini-progress-fill[data-start]').forEach(barEl => {
            const startTime  = parseInt(barEl.dataset.start, 10);
            const estHours   = parseFloat(barEl.dataset.est);
            if (!startTime || !estHours) return;

            const totalPausedMs = parseInt(barEl.dataset.pausedMs, 10) || 0;
            const pausedAt = parseInt(barEl.dataset.pausedAt, 10) || null;

            let elapsedMs = Date.now() - startTime;
            
            // Daha önceden olan duraklamaları çıkar
            elapsedMs -= totalPausedMs;
            
            // Eğer şu an duraklatılmışsa, duraklama anından şu ana kadar geçen süreyi de çıkar
            if (pausedAt) {
                 elapsedMs -= (Date.now() - pausedAt);
            }
            elapsedMs = Math.max(0, elapsedMs);

            const elapsedHours = elapsedMs / 3600000;
            const percent      = Math.min((elapsedHours / estHours) * 100, 100);
            const color        = getProgressColor(percent);

            barEl.style.width      = `${percent}%`;
            barEl.style.background = color;

            const noteId = barEl.id.replace('mbar-', '');
            const pctEl  = document.getElementById(`mpct-${noteId}`);
            if (pctEl) { pctEl.textContent = `${percent.toFixed(0)}%`; pctEl.style.color = color; }
        });
    }, 1000);
}
