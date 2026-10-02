/**
 * MediFlow - Patient Dashboard & Records Handler
 * Plain JavaScript (ES6)
 *
 * Implements view-only access for patients.
 * Patients CANNOT edit or delete medical records.
 */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.getAttribute('data-page');
  const patientPages = ['patient-dashboard', 'patient-profile', 'medical-history', 'patient-qr'];
  if (!patientPages.includes(page)) {
    return;
  }

  if (!AuthSession.requireRole('ROLE_PATIENT', '/patient-login.html')) {
    return;
  }
  if (page === 'patient-dashboard') {
    loadPatientDashboard();
  } else if (page === 'patient-profile') {
    loadPatientProfile();
  } else if (page === 'medical-history') {
    loadMedicalHistory();
  } else if (page === 'patient-qr') {
    loadPatientQrCode();
  }
});

function compressPatientImage(file, maxDimension = 360, quality = 0.85) {
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
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function setupPatientPhotoModal(profile, onUpdated) {
  const modal = document.getElementById('patient-photo-modal');
  if (!modal) return;

  const previewImg = document.getElementById('modal-photo-preview');
  const fileInput = document.getElementById('modal-photo-file-input');
  const urlInput = document.getElementById('modal-photo-url-input');
  const btnPreviewUrl = document.getElementById('btn-preview-url');
  const btnResetDefault = document.getElementById('btn-reset-default-photo');
  const btnSave = document.getElementById('btn-save-photo');
  const btnCancel = document.getElementById('btn-cancel-photo-modal');
  const btnClose = document.getElementById('btn-close-photo-modal');
  const statusText = document.getElementById('modal-photo-status');
  const modalAlert = document.getElementById('photo-modal-alert');

  let selectedPhoto = profile.photoUrl || '';

  const openModal = () => {
    selectedPhoto = profile.photoUrl || '';
    if (previewImg) {
      previewImg.src = window.getPatientPhotoUrl ? window.getPatientPhotoUrl(profile.photoUrl) : (profile.photoUrl || window.DEFAULT_PATIENT_AVATAR);
    }
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (statusText) {
      statusText.textContent = profile.photoUrl ? 'Custom Profile Photo Active' : 'Default Profile Avatar Active';
    }
    if (modalAlert) modalAlert.innerHTML = '';
    modal.style.display = 'flex';
  };

  const closeModal = () => {
    modal.style.display = 'none';
  };

  // Wire opening triggers
  const dashTrigger = document.getElementById('dash-avatar-trigger');
  if (dashTrigger) dashTrigger.onclick = openModal;

  const btnDashUpdate = document.getElementById('btn-dash-update-photo');
  if (btnDashUpdate) btnDashUpdate.onclick = openModal;

  const profTrigger = document.getElementById('prof-avatar-trigger');
  if (profTrigger) profTrigger.onclick = openModal;

  const btnOpenModal = document.getElementById('btn-open-photo-modal');
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
          const compressed = await compressPatientImage(fileInput.files[0], 360, 0.85);
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
      if (previewImg) previewImg.src = window.DEFAULT_PATIENT_AVATAR;
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
        const response = await MediQR_API.request('/patient/profile/photo', {
          method: 'PUT',
          body: JSON.stringify({ photoUrl: selectedPhoto })
        });

        const updated = response.data;
        profile.photoUrl = updated.photoUrl;

        AuthSession.updateUser({ photoUrl: updated.photoUrl });

        const finalPhotoSrc = window.getPatientPhotoUrl ? window.getPatientPhotoUrl(updated.photoUrl) : (updated.photoUrl || window.DEFAULT_PATIENT_AVATAR);
        document.querySelectorAll('.patient-avatar-img').forEach(el => {
          el.src = finalPhotoSrc;
        });

        closeModal();
        showAlert('patient-alert', '✓ Profile photo updated successfully!', 'success');
        if (typeof onUpdated === 'function') onUpdated(updated);
      } catch (err) {
        if (modalAlert) {
          modalAlert.innerHTML = `<div class="alert alert-danger" style="margin-bottom: 0.75rem; font-size: 0.85rem;">${escapeHtml(err.message || 'Failed to update photo')}</div>`;
        } else {
          showAlert('patient-alert', err.message || 'Failed to update photo', 'danger');
        }
      } finally {
        setLoading(btnSave, false, 'Save Profile Photo');
      }
    };
  }
}

