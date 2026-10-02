/**
 * MediFlow - Doctor Portal & Consultation Management
 * Plain JavaScript (ES6)
 *
 * Implements:
 * - Real optical QR camera scanner with automatic activation and aim reticle
 * - Doctor profile presentation and consultation counters
 * - URL and Token extraction and patient lookups
 * - Viewing comprehensive patient demographics & critical allergy warnings
 * - Recent history with STRICTLY ONLY 2 recent consultations by default + View More expansion
 * - Professional Electronic Health Record (EHR) consultation suite with vitals & Rx prescription builder
 * - Real-time allergy cross-check warnings
 * - Permanent immutable record archival
 */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.getAttribute('data-page');
  const doctorPages = ['doctor-dashboard', 'saved-patients', 'doctor-profile', 'patient-record', 'add-consultation'];
  if (!doctorPages.includes(page)) {
    return;
  }

  const user = AuthSession.getUser();
  if (!user || user.role !== 'ROLE_DOCTOR') {
    sessionStorage.setItem('redirect_after_login', window.location.href);
    window.location.href = '/doctor-login.html';
    return;
  }

  if (page === 'doctor-dashboard') {
    initDoctorDashboard();
  } else if (page === 'saved-patients') {
    initSavedPatientsPage();
  } else if (page === 'doctor-profile') {
    initDoctorProfilePage();
  } else if (page === 'patient-record') {
    initPatientRecordView();
  } else if (page === 'add-consultation') {
    initAddConsultationForm();
  }
});

// Sound confirmation upon successful scan
function playScanSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // Ignore audio permission restrictions
  }
}

