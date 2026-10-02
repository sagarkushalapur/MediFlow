/**
 * MediFlow - Authentication Management
 * Plain JavaScript (ES6)
 */

document.addEventListener('DOMContentLoaded', () => {
  renderNavbarAuth();
  bindAuthForms();
});

function renderNavbarAuth() {
  const navUserContainer = document.getElementById('nav-user-container');
  if (!navUserContainer) return;

  const user = AuthSession.getUser();
  if (user) {
    const isDoctor = user.role === 'ROLE_DOCTOR';
    const roleLabel = isDoctor ? 'Doctor' : 'Patient';
    const dashboardLink = isDoctor ? '/doctor-dashboard.html' : '/patient-dashboard.html';

    navUserContainer.innerHTML = `
      <span class="user-badge ${isDoctor ? 'doctor' : ''}">
        <span>●</span> ${roleLabel}: <strong>${escapeHtml(user.name)}</strong>
      </span>
      <a href="${dashboardLink}" class="btn btn-secondary btn-sm">Dashboard</a>
      <button id="btn-logout" class="btn btn-outline btn-sm">Logout</button>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
      e.preventDefault();
      AuthSession.clear();
      window.location.href = '/index.html';
    });
  } else {
    navUserContainer.innerHTML = `
      <a href="/patient-login.html" class="btn btn-outline btn-sm">Patient Login</a>
      <a href="/doctor-login.html" class="btn btn-primary btn-sm">Doctor Login</a>
    `;
  }
}

function compressImageFile(file, maxDimension = 360, quality = 0.85) {
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
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function bindAuthForms() {
  // Patient Registration Form
  const patientRegisterForm = document.getElementById('patient-register-form');
  if (patientRegisterForm) {
    const regPhotoInput = document.getElementById('reg-photo-file');
    const regPhotoPreview = document.getElementById('reg-photo-preview');
    if (regPhotoInput && regPhotoPreview) {
      regPhotoInput.addEventListener('change', async () => {
        if (regPhotoInput.files && regPhotoInput.files[0]) {
          try {
            const previewUrl = await compressImageFile(regPhotoInput.files[0], 200, 0.85);
            regPhotoPreview.src = previewUrl;
          } catch (err) {
            console.warn('Error reading photo preview:', err);
          }
        }
      });
    }

    patientRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert('auth-alert');

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const dateOfBirth = document.getElementById('dob').value;
      const gender = document.getElementById('gender').value;
      const bloodGroup = (document.getElementById('bloodGroup')?.value || '').trim() || 'Not Specified';
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();
      const allergiesRaw = document.getElementById('allergies').value.trim();

      const allergies = allergiesRaw
        ? allergiesRaw.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : [];

      const submitBtn = patientRegisterForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true, 'Creating Account & QR Token...');

      let photoUrl = '';
      if (regPhotoInput && regPhotoInput.files && regPhotoInput.files[0]) {
        try {
          photoUrl = await compressImageFile(regPhotoInput.files[0], 360, 0.85);
        } catch (photoErr) {
          console.warn('Could not compress photo:', photoErr);
        }
      }

      try {
        const response = await MediQR_API.request('/auth/patient/register', {
          method: 'POST',
          body: JSON.stringify({
            name, email, password, dateOfBirth, gender, bloodGroup, phone, address, allergies, photoUrl
          })
        });

        AuthSession.setSession(response.data);
        showAlert('auth-alert', 'Account created! Redirecting to your dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/patient-dashboard.html';
        }, 1000);
      } catch (err) {
        showAlert('auth-alert', err.message || 'Registration failed', 'danger');
        setLoading(submitBtn, false, 'Register as Patient');
      }
    });
  }

  // Doctor Registration Form
  const doctorRegisterForm = document.getElementById('doctor-register-form');
  if (doctorRegisterForm) {
    const regDoctorPhotoInput = document.getElementById('reg-doctor-photo-file');
    const regDoctorPhotoPreview = document.getElementById('reg-doctor-photo-preview');
    if (regDoctorPhotoInput && regDoctorPhotoPreview) {
      regDoctorPhotoInput.addEventListener('change', async () => {
        if (regDoctorPhotoInput.files && regDoctorPhotoInput.files[0]) {
          try {
            const previewUrl = await compressImageFile(regDoctorPhotoInput.files[0], 200, 0.85);
            regDoctorPhotoPreview.src = previewUrl;
          } catch (err) {
            console.warn('Error reading doctor photo preview:', err);
          }
        }
      });
    }

    doctorRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert('auth-alert');

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const specialization = document.getElementById('specialization').value.trim();
      const hospitalName = document.getElementById('hospitalName').value.trim();

      const submitBtn = doctorRegisterForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true, 'Registering Doctor...');

      let photoUrl = '';
      if (regDoctorPhotoInput && regDoctorPhotoInput.files && regDoctorPhotoInput.files[0]) {
        try {
          photoUrl = await compressImageFile(regDoctorPhotoInput.files[0], 360, 0.85);
        } catch (photoErr) {
          console.warn('Could not compress doctor photo:', photoErr);
        }
      }

      try {
        const response = await MediQR_API.request('/auth/doctor/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, specialization, hospitalName, photoUrl })
        });

        AuthSession.setSession(response.data);
        showAlert('auth-alert', 'Doctor registration successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/doctor-dashboard.html';
        }, 1000);
      } catch (err) {
        showAlert('auth-alert', err.message || 'Registration failed', 'danger');
        setLoading(submitBtn, false, 'Register as Doctor');
      }
    });
  }

  // Generic Login Form (used for both patient and doctor login)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert('auth-alert');

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const expectedRole = loginForm.getAttribute('data-expected-role');

      if (!email) {
        showAlert('auth-alert', 'Please enter your email address.', 'danger');
        document.getElementById('email').focus();
        return;
      }
      if (!password) {
        showAlert('auth-alert', 'Please enter your password.', 'danger');
        document.getElementById('password').focus();
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true, 'Signing in...');

      try {
        const response = await MediQR_API.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        const userData = response.data;
        if (expectedRole && userData.role !== expectedRole) {
          throw new Error(`This portal is for ${expectedRole === 'ROLE_DOCTOR' ? 'Doctors' : 'Patients'}. Please log in through the correct portal.`);
        }

        AuthSession.setSession(userData);
        showAlert('auth-alert', 'Login successful! Redirecting...', 'success');

        setTimeout(() => {
          const returnUrl = sessionStorage.getItem('redirect_after_login');
          if (returnUrl && returnUrl !== window.location.href) {
            sessionStorage.removeItem('redirect_after_login');
            window.location.href = returnUrl;
            return;
          }
          if (userData.role === 'ROLE_DOCTOR') {
            window.location.href = '/doctor-dashboard.html';
          } else {
            window.location.href = '/patient-dashboard.html';
          }
        }, 800);
      } catch (err) {
        showAlert('auth-alert', err.message || 'Authentication failed', 'danger');
        setLoading(submitBtn, false, 'Login');
      }
    });
  }
}

// Utility UI Helpers
function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${type}">
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

function setLoading(button, isLoading, text) {
  if (!button) return;
  button.disabled = isLoading;
  button.innerHTML = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