async function loadPatientDashboard() {
  try {
    const [profileRes, historyRes] = await Promise.all([
      MediQR_API.request('/patient/profile'),
      MediQR_API.request('/patient/history')
    ]);

    const profile = profileRes.data;
    const history = historyRes.data || [];

    // Header greetings & badges
    document.querySelectorAll('.patient-name').forEach(el => el.textContent = profile.name);
    const bloodDisplay = (profile.bloodGroup && profile.bloodGroup !== 'Not Specified') ? profile.bloodGroup : 'Not Specified';
    document.querySelectorAll('.patient-blood').forEach(el => el.textContent = bloodDisplay);
    document.querySelectorAll('.patient-token').forEach(el => el.textContent = profile.qrToken);

    // Patient photo - clean avatar, never random unsplash photo
    const dashPhoto = document.getElementById('patient-dashboard-photo');
    if (dashPhoto) {
      dashPhoto.src = window.getPatientPhotoUrl ? window.getPatientPhotoUrl(profile.photoUrl) : (profile.photoUrl || window.DEFAULT_PATIENT_AVATAR);
    }

    // Stat cards
    const statBlood = document.getElementById('stat-blood-group');
    if (statBlood) statBlood.textContent = bloodDisplay;

    const statAllergies = document.getElementById('stat-allergies-count');
    if (statAllergies) statAllergies.textContent = profile.allergies ? profile.allergies.length : 0;

    const statVisits = document.getElementById('stat-visits-count');
    if (statVisits) statVisits.textContent = history.length;

    // Mini QR Preview
    const qrContainer = document.getElementById('dash-qr-preview');
    if (qrContainer) {
      const accessUrl = `${window.location.origin}/patient-record.html?token=${profile.qrToken}`;
      const qrImgSrc = await getScannableQrCode(accessUrl);
      qrContainer.innerHTML = `
        <div class="qr-box" style="margin: 0 auto 0.75rem;">
          <img src="${qrImgSrc}" alt="MediFlow QR Code - Scan to view record" style="width: 170px; height: 170px; display: block; border-radius: 4px;" />
        </div>
        <div class="qr-token-pill" style="font-size: 0.95rem;">${escapeHtml(profile.qrToken)}</div>
      `;
    }

    // Allergies List (Strictly View-Only for Patient)
    const allergiesContainer = document.getElementById('dash-allergies-list');
    if (allergiesContainer) {
      allergiesContainer.innerHTML = renderAllergiesList(profile.allergies || [], {
        isDoctor: false,
        patientId: profile.id
      });
    }

    // Recent Consultations (top 2)
    const recentVisitsContainer = document.getElementById('dash-recent-visits');
    if (recentVisitsContainer) {
      if (history.length === 0) {
        recentVisitsContainer.innerHTML = '<p class="text-muted">No consultations recorded yet. When a doctor treats you and scans your QR code, records will appear here.</p>';
      } else {
        recentVisitsContainer.innerHTML = renderTimeline(history.slice(0, 2));
      }
    }

    // Initialize Photo Update Modal
    setupPatientPhotoModal(profile);

  } catch (err) {
    showAlert('patient-alert', err.message || 'Error loading dashboard data', 'danger');
  }
}

