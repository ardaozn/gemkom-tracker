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

// ---- Progress Tracking (localStorage) ----
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
            submitBtn.disabled = false;
        }
    } catch (e) {
        console.error('Makineler yüklenemedi:', e);
    }
}

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
        if (filterStatus.value) params.append('status', filterStatus.value);

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

    const statusIcons = {
        'working': 'settings',
        'waiting': 'clock',
        'maintenance_needed': 'wrench'
    };

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

        // ---- Progress bar ----
        const prog = progressData[note.id];
        let progressHtml = '';

        if (prog) {
            let percent;
            if (prog.completed) {
                percent = 100;
            } else if (prog.canceled) {
                percent = Math.min(((Date.now() - prog.startTime) / 3600000 / prog.estimatedHours) * 100, 100);
            } else {
                const elapsedHours = (Date.now() - prog.startTime) / 3600000;
                percent = Math.min((elapsedHours / prog.estimatedHours) * 100, 100);
            }

            const color = getProgressColor(percent);
            const pctText = percent.toFixed(0);

            if (prog.completed) {
                progressHtml = `
                    <div class="mini-progress">
                        <div class="mini-progress-track">
                            <div class="mini-progress-fill" style="width:100%;background:#22c55e"></div>
                        </div>
                        <span class="mini-progress-label" style="color:#22c55e">✓ ${pctText}%</span>
                        <div style="display:flex;gap:4px;width:48px;flex-shrink:0;"></div>
                    </div>`;
            } else if (prog.canceled) {
                progressHtml = `
                    <div class="mini-progress">
                        <div class="mini-progress-track">
                            <div class="mini-progress-fill" style="width:100%;background:#ef4444"></div>
                        </div>
                        <span class="mini-progress-label" style="color:#ef4444">✕ İptal</span>
                        <div style="display:flex;gap:4px;width:48px;flex-shrink:0;"></div>
                    </div>`;
            } else {
                const safeDesc = note.description.replace(/'/g, "\\'");
                progressHtml = `
                    <div class="mini-progress">
                        <div class="mini-progress-track">
                            <div class="mini-progress-fill" id="mbar-${note.id}" style="width:${percent}%;background:${color}"></div>
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
            }
        } else {
            progressHtml = `<span class="no-progress">—</span>`;
        }

        // ---- Status dropdown ----
        const isCompleted = prog && prog.completed;
        const isCanceled = (prog && prog.canceled) || (note.description && note.description.toLowerCase().includes('iptal'));

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
// =========================================
function finishProgress(noteId) {
    if (!confirm('İşi bitirmek istediğinize emin misiniz?')) return;
    const data = loadProgress();
    if (data[noteId]) {
        data[noteId].completed = true;
        data[noteId].completedAt = Date.now();
        saveProgress(data);
        showToast('İş tamamlandı! ✓');
        fetchNotes();
    }
}

// =========================================
//  Cancel Progress (sadece local — açıklamaya yazı eklenmez)
// =========================================
function cancelProgress(noteId) {
    if (!confirm('İşi iptal etmek istediğinize emin misiniz?')) return;
    const data = loadProgress();
    if (data[noteId]) {
        data[noteId].canceled = true;
        saveProgress(data);
        showToast('İş iptal edildi.');
        fetchNotes();
    }
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

    const estimatedHours = parseFloat(document.getElementById('estimated_hours').value);
    delete formData.estimated_hours;

    try {
        const res = await fetch(`${API_BASE_URL}/notes/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            const newNote = await res.json();

            if (estimatedHours && estimatedHours > 0) {
                const progressData = loadProgress();
                progressData[newNote.id] = {
                    estimatedHours,
                    startTime: Date.now(),
                    completed: false,
                    canceled: false,
                    completedAt: null
                };
                saveProgress(progressData);
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
// =========================================
function startProgressUpdater() {
    setInterval(() => {
        const progressData = loadProgress();
        for (const [noteId, prog] of Object.entries(progressData)) {
            if (prog.completed || prog.canceled) continue;

            const elapsedHours = (Date.now() - prog.startTime) / 3600000;
            const percent = Math.min((elapsedHours / prog.estimatedHours) * 100, 100);
            const color = getProgressColor(percent);

            const barEl = document.getElementById(`mbar-${noteId}`);
            const pctEl = document.getElementById(`mpct-${noteId}`);
            if (barEl) { barEl.style.width = `${percent}%`; barEl.style.background = color; }
            if (pctEl) { pctEl.textContent = `${percent.toFixed(0)}%`; pctEl.style.color = color; }
        }
    }, 1000);
}