function compressDoctorImage(file, maxDimension = 360, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to parse doctor image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function setupDoctorPhotoModal(user, onUpdated) {
  const modal = document.getElementById('doctor-photo-modal');
  if (!modal) return;

  const previewImg = document.getElementById('doctor-modal-photo-preview');
  const fileInput = document.getElementById('doctor-modal-photo-file-input');
  const urlInput = document.getElementById('doctor-modal-photo-url-input');
  const btnPreviewUrl = document.getElementById('btn-preview-doctor-url');
  const btnResetDefault = document.getElementById('btn-reset-default-doctor-photo');
  const btnSave = document.getElementById('btn-save-doctor-photo');
  const btnCancel = document.getElementById('btn-cancel-doctor-photo-modal');
  const btnClose = document.getElementById('btn-close-doctor-photo-modal');
  const statusText = document.getElementById('doctor-modal-photo-status');
  const modalAlert = document.getElementById('doctor-photo-modal-alert');

  let selectedPhoto = user.photoUrl || '';

  const openModal = () => {
    selectedPhoto = user.photoUrl || '';
    if (previewImg) {
      previewImg.src = window.getDoctorPhotoUrl ? window.getDoctorPhotoUrl(user.photoUrl) : (user.photoUrl || window.DEFAULT_DOCTOR_AVATAR);
    }
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (statusText) {
      statusText.textContent = user.photoUrl ? 'Custom Doctor Photo Active' : 'Default Physician Avatar Active';
    }
    if (modalAlert) modalAlert.innerHTML = '';
    modal.style.display = 'flex';
  };

  const closeModal = () => {
    modal.style.display = 'none';
  };

  // Wire opening triggers
  const dashTrigger = document.getElementById('doctor-dash-avatar-trigger');
  if (dashTrigger) dashTrigger.onclick = openModal;

  const btnDashUpdate = document.getElementById('btn-dash-update-doctor-photo');
  if (btnDashUpdate) btnDashUpdate.onclick = openModal;

  const profTrigger = document.getElementById('doctor-avatar-trigger');
  if (profTrigger) profTrigger.onclick = openModal;

  const btnOpenModal = document.getElementById('btn-open-doctor-photo-modal');
  if (btnOpenModal) btnOpenModal.onclick = openModal;

  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // File upload change
  if (fileInput) {
    fileInput.onchange = async () => {
      if (fileInput.files && fileInput.files[0]) {
        try {
          if (modalAlert) modalAlert.innerHTML = '';
          const compressed = await compressDoctorImage(fileInput.files[0], 360, 0.85);
          selectedPhoto = compressed;
          if (previewImg) previewImg.src = compressed;
          if (urlInput) urlInput.value = '';
          if (statusText) statusText.textContent = `Selected: ${fileInput.files[0].name} (Ready to save)`;
        } catch (err) {
          if (modalAlert) {
            modalAlert.innerHTML = `<div class="alert alert-danger" style="margin-bottom: 0.75rem; font-size: 0.85rem;">${escapeHtml(err.message || 'Error processing image')}</div>`;
          }
        }
      }
    };
  }

  // URL preview
  if (btnPreviewUrl && urlInput) {
    btnPreviewUrl.onclick = () => {
      const url = urlInput.value.trim();
      if (!url) return;
      selectedPhoto = url;
      if (previewImg) previewImg.src = url;
      if (fileInput) fileInput.value = '';
      if (statusText) statusText.textContent = 'Previewing image URL (Ready to save)';
    };
  }

  // Reset to default
  if (btnResetDefault) {
    btnResetDefault.onclick = () => {
      selectedPhoto = '';
      if (previewImg) previewImg.src = window.DEFAULT_DOCTOR_AVATAR;
      if (fileInput) fileInput.value = '';
      if (urlInput) urlInput.value = '';
      if (statusText) statusText.textContent = 'Reset to default clean avatar (No random photo)';
    };
  }

  // Save photo
  if (btnSave) {
    btnSave.onclick = async () => {
      setLoading(btnSave, true, 'Saving Photo...');
      try {
        const response = await MediQR_API.request('/doctor/profile/photo', {
          method: 'PUT',
          body: JSON.stringify({ photoUrl: selectedPhoto })
        });

        const updated = response.data;
        user.photoUrl = updated.photoUrl;

        AuthSession.updateUser({ photoUrl: updated.photoUrl });

        const finalPhotoSrc = window.getDoctorPhotoUrl ? window.getDoctorPhotoUrl(updated.photoUrl) : (updated.photoUrl || window.DEFAULT_DOCTOR_AVATAR);
        const lgPhoto = document.getElementById('doctor-profile-photo-lg');
        if (lgPhoto) lgPhoto.src = finalPhotoSrc;
        const dashPhoto = document.getElementById('doctor-dashboard-photo');
        if (dashPhoto) dashPhoto.src = finalPhotoSrc;
        const docPhoto = document.getElementById('doctor-profile-photo');
        if (docPhoto) docPhoto.src = finalPhotoSrc;
        document.querySelectorAll('.doctor-avatar-img').forEach(el => {
          el.src = finalPhotoSrc;
        });

        closeModal();
        const alertTarget = document.getElementById('profile-alert') ? 'profile-alert' : 'doctor-alert';
        showAlert(alertTarget, '✓ Doctor profile photo updated successfully!', 'success');
        if (typeof onUpdated === 'function') onUpdated(updated);
      } catch (err) {
        if (modalAlert) {
          modalAlert.innerHTML = `<div class="alert alert-danger" style="margin-bottom: 0.75rem; font-size: 0.85rem;">${escapeHtml(err.message || 'Failed to update doctor photo')}</div>`;
        } else {
          showAlert('doctor-alert', err.message || 'Failed to update photo', 'danger');
        }
      } finally {
        setLoading(btnSave, false, 'Save Profile Photo');
      }
    };
  }
}

// 1. Doctor Dashboard
async function initDoctorDashboard() {
  const user = AuthSession.getUser();
  if (user) {
    document.querySelectorAll('.doctor-name').forEach(el => el.textContent = user.name || 'Dr. Physician');
    document.querySelectorAll('.doctor-spec').forEach(el => el.textContent = user.specialization || 'Attending Physician');
    document.querySelectorAll('.doctor-hospital').forEach(el => el.textContent = user.hospitalName || 'Medical Center');
    const emailEl = document.getElementById('doctor-email');
    if (emailEl) emailEl.textContent = user.email || 'doctor@hospital.org';

    // Doctor profile photo - clean default avatar, never random unsplash photo
    const doctorSrc = window.getDoctorPhotoUrl ? window.getDoctorPhotoUrl(user.photoUrl) : (user.photoUrl || window.DEFAULT_DOCTOR_AVATAR);
    const photoEl = document.getElementById('doctor-profile-photo');
    if (photoEl) photoEl.src = doctorSrc;
    const dashPhotoEl = document.getElementById('doctor-dashboard-photo');
    if (dashPhotoEl) dashPhotoEl.src = doctorSrc;

    updateDoctorSavedCountBadge();

    // Setup doctor photo modal
    setupDoctorPhotoModal(user);
  }

  // Also refresh doctor data from API
  try {
    const res = await MediQR_API.request('/doctor/profile');
    if (res && res.data) {
      const doc = res.data;
      document.querySelectorAll('.doctor-name').forEach(el => el.textContent = doc.name || 'Dr. Physician');
      document.querySelectorAll('.doctor-spec').forEach(el => el.textContent = doc.specialization || 'Attending Physician');
      document.querySelectorAll('.doctor-hospital').forEach(el => el.textContent = doc.hospitalName || 'Medical Center');
      const emailEl = document.getElementById('doctor-email');
      if (emailEl) emailEl.textContent = doc.email || '';
      const doctorSrc = window.getDoctorPhotoUrl ? window.getDoctorPhotoUrl(doc.photoUrl) : (doc.photoUrl || window.DEFAULT_DOCTOR_AVATAR);
      const photoEl = document.getElementById('doctor-profile-photo');
      if (photoEl) photoEl.src = doctorSrc;
      const dashPhotoEl = document.getElementById('doctor-dashboard-photo');
      if (dashPhotoEl) dashPhotoEl.src = doctorSrc;

      AuthSession.updateUser({
        name: doc.name,
        specialization: doc.specialization,
        hospitalName: doc.hospitalName,
        phone: doc.phone,
        photoUrl: doc.photoUrl
      });
      renderNavbarAuth();
    }
  } catch (e) {
    // ignore
  }

  // The 3 Main Patient-Access Options: Scan QR, Upload QR, Enter Token/URL
  const cardScan = document.getElementById('card-action-scan');
  const cardUpload = document.getElementById('card-action-upload');
  const cardSearch = document.getElementById('card-action-search');

  const cameraModal = document.getElementById('camera-modal-overlay');
  const searchModal = document.getElementById('search-modal-overlay');
  const btnCloseCamera = document.getElementById('btn-close-camera-modal');
  const btnCloseSearch = document.getElementById('btn-close-search-modal');
  const btnCloseWorkbench = document.getElementById('btn-close-patient-workbench');

  // Tab Switching between "View Medical History" and "New Consultation"
  const tabBtnHistory = document.getElementById('tab-btn-view-history');
  const tabBtnConsultation = document.getElementById('tab-btn-new-consultation');
  const contentHistory = document.getElementById('tab-content-history');
  const contentConsultation = document.getElementById('tab-content-consultation');

  window.showHistoryTab = function() {
    tabBtnHistory?.classList.add('active');
    tabBtnConsultation?.classList.remove('active');
    if (contentHistory) contentHistory.style.display = 'block';
    if (contentConsultation) contentConsultation.style.display = 'none';
  };

  window.showConsultationTab = function() {
    tabBtnConsultation?.classList.add('active');
    tabBtnHistory?.classList.remove('active');
    if (contentConsultation) contentConsultation.style.display = 'block';
    if (contentHistory) contentHistory.style.display = 'none';
  };

  tabBtnHistory?.addEventListener('click', window.showHistoryTab);
  tabBtnConsultation?.addEventListener('click', window.showConsultationTab);
  document.getElementById('btn-cancel-consultation')?.addEventListener('click', window.showHistoryTab);

  function openCameraModal() {
    if (cameraModal) cameraModal.style.display = 'flex';
    if (searchModal) searchModal.style.display = 'none';
    const fallbackBox = document.getElementById('camera-fallback-ui');
    if (fallbackBox) fallbackBox.style.display = 'none';
    startCameraScanner();
  }

  function closeCameraModal() {
    if (cameraModal) cameraModal.style.display = 'none';
    stopCameraScanner();
  }

  function openSearchModal() {
    if (searchModal) searchModal.style.display = 'flex';
    if (cameraModal) cameraModal.style.display = 'none';
    if (isCameraRunning) stopCameraScanner();
    setTimeout(() => {
      document.getElementById('qr-token-input')?.focus();
    }, 80);
  }

  function closeSearchModal() {
    if (searchModal) searchModal.style.display = 'none';
  }

  // Option 1: Scan QR (Camera)
  cardScan?.addEventListener('click', openCameraModal);

  // Option 2: Upload QR Image (File upload)
  cardUpload?.addEventListener('click', () => {
    document.getElementById('qr-file-input')?.click();
  });

  // Option 3: Enter Token/URL (Lookup)
  cardSearch?.addEventListener('click', openSearchModal);

  btnCloseCamera?.addEventListener('click', closeCameraModal);
  btnCloseSearch?.addEventListener('click', closeSearchModal);

  // Close modals on clicking background
  cameraModal?.addEventListener('click', (e) => {
    if (e.target === cameraModal) closeCameraModal();
  });
  searchModal?.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearchModal();
  });

  // Close workbench
  btnCloseWorkbench?.addEventListener('click', () => {
    const wb = document.getElementById('active-patient-workbench');
    if (wb) wb.style.display = 'none';
  });

  // Check if patient was requested directly via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const directToken = parsePatientToken(urlParams.get('token'));
  if (directToken) {
    loadPatientWorkspace(directToken);
  }

  // Optical Camera Scanner State
  let html5QrCode = null;
  let isCameraRunning = false;
  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const cameraSelect = document.getElementById('camera-select');
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const scannerLaser = document.getElementById('scanner-laser');
  const scannerReticle = document.getElementById('scanner-target-reticle');
  const cameraStatusMsg = document.getElementById('camera-status-msg');

  // Detect and populate available cameras
  async function refreshCameraList() {
    if (!window.Html5Qrcode || !Html5Qrcode.getCameras) return [];
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        if (cameraSelect) {
          const currentVal = cameraSelect.value;
          cameraSelect.innerHTML = devices.map((d, i) => 
            `<option value="${d.id}">${escapeHtml(d.label || `Camera ${i + 1}`)}</option>`
          ).join('');
          if (currentVal && devices.some(d => d.id === currentVal)) {
            cameraSelect.value = currentVal;
          }
          if (devices.length > 1) {
            cameraSelect.style.display = 'inline-block';
          }
        }
        return devices;
      }
    } catch (e) {
      console.warn('Camera enumeration note:', e);
    }
    return [];
  }

  // Initial attempt to list cameras
  refreshCameraList();

  // If user changes camera from dropdown, switch stream cleanly
  cameraSelect?.addEventListener('change', async () => {
    if (isCameraRunning) {
      await stopCameraScanner();
      await startCameraScanner();
    }
  });

  async function startCameraScanner() {
    clearAlert('doctor-alert');
    if (!window.Html5Qrcode) {
      showAlert('doctor-alert', 'Scanner engine is initializing. Please wait a moment and click again.', 'warning');
      return;
    }

    // Clean up any stale scanner instance
    if (html5QrCode) {
      try {
        if (isCameraRunning) await html5QrCode.stop();
      } catch (e) {}
      try {
        html5QrCode.clear();
      } catch (e) {}
      html5QrCode = null;
    }

    if (cameraStatusMsg) {
      cameraStatusMsg.innerHTML = '<span style="color: var(--primary); font-weight: 600;">Requesting camera stream... Please allow camera access if prompted by your browser.</span>';
    }

    try {
      html5QrCode = new Html5Qrcode("qr-reader");

      const qrConfig = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      // Determine best camera device / constraint
      let targetCamera = null;
      if (cameraSelect && cameraSelect.value) {
        targetCamera = cameraSelect.value;
      } else {
        const devices = await refreshCameraList();
        if (devices && devices.length > 0) {
          // Look for rear/environment camera first
          const rearCam = devices.find(d => (d.label || '').toLowerCase().includes('back') || (d.label || '').toLowerCase().includes('environment'));
          targetCamera = rearCam ? rearCam.id : devices[0].id;
          if (cameraSelect) cameraSelect.value = targetCamera;
        }
      }

      // Try starting scanner with graceful fallback if environment fails on desktop/webcams
      let started = false;

      if (targetCamera) {
        try {
          await html5QrCode.start(targetCamera, qrConfig, onQrCodeSuccessfullyDetected, () => {});
          started = true;
        } catch (camErr) {
          console.warn('Failed with camera ID, falling back to facingMode:', camErr);
        }
      }

      if (!started) {
        // Try environment first (phones), fallback to user (laptops/webcams)
        try {
          await html5QrCode.start({ facingMode: "environment" }, qrConfig, onQrCodeSuccessfullyDetected, () => {});
          started = true;
        } catch (envErr) {
          console.warn('Environment camera unavailable, falling back to user/webcam:', envErr);
          await html5QrCode.start({ facingMode: "user" }, qrConfig, onQrCodeSuccessfullyDetected, () => {});
          started = true;
        }
      }

      isCameraRunning = true;
      if (btnToggleCamera) {
        btnToggleCamera.textContent = '⏹ Stop Camera';
        btnToggleCamera.className = 'btn btn-secondary btn-sm';
      }
      if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
      if (scannerLaser) scannerLaser.style.display = 'block';
      if (scannerReticle) scannerReticle.style.display = 'block';
      if (cameraStatusMsg) cameraStatusMsg.innerHTML = '<span style="color: var(--success); font-weight: 600;">✓ Camera Active. Align patient MediFlow pass in the frame.</span>';

      // Refresh camera dropdown now that permission has been granted
      await refreshCameraList();

      const fallbackBox = document.getElementById('camera-fallback-ui');
      if (fallbackBox) fallbackBox.style.display = 'none';

    } catch (err) {
      isCameraRunning = false;
      console.warn('Camera stream note (handled gracefully):', err ? (err.message || err.name) : 'permission/hardware');
      if (html5QrCode) {
        try { html5QrCode.clear(); } catch (e) {}
        html5QrCode = null;
      }

      if (scannerLaser) scannerLaser.style.display = 'none';
      if (scannerReticle) scannerReticle.style.display = 'none';
      if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';

      let errorMsg = 'Camera permission was not granted or was blocked.';
      if (err && (err.name === 'NotAllowedError' || (err.message && err.message.toLowerCase().includes('permission')))) {
        errorMsg = 'Camera permission was blocked by your browser or environment.';
      } else if (err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
        errorMsg = 'No camera hardware found on this system.';
      } else if (err && err.name === 'NotReadableError') {
        errorMsg = 'Camera is currently in use by another application or tab.';
      }

      showCameraFallback(errorMsg);
    }
  }

  function showCameraFallback(reason) {
    const viewport = document.getElementById('scanner-viewport-box');
    const statusMsg = document.getElementById('camera-status-msg');
    if (!viewport) return;

    let fallbackBox = document.getElementById('camera-fallback-ui');
    if (!fallbackBox) {
      fallbackBox = document.createElement('div');
      fallbackBox.id = 'camera-fallback-ui';
      fallbackBox.style.cssText = 'position: absolute; inset: 0; background: #0f172a; color: #ffffff; padding: 1.5rem; text-align: center; border-radius: 12px; z-index: 25; display: flex; flex-direction: column; align-items: center; justify-content: center;';
      viewport.appendChild(fallbackBox);
    }
    fallbackBox.style.display = 'flex';

    fallbackBox.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.4rem;">📷🚫</div>
      <div style="font-size: 1.05rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.35rem;">
        Camera Access Not Permitted
      </div>
      <p style="font-size: 0.83rem; color: #94a3b8; max-width: 380px; margin-bottom: 1.1rem; line-height: 1.45;">
        ${escapeHtml(reason || 'Browser blocked camera permission or no camera hardware was found.')}
      </p>
      <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; margin-bottom: 1rem;">
        <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('qr-file-input').click()">
          📁 Upload QR Image File
        </button>
        <button type="button" class="btn btn-outline btn-sm" style="color: #ffffff; border-color: #475569;" id="fallback-open-search-btn">
          🔍 Enter Token Code
        </button>
        <button type="button" class="btn btn-sm" style="background: rgba(255,255,255,0.1); color: #e2e8f0;" id="fallback-retry-cam-btn">
          🔄 Retry Camera
        </button>
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 0.65rem; width: 100%; font-size: 0.78rem; color: #94a3b8;">
        Quick Test Sample:
        <button type="button" class="btn-demo-sample" data-token="MEDIQR-PAT-8831-ABCD" style="background: none; border: none; color: #38bdf8; text-decoration: underline; cursor: pointer; font-size: 0.78rem; padding: 0.2rem 0.4rem;">John Doe (Pass)</button> &bull;
        <button type="button" class="btn-demo-sample" data-token="MEDIQR-PAT-9520-EFGH" style="background: none; border: none; color: #38bdf8; text-decoration: underline; cursor: pointer; font-size: 0.78rem; padding: 0.2rem 0.4rem;">Jane Smith (Pass)</button>
      </div>
    `;

    document.getElementById('fallback-open-search-btn')?.addEventListener('click', () => {
      closeCameraModal();
      openSearchModal();
    });

    document.getElementById('fallback-retry-cam-btn')?.addEventListener('click', () => {
      fallbackBox.style.display = 'none';
      startCameraScanner();
    });

    fallbackBox.querySelectorAll('.btn-demo-sample').forEach(btn => {
      btn.onclick = () => {
        const token = btn.getAttribute('data-token');
        if (token) {
          closeCameraModal();
          loadPatientWorkspace(token);
        }
      };
    });

    if (statusMsg) {
      statusMsg.innerHTML = '<span style="color: #f59e0b;">Camera permission blocked. You can upload an image pass or search by token.</span>';
    }
  }

  async function stopCameraScanner() {
    if (html5QrCode && isCameraRunning) {
      try {
        await html5QrCode.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
      try {
        html5QrCode.clear();
      } catch (err) {}
      html5QrCode = null;
    }
    isCameraRunning = false;
    if (btnToggleCamera) {
      btnToggleCamera.textContent = '▶ Start Optical Camera';
      btnToggleCamera.className = 'btn btn-primary btn-sm';
    }
    if (scannerLaser) scannerLaser.style.display = 'none';
    if (scannerReticle) scannerReticle.style.display = 'none';
    if (cameraPlaceholder) cameraPlaceholder.style.display = 'block';
    if (cameraStatusMsg) cameraStatusMsg.textContent = '';
  }

  btnToggleCamera?.addEventListener('click', () => {
    if (isCameraRunning) {
      stopCameraScanner();
    } else {
      startCameraScanner();
    }
  });

  // Clicking on the placeholder box also initiates camera scan
  cameraPlaceholder?.addEventListener('click', () => {
    if (!isCameraRunning) {
      startCameraScanner();
    }
  });

  // Action executed when a QR code is detected by camera or file upload
  function onQrCodeSuccessfullyDetected(scannedRaw) {
    playScanSuccessChime();
    closeCameraModal();
    closeSearchModal();

    const cleanToken = parsePatientToken(scannedRaw);
    showAlert('doctor-alert', `MediFlow Code verified: ${cleanToken}. Loading patient clinical file...`, 'success');

    // Load patient record directly into the dashboard workbench!
    loadPatientWorkspace(cleanToken);
  }

  // Image File Scanner
  const qrFileInput = document.getElementById('qr-file-input');
  const fileFeedback = document.getElementById('file-scan-feedback');
  qrFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileFeedback) fileFeedback.innerHTML = '<span class="text-muted">Analyzing image for QR code...</span>';

    try {
      const fileScanner = new Html5Qrcode("qr-reader");
      const decodedText = await fileScanner.scanFile(file, true);
      if (fileFeedback) fileFeedback.innerHTML = `<span class="badge badge-success">QR Detected!</span>`;
      onQrCodeSuccessfullyDetected(decodedText);
    } catch (err) {
      if (fileFeedback) {
        fileFeedback.innerHTML = `<span style="color: var(--danger);">Could not detect a QR code in this image. Please upload a clear photo of the MediFlow pass.</span>`;
      }
    }
  });

  // Manual Token / URL lookup form
  const lookupForm = document.getElementById('qr-lookup-form');
  if (lookupForm) {
    lookupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlert('doctor-alert');

      const rawInput = document.getElementById('qr-token-input').value;
      const cleanToken = parsePatientToken(rawInput);

      if (!cleanToken) {
        showAlert('doctor-alert', 'Please enter a valid patient QR token or access URL.', 'warning');
        return;
      }

      closeSearchModal();
      loadPatientWorkspace(cleanToken);
    });
  }
}

// Update doctor's consultation counter
function updateDoctorConsultationsCount(user) {
  try {
    const store = getDemoStore();
    if (store && store.medicalRecords) {
      const docConsultations = store.medicalRecords.filter(r => 
        (r.doctorId === user.id || (r.doctorName && r.doctorName.toLowerCase() === (user.name || '').toLowerCase()))
      );
      const countEl = document.getElementById('doctor-consultations-count');
      if (countEl) countEl.textContent = docConsultations.length;
    }
  } catch (e) {
    // ignore
  }
}

// Doctor Personal Saved-Patients List Management (Separate from official medical history)
const DOCTOR_SAVED_PATIENTS_KEY = 'mediflow_doctor_saved_patients';
const LEGACY_SAVED_PATIENTS_KEY = 'mediqr_doctor_saved_patients';

function getDoctorSavedPatients() {
  try {
    const data = localStorage.getItem(DOCTOR_SAVED_PATIENTS_KEY) || localStorage.getItem(LEGACY_SAVED_PATIENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading saved patients list:', e);
  }

  // Pre-seed with default initial patient for test access
  const initial = [
    {
      id: 1,
      name: 'John Doe',
      gender: 'Male',
      dateOfBirth: '1985-06-12',
      bloodGroup: 'O+',
      qrToken: 'MEDIFLOW-PAT-8831-ABCD',
      phone: '+1 (555) 019-2831',
      photoUrl: '',
      savedDate: '2024-09-15',
      note: 'Saved for quick future clinical reference'
    }
  ];
  try {
    localStorage.setItem(DOCTOR_SAVED_PATIENTS_KEY, JSON.stringify(initial));
    localStorage.setItem(LEGACY_SAVED_PATIENTS_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function saveDoctorSavedPatients(list) {
  try {
    localStorage.setItem(DOCTOR_SAVED_PATIENTS_KEY, JSON.stringify(list));
    localStorage.setItem(LEGACY_SAVED_PATIENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving personal patient list:', e);
  }
  updateDoctorSavedCountBadge();
}

function updateDoctorSavedCountBadge() {
  const list = getDoctorSavedPatients();
  const countBadge = document.getElementById('doctor-saved-count');
  if (countBadge) countBadge.textContent = list.length;
  const navBadge = document.getElementById('saved-patients-nav-count');
  if (navBadge) navBadge.textContent = list.length;
  const pageBadge = document.getElementById('saved-patients-page-count');
  if (pageBadge) pageBadge.textContent = `${list.length} Saved Patient${list.length === 1 ? '' : 's'}`;
}

function savePatientToDoctorPersonalList(patient) {
  const list = getDoctorSavedPatients();
  const exists = list.some(p => p.qrToken === patient.qrToken || p.id === patient.id);
  if (!exists) {
    list.unshift({
      id: patient.id || Date.now(),
      name: patient.name,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup || 'Not Specified',
      qrToken: patient.qrToken,
      phone: patient.phone || '',
      photoUrl: window.getPatientPhotoUrl ? window.getPatientPhotoUrl(patient.photoUrl) : (patient.photoUrl || ''),
      savedDate: new Date().toISOString().split('T')[0],
      note: 'Saved from consultation desk'
    });
    saveDoctorSavedPatients(list);
  }
}

function removePatientFromDoctorPersonalList(qrToken) {
  const list = getDoctorSavedPatients();
  const filtered = list.filter(p => p.qrToken !== qrToken);
  saveDoctorSavedPatients(filtered);
}

// 2. Saved Patients Dedicated Page (/saved-patients.html)
function initSavedPatientsPage() {
  updateDoctorSavedCountBadge();
  renderSavedPatientsList();
}

function renderSavedPatientsList() {
  const container = document.getElementById('saved-patients-list-container');
  if (!container) return;

  const list = getDoctorSavedPatients();
  updateDoctorSavedCountBadge();

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3.5rem 1.5rem; background: #ffffff; border-radius: 14px; border: 1px dashed var(--border);">
        <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">📂</div>
        <h3 style="color: #0f172a; margin: 0 0 0.5rem; font-size: 1.15rem;">No Saved Patients in Quick-Access List</h3>
        <p style="color: #64748b; font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.5rem; line-height: 1.5;">
          You haven't added any patients to your personal quick-access list yet. When recording a new consultation on the Doctor Home page, check <strong>"Save this patient for future reference"</strong>.
        </p>
        <a href="/doctor-dashboard.html" class="btn btn-primary">
          &larr; Go to Doctor Home (Access Patient)
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(patient => `
    <div class="saved-patient-card" id="saved-card-${escapeHtml(patient.qrToken)}">
      <div class="saved-patient-main">
        <img
          src="${escapeHtml(window.getPatientPhotoUrl ? window.getPatientPhotoUrl(patient.photoUrl) : (patient.photoUrl || window.DEFAULT_PATIENT_AVATAR))}"
          alt="${escapeHtml(patient.name)}"
          class="patient-avatar-img"
          style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid #e2e8f0;"
        >
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <strong style="font-size: 1.15rem; color: #0f172a;">${escapeHtml(patient.name)}</strong>
            ${patient.bloodGroup && patient.bloodGroup !== 'Not Specified' ? `<span class="badge badge-danger" style="font-size: 0.72rem; padding: 0.15rem 0.45rem;">${escapeHtml(patient.bloodGroup)}</span>` : '<span class="badge badge-secondary" style="font-size: 0.72rem; padding: 0.15rem 0.45rem;">No Blood Group</span>'}
            <span class="saved-patient-badge-date">📅 Saved: ${escapeHtml(patient.savedDate || 'Recent')}</span>
          </div>
          <div style="margin-top: 0.35rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; font-size: 0.85rem; color: #64748b;">
            <span>Token: <strong style="font-family: monospace; color: var(--primary);">${escapeHtml(patient.qrToken)}</strong></span>
            <span>&bull;</span>
            <span>DOB: ${escapeHtml(patient.dateOfBirth || '-')}</span>
            <span>&bull;</span>
            <span>Phone: ${escapeHtml(patient.phone || '-')}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
        <a href="/doctor-dashboard.html?token=${encodeURIComponent(patient.qrToken)}" class="btn btn-primary btn-sm" style="font-weight: 600;">
          Access Patient &rarr;
        </a>
        <button type="button" class="btn btn-outline btn-sm btn-remove-saved" data-token="${escapeHtml(patient.qrToken)}" title="Remove from personal saved list">
          🗑️ Remove from Saved List
        </button>
      </div>
    </div>
  `).join('');

  // Wire remove buttons
  container.querySelectorAll('.btn-remove-saved').forEach(btn => {
    btn.onclick = () => {
      const token = btn.getAttribute('data-token');
      if (token) {
        removePatientFromDoctorPersonalList(token);
        renderSavedPatientsList();
        showAlert('saved-alert', '✓ Patient removed from your personal saved list. Official medical records remain completely intact.', 'success');
      }
    };
  });
}

// 3. Doctor Profile Dedicated Page (/doctor-profile.html)
async function initDoctorProfilePage() {
  let user = AuthSession.getUser() || {};

  function applyDoctorFields(doc) {
    if (!doc) return;
    const nameEl = document.getElementById('profile-doctor-name');
    const specEl = document.getElementById('profile-doctor-spec');
    const hospEl = document.getElementById('profile-doctor-hospital');
    const emailEl = document.getElementById('profile-doctor-email');
    const phoneEl = document.getElementById('profile-doctor-phone');
    const photoEl = document.getElementById('doctor-profile-photo-lg');

    if (nameEl) nameEl.textContent = doc.name || 'Doctor';
    if (specEl) specEl.textContent = doc.specialization || 'Attending Physician';
    if (hospEl) hospEl.textContent = doc.hospitalName || 'Medical Center';
    if (emailEl) emailEl.textContent = doc.email || '';
    if (phoneEl) phoneEl.textContent = doc.phone || 'Not Specified';

    const licenseEl = document.getElementById('profile-doctor-license');
    if (licenseEl) {
      licenseEl.textContent = doc.licenseNumber || `MED-REG-${String(doc.id || doc.roleId || 1).padStart(4, '0')}89`;
    }

    if (photoEl) {
      photoEl.src = window.getDoctorPhotoUrl ? window.getDoctorPhotoUrl(doc.photoUrl) : (doc.photoUrl || window.DEFAULT_DOCTOR_AVATAR);
    }

    const editName = document.getElementById('edit-doctor-name');
    const editSpec = document.getElementById('edit-doctor-spec');
    const editHosp = document.getElementById('edit-doctor-hospital');
    const editPhone = document.getElementById('edit-doctor-phone');

    if (editName) editName.value = doc.name || '';
    if (editSpec) editSpec.value = doc.specialization || '';
    if (editHosp) editHosp.value = doc.hospitalName || '';
    if (editPhone) editPhone.value = doc.phone || '';

    // Setup doctor photo modal
    setupDoctorPhotoModal(doc, (updated) => {
      applyDoctorFields(updated);
    });
  }

  // 1. Initial display from session
  applyDoctorFields(user);

  // 2. Fetch fresh profile from API/engine
  try {
    const res = await MediQR_API.request('/doctor/profile');
    if (res && res.data) {
      const freshDoctor = res.data;
      user = freshDoctor;
      applyDoctorFields(freshDoctor);
      AuthSession.updateUser({
        name: freshDoctor.name,
        specialization: freshDoctor.specialization,
        hospitalName: freshDoctor.hospitalName,
        phone: freshDoctor.phone,
        photoUrl: freshDoctor.photoUrl
      });
      renderNavbarAuth();
    }
  } catch (err) {
    console.warn('Could not refresh doctor profile:', err);
  }

  // 3. Form submit handler
  const profileForm = document.getElementById('doctor-profile-form');
  if (profileForm && !profileForm.dataset.bound) {
    profileForm.dataset.bound = 'true';
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert('profile-alert');
      const submitBtn = document.getElementById('btn-save-profile');
      if (submitBtn) setLoading(submitBtn, true, 'Saving Updates...');

      const name = document.getElementById('edit-doctor-name')?.value.trim();
      const specialization = document.getElementById('edit-doctor-spec')?.value.trim();
      const hospitalName = document.getElementById('edit-doctor-hospital')?.value.trim();
      const phone = document.getElementById('edit-doctor-phone')?.value.trim();

      try {
        const response = await MediQR_API.request('/doctor/profile', {
          method: 'PUT',
          body: JSON.stringify({ name, specialization, hospitalName, phone })
        });
        const updated = response.data;
        applyDoctorFields(updated);

        AuthSession.updateUser({
          name: updated.name,
          specialization: updated.specialization,
          hospitalName: updated.hospitalName,
          phone: updated.phone
        });
        renderNavbarAuth();

        showAlert('profile-alert', '✓ Doctor profile updated successfully.', 'success');
      } catch (err) {
        showAlert('profile-alert', err.message || 'Error updating profile', 'danger');
      } finally {
        if (submitBtn) setLoading(submitBtn, false, 'Save Profile Updates');
      }
    });
  }
}

// Loads patient record directly into the active workbench
async function loadPatientWorkspace(token) {
  const workbench = document.getElementById('active-patient-workbench');
  try {
    const pRes = await MediQR_API.request(`/doctor/patient-by-token/${encodeURIComponent(token)}`);
    const patient = pRes.data;

    // Show workbench
    if (workbench) {
      workbench.style.display = 'block';
    }

    // Populate patient profile banner
    document.getElementById('patient-name').textContent = patient.name;
    const patientBloodEl = document.getElementById('patient-blood');
    if (patientBloodEl) {
      patientBloodEl.textContent = (patient.bloodGroup && patient.bloodGroup !== 'Not Specified') ? patient.bloodGroup : 'Not Specified';
    }
    document.getElementById('patient-dob').textContent = patient.dateOfBirth || '-';
    document.getElementById('patient-gender').textContent = patient.gender || '-';
    document.getElementById('patient-phone').textContent = patient.phone || '-';
    document.getElementById('patient-address').textContent = patient.address || 'Not specified';
    document.getElementById('patient-token').textContent = patient.qrToken;

    // Populate patient photo
    const patientPhoto = document.getElementById('patient-profile-photo');
    if (patientPhoto) {
      patientPhoto.src = window.getPatientPhotoUrl ? window.getPatientPhotoUrl(patient.photoUrl) : (patient.photoUrl || window.DEFAULT_PATIENT_AVATAR);
    }

    // Prefill hidden fields in consultation form
    const formPatientId = document.getElementById('form-patient-id');
    const formPatientToken = document.getElementById('form-patient-token');
    if (formPatientId) formPatientId.value = patient.id;
    if (formPatientToken) formPatientToken.value = patient.qrToken;

    // Render Doctor-Managed Critical Allergies & Drug Sensitivities
    renderPatientAllergiesSection(patient);

    // Setup Condition Template Chips
    setupConditionTemplateChips();

    // Setup Dynamic Prescribed Medicines Builder
    setupMedicinesBuilder(patient.allergies || []);

    // Setup New Consultation Submission Form
    setupConsultationFormSubmission(patient);

    // Fetch and display complete patient medical history (Strictly View-Only: Doctors can never edit or delete old records)
    const historyContainer = document.getElementById('patient-history-timeline-container');
    const historyCountBadge = document.getElementById('patient-history-count-badge');
    if (historyContainer) {
      historyContainer.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">Fetching medical history from ledger...</p>';

      try {
        let history = [];
        try {
          const hRes = await MediQR_API.request(`/doctor/patient/${patient.id}/history`);
          history = hRes.data || [];
        } catch (hErr) {
          console.warn('History API request note:', hErr);
        }

        if (historyCountBadge) {
          historyCountBadge.textContent = `${history.length} Total Consultation${history.length === 1 ? '' : 's'}`;
        }

        if (history.length === 0) {
          historyContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: #f8fafc; border-radius: 12px; border: 1px dashed var(--border);">
              <div style="font-size: 2rem; margin-bottom: 0.35rem;">📜</div>
              <strong style="color: #334155;">No Previous Medical History Found</strong>
              <p style="margin: 0.25rem 0 0; font-size: 0.85rem;">This patient has no prior consultations recorded on the ledger. You can record their first consultation via the <strong>New Consultation</strong> tab above.</p>
            </div>
          `;
        } else {
          // Render strictly view-only timeline of consultations (Never editable)
          historyContainer.innerHTML = renderTimeline(history);
        }

      } catch (histErr) {
        console.warn('Error loading patient medical history:', histErr);
        historyContainer.innerHTML = '<p class="text-danger" style="padding: 1rem 0;">Unable to load medical history records.</p>';
      }
    }

    // Default to View Medical History tab
    if (window.showHistoryTab) {
      window.showHistoryTab();
    }

    // Smooth scroll to the patient workbench
    workbench?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showAlert('doctor-alert', err.message || 'Error loading patient record', 'danger');
  }
}