async function loadPatientProfile() {
  try {
    const profileRes = await MediQR_API.request('/patient/profile');
    const profile = profileRes.data;

    document.getElementById('prof-name').textContent = profile.name;
    document.getElementById('prof-email').textContent = profile.email;
    document.getElementById('prof-dob').textContent = profile.dateOfBirth;
    document.getElementById('prof-gender').textContent = profile.gender;
    
    const profBloodEl = document.getElementById('prof-blood');
    if (profBloodEl) {
      if (profile.bloodGroup && profile.bloodGroup !== 'Not Specified') {
        profBloodEl.textContent = profile.bloodGroup;
        profBloodEl.className = 'badge badge-danger';
      } else {
        profBloodEl.textContent = 'Not Specified';
        profBloodEl.className = 'badge badge-secondary';
      }
    }

    document.getElementById('prof-phone').textContent = profile.phone || 'Not Specified';
    document.getElementById('prof-address').textContent = profile.address || 'Not specified';
    document.getElementById('prof-token').textContent = profile.qrToken;

    // Patient photo - clean avatar, never random unsplash photo
    const profPhoto = document.getElementById('patient-profile-photo');
    if (profPhoto) {
      profPhoto.src = window.getPatientPhotoUrl ? window.getPatientPhotoUrl(profile.photoUrl) : (profile.photoUrl || window.DEFAULT_PATIENT_AVATAR);
    }

    // Prefill edit form
    const editBlood = document.getElementById('edit-patient-blood');
    const editPhone = document.getElementById('edit-patient-phone');
    const editAddress = document.getElementById('edit-patient-address');
    if (editBlood) editBlood.value = profile.bloodGroup || 'Not Specified';
    if (editPhone) editPhone.value = profile.phone || '';
    if (editAddress) editAddress.value = profile.address || '';

    // Form submit listener
    const patientProfileForm = document.getElementById('patient-profile-form');
    if (patientProfileForm && !patientProfileForm.dataset.bound) {
      patientProfileForm.dataset.bound = 'true';
      patientProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert('patient-alert');
        const submitBtn = document.getElementById('btn-save-patient-profile');
        if (submitBtn) setLoading(submitBtn, true, 'Saving Updates...');

        const bloodGroup = document.getElementById('edit-patient-blood')?.value;
        const phone = document.getElementById('edit-patient-phone')?.value.trim();
        const address = document.getElementById('edit-patient-address')?.value.trim();

        try {
          const res = await MediQR_API.request('/patient/profile', {
            method: 'PUT',
            body: JSON.stringify({ bloodGroup, phone, address })
          });
          const updated = res.data;

          // Update display table
          const updatedBloodEl = document.getElementById('prof-blood');
          if (updatedBloodEl) {
            if (updated.bloodGroup && updated.bloodGroup !== 'Not Specified') {
              updatedBloodEl.textContent = updated.bloodGroup;
              updatedBloodEl.className = 'badge badge-danger';
            } else {
              updatedBloodEl.textContent = 'Not Specified';
              updatedBloodEl.className = 'badge badge-secondary';
            }
          }
          const updatedPhoneEl = document.getElementById('prof-phone');
          if (updatedPhoneEl) updatedPhoneEl.textContent = updated.phone || 'Not Specified';
          const updatedAddrEl = document.getElementById('prof-address');
          if (updatedAddrEl) updatedAddrEl.textContent = updated.address || 'Not specified';

          AuthSession.updateUser({
            bloodGroup: updated.bloodGroup,
            phone: updated.phone,
            address: updated.address
          });

          showAlert('patient-alert', '✓ Patient profile updated successfully.', 'success');
        } catch (err) {
          showAlert('patient-alert', err.message || 'Error updating profile', 'danger');
        } finally {
          if (submitBtn) setLoading(submitBtn, false, 'Save Profile Updates');
        }
      });
    }

    const allergiesList = document.getElementById('prof-allergies');
    if (allergiesList) {
      allergiesList.innerHTML = renderAllergiesList(profile.allergies || [], {
        isDoctor: false,
        patientId: profile.id
      });
    }

    // Initialize Photo Update Modal
    setupPatientPhotoModal(profile);

  } catch (err) {
    showAlert('patient-alert', err.message || 'Error loading profile', 'danger');
  }
}

async function loadMedicalHistory() {
  try {
    const historyRes = await MediQR_API.request('/patient/history');
    const records = historyRes.data || [];
    const container = document.getElementById('medical-history-container');

    if (!container) return;

    if (records.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 3rem 1.5rem;">
          <h3>No Medical Consultations Recorded Yet</h3>
          <p style="margin-top: 0.5rem;">Every consultation conducted by attending doctors will appear permanently in this chronological log.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = renderTimeline(records);
  } catch (err) {
    showAlert('patient-alert', err.message || 'Error loading medical records', 'danger');
  }
}

async function loadPatientQrCode() {
  try {
    const qrRes = await MediQR_API.request('/patient/qr');
    const qr = qrRes.data;

    document.querySelectorAll('.patient-name').forEach(el => el.textContent = qr.patientName);
    document.querySelectorAll('.patient-token').forEach(el => el.textContent = qr.qrToken);

    const qrImg = document.getElementById('qr-image-display');
    if (qrImg) {
      const realQrUrl = await getScannableQrCode(qr.accessUrl);
      qrImg.src = realQrUrl;
    }

    const accessUrlDisplay = document.getElementById('qr-access-url');
    if (accessUrlDisplay) {
      accessUrlDisplay.value = qr.accessUrl;
    }

    // Copy token button
    document.getElementById('btn-copy-token')?.addEventListener('click', () => {
      navigator.clipboard.writeText(qr.qrToken).then(() => {
        showAlert('qr-alert', `Copied token "${qr.qrToken}" to clipboard! Doctors can search using this token.`, 'success');
      });
    });

    // Copy URL button
    document.getElementById('btn-copy-url')?.addEventListener('click', () => {
      navigator.clipboard.writeText(qr.accessUrl).then(() => {
        showAlert('qr-alert', 'Access URL copied to clipboard!', 'success');
      });
    });

    // Print button
    document.getElementById('btn-print-qr')?.addEventListener('click', () => {
      window.print();
    });

  } catch (err) {
    showAlert('qr-alert', err.message || 'Error generating QR code', 'danger');
  }
}

// Render medical history timeline
function renderTimeline(records) {
  return `
    <div class="timeline">
      ${records.map(record => `
        <div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-card">
            <div class="timeline-header">
              <div>
                <span class="badge badge-primary">Consultation Visit</span>
                <div class="timeline-diagnosis" style="margin-top: 0.35rem;">
                  ${escapeHtml(record.diagnosis)}
                </div>
              </div>
              <div class="timeline-meta" style="text-align: right;">
                <strong>Date: ${escapeHtml(record.visitDate)}</strong>
                <div>${escapeHtml(record.createdAt ? new Date(record.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}</div>
              </div>
            </div>

            <div style="margin-bottom: 0.75rem;">
              <span class="badge badge-accent">Doctor</span>
              <strong>${escapeHtml(record.doctorName)}</strong>
              <span style="color: var(--text-muted); font-size: 0.85rem;">
                (${escapeHtml(record.doctorSpecialization)} • ${escapeHtml(record.hospitalName)})
              </span>
            </div>

            ${record.symptoms ? `
              <div style="margin-bottom: 0.75rem; background: #fdf2f8; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid #db2777;">
                <strong style="color: #9d174d; font-size: 0.85rem;">Reported Symptoms:</strong>
                <p style="margin: 0.2rem 0 0; color: #831843;">${escapeHtml(record.symptoms)}</p>
              </div>
            ` : ''}

            ${record.notes ? `
              <div style="margin-bottom: 0.75rem;">
                <strong style="font-size: 0.85rem; color: var(--text-muted);">Doctor Clinical Notes:</strong>
                <p style="margin-top: 0.2rem;">${escapeHtml(record.notes)}</p>
              </div>
            ` : ''}

            ${record.prescription && record.prescription.medicines && record.prescription.medicines.length > 0 ? `
              <div class="prescription-box">
                <div class="prescription-title">💊 Prescribed Medicines (${escapeHtml(record.prescription.prescriptionDate)})</div>
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${record.prescription.medicines.map(m => `
                        <tr>
                          <td><strong>${escapeHtml(m.medicineName)}</strong></td>
                          <td><span class="badge badge-primary">${escapeHtml(m.dosage)}</span></td>
                          <td>${escapeHtml(m.frequency)}</td>
                          <td>${escapeHtml(m.duration)}</td>
                          <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(m.instructions || '-')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : '<div style="font-size: 0.85rem; color: var(--text-muted);">No medicines prescribed during this visit.</div>'}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