// Render and wire Doctor-Managed Critical Allergies & Drug Sensitivities
function renderPatientAllergiesSection(patient) {
  if (!patient && window.currentActivePatient) {
    patient = window.currentActivePatient;
  }
  if (!patient) return;
  window.currentActivePatient = patient;

  const container = document.getElementById('patient-allergies-list');
  if (!container) return;

  container.innerHTML = renderAllergiesList(patient.allergies || [], {
    isDoctor: true,
    patientId: patient.id
  });

  setupAllergiesInteractivity(patient);
}

function setupAllergiesInteractivity(patient) {
  if (!patient && window.currentActivePatient) {
    patient = window.currentActivePatient;
  }
  if (!patient) return;
  window.currentActivePatient = patient;

  const modal = document.getElementById('allergy-modal');
  const btnOpenModal = document.getElementById('btn-open-add-allergy');
  const btnCloseModal = document.getElementById('btn-close-allergy-modal');
  const btnCancelModal = document.getElementById('btn-cancel-allergy-modal');
  const form = document.getElementById('allergy-form');
  const modalTitle = document.getElementById('allergy-modal-title');
  const submitBtn = document.getElementById('btn-save-allergy-submit');

  function openModal(isEdit = false, allergy = null) {
    if (!modal) return;
    modal.style.display = 'flex';
    clearAlert('allergy-modal-alert');

    const patientIdInput = document.getElementById('allergy-form-patient-id');
    if (patientIdInput) patientIdInput.value = patient.id;

    if (isEdit && allergy) {
      if (modalTitle) modalTitle.textContent = '✏️ Update Critical Allergy / Sensitivity';
      if (submitBtn) submitBtn.textContent = '💾 Update Allergy Record';
      const idInput = document.getElementById('allergy-form-id');
      const nameInput = document.getElementById('allergy-form-name');
      const catInput = document.getElementById('allergy-form-category');
      const sevInput = document.getElementById('allergy-form-severity');
      const descInput = document.getElementById('allergy-form-desc');

      if (idInput) idInput.value = allergy.id;
      if (nameInput) nameInput.value = allergy.allergyName || '';
      if (catInput) catInput.value = allergy.category || 'Critical Allergy';
      if (sevInput) sevInput.value = allergy.severity || 'Severe';
      if (descInput) descInput.value = allergy.description || '';
    } else {
      if (modalTitle) modalTitle.textContent = '✚ Add Critical Allergy / Sensitivity';
      if (submitBtn) submitBtn.textContent = '💾 Save Allergy Record';
      const idInput = document.getElementById('allergy-form-id');
      if (idInput) idInput.value = '';
      if (form) form.reset();
      if (patientIdInput) patientIdInput.value = patient.id;
    }
    setTimeout(() => document.getElementById('allergy-form-name')?.focus(), 80);
  }

  function closeModal() {
    if (modal) modal.style.display = 'none';
    clearAlert('allergy-modal-alert');
  }

  if (btnOpenModal) {
    btnOpenModal.onclick = () => openModal(false);
  }

  document.querySelectorAll('.btn-empty-add-allergy').forEach(btn => {
    btn.onclick = () => openModal(false);
  });

  if (btnCloseModal) {
    btnCloseModal.onclick = closeModal;
  }
  if (btnCancelModal) {
    btnCancelModal.onclick = closeModal;
  }

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Wire Edit buttons
  document.querySelectorAll('.btn-allergy-edit').forEach(btn => {
    btn.onclick = () => {
      const allergyId = parseInt(btn.getAttribute('data-id'), 10);
      const allergy = (patient.allergies || []).find(a => a.id === allergyId);
      if (allergy) {
        openModal(true, allergy);
      }
    };
  });

  // Wire Delete buttons
  document.querySelectorAll('.btn-allergy-delete').forEach(btn => {
    btn.onclick = async () => {
      const allergyId = parseInt(btn.getAttribute('data-id'), 10);
      const allergyName = btn.getAttribute('data-name') || 'this allergy';

      const confirmed = window.confirm(`Are you sure you want to delete "${allergyName}" from this patient's medical record?`);
      if (!confirmed) return;

      try {
        await MediQR_API.request(`/doctor/patient/${patient.id}/allergies/${allergyId}`, {
          method: 'DELETE'
        });

        patient.allergies = (patient.allergies || []).filter(a => a.id !== allergyId);
        renderPatientAllergiesSection(patient);
        setupMedicinesBuilder(patient.allergies || []);

        showAlert('allergy-section-alert', `✓ "${allergyName}" removed from patient record successfully.`, 'success');
        showAlert('doctor-alert', `✓ "${allergyName}" removed from patient record successfully.`, 'success');
        showAlert('record-alert', `✓ "${allergyName}" removed from patient record successfully.`, 'success');
      } catch (err) {
        showAlert('allergy-section-alert', err.message || 'Error deleting allergy', 'danger');
        showAlert('doctor-alert', err.message || 'Error deleting allergy', 'danger');
      }
    };
  });

  // Form submit handler (Add or Update)
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      clearAlert('allergy-modal-alert');

      const allergyId = document.getElementById('allergy-form-id')?.value;
      const isEdit = !!allergyId;
      const patientId = document.getElementById('allergy-form-patient-id')?.value || patient.id;

      setLoading(submitBtn, true, isEdit ? 'Updating Allergy...' : 'Saving Allergy...');

      const allergyName = document.getElementById('allergy-form-name')?.value.trim();
      const category = document.getElementById('allergy-form-category')?.value;
      const severity = document.getElementById('allergy-form-severity')?.value;
      const description = document.getElementById('allergy-form-desc')?.value.trim();

      if (!allergyName) {
        showAlert('allergy-modal-alert', 'Please enter a drug or allergen name.', 'danger');
        setLoading(submitBtn, false, isEdit ? '💾 Update Allergy Record' : '💾 Save Allergy Record');
        return;
      }

      const payload = {
        allergyName: allergyName,
        category: category,
        severity: severity,
        description: description
      };

      try {
        if (isEdit) {
          const res = await MediQR_API.request(`/doctor/patient/${patientId}/allergies/${allergyId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          const updated = res.data;
          const idx = (patient.allergies || []).findIndex(a => a.id === parseInt(allergyId, 10));
          if (idx !== -1) {
            patient.allergies[idx] = updated;
          }
          showAlert('allergy-section-alert', `✓ "${allergyName}" updated successfully!`, 'success');
          showAlert('doctor-alert', `✓ "${allergyName}" updated successfully!`, 'success');
          showAlert('record-alert', `✓ "${allergyName}" updated successfully!`, 'success');
        } else {
          const res = await MediQR_API.request(`/doctor/patient/${patientId}/allergies`, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          if (!patient.allergies) patient.allergies = [];
          patient.allergies.unshift(res.data);
          showAlert('allergy-section-alert', `✓ "${allergyName}" added to patient record successfully!`, 'success');
          showAlert('doctor-alert', `✓ "${allergyName}" added to patient record successfully!`, 'success');
          showAlert('record-alert', `✓ "${allergyName}" added to patient record successfully!`, 'success');
        }

        closeModal();
        form.reset();
        renderPatientAllergiesSection(patient);
        setupMedicinesBuilder(patient.allergies || []);
      } catch (err) {
        console.error('Error saving allergy:', err);
        showAlert('allergy-modal-alert', err.message || 'Error saving allergy record', 'danger');
        showAlert('doctor-alert', err.message || 'Error saving allergy record', 'danger');
      } finally {
        setLoading(submitBtn, false, isEdit ? '💾 Update Allergy Record' : '💾 Save Allergy Record');
      }
    };
  }
}

// 2. Patient Record View (When navigated to /patient-record.html)
async function initPatientRecordView() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawToken = urlParams.get('token');
  const patientId = urlParams.get('id');

  const token = parsePatientToken(rawToken);

  if (!token && !patientId) {
    showAlert('record-alert', 'No patient specified. Please scan a patient QR code first.', 'danger');
    return;
  }

  try {
    let patient;
    if (token) {
      const pRes = await MediQR_API.request(`/doctor/patient-by-token/${encodeURIComponent(token)}`);
      patient = pRes.data;
    } else {
      const pRes = await MediQR_API.request(`/doctor/patient/${patientId}`);
      patient = pRes.data;
    }

    // Populate patient banner
    document.getElementById('patient-name').textContent = patient.name;
    const patientBloodEl = document.getElementById('patient-blood');
    if (patientBloodEl) {
      patientBloodEl.textContent = (patient.bloodGroup && patient.bloodGroup !== 'Not Specified') ? patient.bloodGroup : 'Not Specified';
    }
    document.getElementById('patient-dob').textContent = patient.dateOfBirth || '-';
    document.getElementById('patient-gender').textContent = patient.gender || '-';
    document.getElementById('patient-phone').textContent = patient.phone || '-';
    document.getElementById('patient-address').textContent = patient.address || 'Not specified';
    document.getElementById('patient-token').textContent = patient.qrToken;

    // Populate patient photo
    const patientPhoto = document.getElementById('patient-profile-photo');
    if (patientPhoto) {
      patientPhoto.src = window.getPatientPhotoUrl ? window.getPatientPhotoUrl(patient.photoUrl) : (patient.photoUrl || window.DEFAULT_PATIENT_AVATAR);
    }

    // Prefill hidden fields in consultation form
    const formPatientId = document.getElementById('form-patient-id');
    const formPatientToken = document.getElementById('form-patient-token');
    if (formPatientId) formPatientId.value = patient.id;
    if (formPatientToken) formPatientToken.value = patient.qrToken;

    // Render Doctor-Managed Critical Allergies & Drug Sensitivities
    renderPatientAllergiesSection(patient);

    // Setup Condition Template Chips
    setupConditionTemplateChips();

    // Setup Dynamic Prescribed Medicines Builder
    setupMedicinesBuilder(patient.allergies || []);

    // Setup Consultation Submission Form
    setupConsultationFormSubmission(patient);

    // Fetch and render medical records with ONLY 2 RECENT VISITS by default + VIEW MORE TOGGLE
    await refreshPatientHistoryWithLimit(patient.id);

  } catch (err) {
    showAlert('record-alert', err.message || 'Error loading patient record', 'danger');
  }
}

// Setup Quick Diagnosis Template Chips
function setupConditionTemplateChips() {
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.onclick = () => {
      const diagInput = document.getElementById('form-diagnosis');
      if (diagInput) {
        diagInput.value = chip.getAttribute('data-diagnosis') || chip.textContent.trim();
        diagInput.focus();
      }
    };
  });
}

// Render medical records with ONLY 2 RECENT VISITS by default + VIEW MORE TOGGLE
async function refreshPatientHistoryWithLimit(patientId) {
  const recentContainer = document.getElementById('recent-history-container');
  const fullContainer = document.getElementById('full-history-container');
  const expandWrapper = document.getElementById('history-expand-wrapper');
  const toggleBtn = document.getElementById('btn-toggle-all-history');
  const toggleBtnText = document.getElementById('btn-toggle-history-text');
  const totalCountEl = document.getElementById('total-history-count');
  const viewBadge = document.getElementById('history-view-badge');

  if (!recentContainer) return;

  try {
    const historyRes = await MediQR_API.request(`/doctor/patient/${patientId}/history`);
    const history = historyRes.data || [];

    if (totalCountEl) totalCountEl.textContent = history.length;

    if (history.length === 0) {
      recentContainer.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">No previous consultations recorded for this patient. Today\'s visit will be their first consultation record.</p>';
      if (fullContainer) fullContainer.innerHTML = '';
      if (expandWrapper) expandWrapper.style.display = 'none';
      if (viewBadge) viewBadge.textContent = 'No Past Visits';
      return;
    }

    // ONLY SHOW TOP 2 RECENT CONSULTATIONS
    const top2Recent = history.slice(0, 2);
    recentContainer.innerHTML = renderTimeline(top2Recent);

    // Remaining past records
    const remainingPast = history.slice(2);
    if (remainingPast.length > 0) {
      if (fullContainer) {
        fullContainer.innerHTML = renderTimeline(remainingPast);
        fullContainer.style.display = 'none'; // hidden by default!
      }
      if (expandWrapper) {
        expandWrapper.style.display = 'block';
        if (toggleBtnText) toggleBtnText.textContent = `View More (${remainingPast.length} Past Consultations)`;
        if (viewBadge) viewBadge.textContent = `Showing 2 Most Recent of ${history.length}`;

        toggleBtn.onclick = () => {
          const isExpanded = fullContainer.style.display !== 'none';
          if (isExpanded) {
            fullContainer.style.display = 'none';
            if (toggleBtnText) toggleBtnText.textContent = `View More (${remainingPast.length} Past Consultations)`;
            if (viewBadge) viewBadge.textContent = `Showing 2 Most Recent of ${history.length}`;
          } else {
            fullContainer.style.display = 'block';
            if (toggleBtnText) toggleBtnText.textContent = `▲ Show Less (Collapse to 2 Recent)`;
            if (viewBadge) viewBadge.textContent = `Showing All ${history.length} Consultations`;
          }
        };
      }
    } else {
      if (fullContainer) fullContainer.innerHTML = '';
      if (expandWrapper) expandWrapper.style.display = 'none';
      if (viewBadge) viewBadge.textContent = `Showing ${history.length} Record${history.length > 1 ? 's' : ''}`;
    }

  } catch (err) {
    recentContainer.innerHTML = '<p class="text-danger">Unable to load patient history timeline.</p>';
  }
}

// Dynamic Medicine Rows Builder & Real-time Allergy Cross-Checker
function setupMedicinesBuilder(knownAllergies) {
  const container = document.getElementById('medicines-list-container');
  const btnAdd = document.getElementById('btn-add-medicine-row');
  const warningBox = document.getElementById('allergy-crosscheck-warning');
  const warningText = document.getElementById('allergy-crosscheck-text');

  if (!container || !btnAdd) return;

  container.innerHTML = '';
  let rowCount = 0;

  function addRow(medName = '', dosage = '', freq = 'Twice daily after food (BD)', duration = '5 days', instructions = 'Take after meals with water') {
    rowCount++;
    const rowId = `med-row-${rowCount}`;
    const rowDiv = document.createElement('div');
    rowDiv.className = 'medicine-row-card';
    rowDiv.id = rowId;

    rowDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-size: 0.8rem; font-weight: 700; color: #0f766e; text-transform: uppercase;">
          Medication #${rowCount}
        </span>
        <button type="button" class="btn btn-outline btn-sm btn-remove-med" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--danger); border-color: #fca5a5;">
          ✕ Remove
        </button>
      </div>
      <div class="medicine-row-grid">
        <div class="form-group" style="margin-bottom: 0.4rem;">
          <label class="form-label" style="font-size: 0.78rem;">Drug / Medicine Name *</label>
          <input type="text" class="form-control med-input-name" placeholder="e.g. Amoxicillin, Metformin, Amlodipine" value="${escapeHtml(medName)}" required>
        </div>
        <div class="form-group" style="margin-bottom: 0.4rem;">
          <label class="form-label" style="font-size: 0.78rem;">Dosage *</label>
          <input type="text" class="form-control med-input-dosage" placeholder="e.g. 500mg, 10mg" value="${escapeHtml(dosage)}" required>
        </div>
        <div class="form-group" style="margin-bottom: 0.4rem;">
          <label class="form-label" style="font-size: 0.78rem;">Frequency (Timing)</label>
          <select class="form-control med-input-freq" style="font-size: 0.85rem;">
            <option value="Once daily (OD)">Once daily (OD)</option>
            <option value="Twice daily after food (BD)" selected>Twice daily after food (BD)</option>
            <option value="Three times daily (TDS)">Three times daily (TDS)</option>
            <option value="Four times daily (QDS)">Four times daily (QDS)</option>
            <option value="As needed (PRN)">As needed (PRN)</option>
            <option value="At bedtime (HS)">At bedtime (HS)</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0.4rem;">
          <label class="form-label" style="font-size: 0.78rem;">Duration</label>
          <select class="form-control med-input-duration" style="font-size: 0.85rem;">
            <option value="3 days">3 days</option>
            <option value="5 days" selected>5 days</option>
            <option value="7 days">7 days</option>
            <option value="10 days">10 days</option>
            <option value="14 days">14 days</option>
            <option value="30 days">30 days (1 mo)</option>
            <option value="60 days">60 days (2 mo)</option>
            <option value="Ongoing">Ongoing / Maintenance</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom: 0; margin-top: 0.35rem;">
        <input type="text" class="form-control med-input-instructions" placeholder="Special doctor instructions (e.g. Take with full glass of water, finish complete course)" value="${escapeHtml(instructions)}" style="font-size: 0.85rem;">
      </div>
    `;

    // Remove row listener
    rowDiv.querySelector('.btn-remove-med')?.addEventListener('click', () => {
      rowDiv.remove();
      crossCheckAllergies();
    });

    // Allergy cross-check listener
    rowDiv.querySelector('.med-input-name')?.addEventListener('input', () => {
      crossCheckAllergies();
    });

    container.appendChild(rowDiv);
  }

  function crossCheckAllergies() {
    if (!warningBox || !warningText) return;
    if (!knownAllergies || knownAllergies.length === 0) {
      warningBox.style.display = 'none';
      return;
    }

    const currentNames = Array.from(container.querySelectorAll('.med-input-name'))
      .map(input => input.value.trim().toLowerCase())
      .filter(Boolean);

    let conflict = null;
    for (const med of currentNames) {
      for (const allergy of knownAllergies) {
        const allergyNameLower = allergy.allergyName.toLowerCase();
        if (med.includes(allergyNameLower) || allergyNameLower.includes(med)) {
          conflict = { medicine: med, allergy: allergy.allergyName };
          break;
        }
      }
      if (conflict) break;
    }

    if (conflict) {
      warningText.textContent = `CRITICAL ALLERGY ALERT: Patient has a recorded sensitivity to "${conflict.allergy}"! Prescribing "${conflict.medicine}" may trigger an adverse reaction.`;
      warningBox.style.display = 'flex';
    } else {
      warningBox.style.display = 'none';
    }
  }

  btnAdd.onclick = () => {
    addRow();
  };

  // Add 1 default clean row
  addRow();
}

// Setup Consultation Form Submission
function setupConsultationFormSubmission(patient) {
  const form = document.getElementById('record-consultation-form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    clearAlert('doctor-alert');
    clearAlert('record-alert');

    const diagnosis = document.getElementById('form-diagnosis').value.trim();
    let symptoms = document.getElementById('form-symptoms')?.value.trim() || '';
    let notes = document.getElementById('form-notes')?.value.trim() || '';

    // Collect Vitals
    const bp = document.getElementById('vital-bp')?.value.trim();
    const hr = document.getElementById('vital-hr')?.value.trim();
    const temp = document.getElementById('vital-temp')?.value.trim();
    const spo2 = document.getElementById('vital-spo2')?.value.trim();

    const vitalsArr = [];
    if (bp) vitalsArr.push(`BP: ${bp}`);
    if (hr) vitalsArr.push(`HR: ${hr}`);
    if (temp) vitalsArr.push(`Temp: ${temp}`);
    if (spo2) vitalsArr.push(`SpO2: ${spo2}`);

    if (vitalsArr.length > 0) {
      const vitalsStr = `[Vitals: ${vitalsArr.join(', ')}]`;
      symptoms = symptoms ? `${vitalsStr} ${symptoms}` : vitalsStr;
    }

    if (!diagnosis) {
      diagnosis = 'General Clinical Follow-up & Review';
    }

    // Collect medicines from dynamic rows
    const medicineCards = document.querySelectorAll('.medicine-row-card');
    const medicines = [];

    medicineCards.forEach(card => {
      const name = card.querySelector('.med-input-name')?.value.trim();
      const dosage = card.querySelector('.med-input-dosage')?.value.trim();
      const frequency = card.querySelector('.med-input-freq')?.value.trim() || 'As directed';
      const duration = card.querySelector('.med-input-duration')?.value.trim() || 'Standard course';
      const instructions = card.querySelector('.med-input-instructions')?.value.trim() || '';

      if (name && dosage) {
        medicines.push({ medicineName: name, dosage, frequency, duration, instructions });
      }
    });

    const submitBtn = document.getElementById('btn-submit-new-consultation') || form.querySelector('button[type="submit"]');
    setLoading(submitBtn, true, 'Recording Consultation on Ledger...');

    try {
      const payload = {
        patientId: patient.id,
        qrToken: patient.qrToken,
        diagnosis,
        symptoms,
        notes,
        medicines
      };

      await MediQR_API.request('/doctor/consultation', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Check if doctor chose to "Save this patient for future reference"
      const saveRef = document.getElementById('check-save-patient-reference')?.checked;
      if (saveRef) {
        savePatientToDoctorPersonalList(patient);
      }

      const successMsg = saveRef
        ? '✓ New permanent consultation created! Patient has also been saved to your personal Saved Patient Data list.'
        : '✓ New permanent consultation recorded on the immutable medical ledger! Previous records were not modified.';

      showAlert('doctor-alert', successMsg, 'success');

      // Refresh view-only history
      try {
        const hRes = await MediQR_API.request(`/doctor/patient/${patient.id}/history`);
        const history = hRes.data || [];
        const historyContainer = document.getElementById('patient-history-timeline-container');
        if (historyContainer) {
          historyContainer.innerHTML = renderTimeline(history);
        }
        const historyCountBadge = document.getElementById('patient-history-count-badge');
        if (historyCountBadge) {
          historyCountBadge.textContent = `${history.length} Total Consultation${history.length === 1 ? '' : 's'}`;
        }
      } catch (e) {}

      // Reset Form fields
      form.reset();
      setupMedicinesBuilder(patient.allergies || []);

      // Switch to View Medical History tab so the doctor immediately reviews the updated history
      if (window.showHistoryTab) {
        window.showHistoryTab();
      }

      // Smooth scroll to history section
      document.getElementById('tab-content-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      showAlert('doctor-alert', err.message || 'Failed to save consultation', 'danger');
    } finally {
      setLoading(submitBtn, false, '💾 Save New Consultation →');
    }
  };
}

// 3. Standalone Add Consultation Form (Fallback)
async function initAddConsultationForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = parsePatientToken(urlParams.get('token'));
  const patientId = urlParams.get('id');

  if (!token && !patientId) {
    showAlert('consultation-alert', 'No patient selected. Please scan patient QR code first.', 'danger');
    return;
  }

  try {
    let patient;
    if (token) {
      const pRes = await MediQR_API.request(`/doctor/patient-by-token/${encodeURIComponent(token)}`);
      patient = pRes.data;
    } else {
      const pRes = await MediQR_API.request(`/doctor/patient/${patientId}`);
      patient = pRes.data;
    }

    document.getElementById('patient-context-name').textContent = patient.name;
    document.getElementById('patient-context-token').textContent = patient.qrToken;
    document.getElementById('patient-context-blood').textContent = patient.bloodGroup;
    document.getElementById('hidden-patient-id').value = patient.id;
    document.getElementById('hidden-patient-token').value = patient.qrToken;

    const allergiesBox = document.getElementById('consultation-allergies');
    if (allergiesBox && patient.allergies && patient.allergies.length > 0) {
      allergiesBox.innerHTML = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem;">
          <strong style="color: #991b1b;">⚠️ Patient Recorded Allergies:</strong>
          <div style="margin-top: 0.25rem;">
            ${patient.allergies.map(a => `<span class="allergy-tag"><strong>${escapeHtml(a.allergyName)}</strong>: ${escapeHtml(a.description || '')}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // Medicine rows
    const container = document.getElementById('medicines-container');
    const btnAdd = document.getElementById('btn-add-medicine');
    let medCount = 0;

    function addRow() {
      medCount++;
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '1rem';
      div.style.background = '#f8fafc';
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.85rem; color: var(--text-muted);">Medicine #${medCount}</strong>
          <button type="button" class="btn btn-outline btn-sm remove-med-btn" style="color: var(--danger); border-color: var(--danger);">✕ Remove</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Medicine Name *</label>
            <input type="text" class="form-control med-name" placeholder="e.g. Amoxicillin" required>
          </div>
          <div class="form-group">
            <label class="form-label">Dosage *</label>
            <input type="text" class="form-control med-dosage" placeholder="e.g. 500mg" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Frequency</label>
            <input type="text" class="form-control med-freq" placeholder="e.g. 3 times daily">
          </div>
          <div class="form-group">
            <label class="form-label">Duration</label>
            <input type="text" class="form-control med-duration" placeholder="e.g. 7 days">
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Special Instructions</label>
          <input type="text" class="form-control med-instructions" placeholder="e.g. Take after meals">
        </div>
      `;
      div.querySelector('.remove-med-btn').addEventListener('click', () => div.remove());
      container.appendChild(div);
    }

    btnAdd?.addEventListener('click', addRow);
    addRow();

    // Form submission
    const form = document.getElementById('consultation-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert('consultation-alert');

      const diagnosis = document.getElementById('diagnosis').value.trim();
      const symptoms = document.getElementById('symptoms').value.trim();
      const notes = document.getElementById('notes').value.trim();

      const medicines = [];
      container.querySelectorAll('.card').forEach(card => {
        const name = card.querySelector('.med-name')?.value.trim();
        const dosage = card.querySelector('.med-dosage')?.value.trim();
        const frequency = card.querySelector('.med-freq')?.value.trim() || 'As directed';
        const duration = card.querySelector('.med-duration')?.value.trim() || 'Standard';
        const instructions = card.querySelector('.med-instructions')?.value.trim() || '';

        if (name && dosage) {
          medicines.push({ medicineName: name, dosage, frequency, duration, instructions });
        }
      });

      const submitBtn = form.querySelector('button[type="submit"]');
      setLoading(submitBtn, true, 'Archiving Consultation...');

      try {
        await MediQR_API.request('/doctor/consultation', {
          method: 'POST',
          body: JSON.stringify({
            patientId: patient.id,
            qrToken: patient.qrToken,
            diagnosis,
            symptoms,
            notes,
            medicines
          })
        });

        showAlert('consultation-alert', 'Consultation saved permanently! Redirecting to patient record...', 'success');
        setTimeout(() => {
          window.location.href = `/patient-record.html?token=${encodeURIComponent(patient.qrToken)}`;
        }, 800);
      } catch (err) {
        showAlert('consultation-alert', err.message || 'Error saving consultation', 'danger');
        setLoading(submitBtn, false, 'Save Consultation Permanently');
      }
    });

  } catch (err) {
    showAlert('consultation-alert', err.message || 'Error loading patient details', 'danger');
  }
}
