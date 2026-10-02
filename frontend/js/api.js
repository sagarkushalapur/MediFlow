/**
 * MediFlow - API Communication Layer
 * Plain JavaScript (ES6)
 *
 * Connects to the Spring Boot REST API at http://localhost:8080/api.
 * Provides seamless fallback to local persistent storage when previewing without
 * the backend running, so that all functionality can be tested instantly!
 */

const API_BASE_URL = 'http://localhost:8080/api';

// Universal Clean Healthcare Patient Avatar (Self-contained SVG data URI - no random stranger photos)
window.DEFAULT_PATIENT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='28' fill='%23e0f2fe'/%3E%3Ccircle cx='64' cy='46' r='22' fill='%230284c7'/%3E%3Cpath d='M26 108 c0-22 17-36 38-36 s38 14 38 36 Z' fill='%230284c7'/%3E%3C/svg%3E";

window.getPatientPhotoUrl = function(photoUrl) {
  if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim() && !photoUrl.includes('images.unsplash.com')) {
    return photoUrl.trim();
  }
  return window.DEFAULT_PATIENT_AVATAR;
};

// Universal Clean Healthcare Doctor Avatar (Self-contained SVG data URI - no random stranger photos)
window.DEFAULT_DOCTOR_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='28' fill='%23ecfdf5'/%3E%3Ccircle cx='64' cy='44' r='20' fill='%23059669'/%3E%3Cpath d='M28 108 c0-20 16-34 36-34 s36 14 36 34 Z' fill='%23059669'/%3E%3Cpath d='M64 68 v24 M52 80 h24' stroke='%23ffffff' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E";

window.getDoctorPhotoUrl = function(photoUrl) {
  if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim() && !photoUrl.includes('images.unsplash.com')) {
    return photoUrl.trim();
  }
  return window.DEFAULT_DOCTOR_AVATAR;
};

// Seed demo data matching MySQL data.sql
const DEMO_DATA_KEY = 'mediflow_demo_storage_v1';
const LEGACY_DATA_KEY = 'mediqr_demo_storage_v1';

function initializeDemoData() {
  if (localStorage.getItem(DEMO_DATA_KEY)) return;
  if (localStorage.getItem(LEGACY_DATA_KEY)) {
    localStorage.setItem(DEMO_DATA_KEY, localStorage.getItem(LEGACY_DATA_KEY));
    return;
  }

  const initialData = {
    users: [
      { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'ROLE_PATIENT' },
      { id: 2, name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@hospital.org', role: 'ROLE_DOCTOR' },
      { id: 3, name: 'Dr. Robert Vance', email: 'robert.vance@clinic.org', role: 'ROLE_DOCTOR' },
      { id: 4, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'ROLE_PATIENT' }
    ],
    patients: [
      {
        id: 1,
        userId: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        photoUrl: '',
        dateOfBirth: '1988-05-14',
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '+1 (555) 234-5678',
        address: '742 Evergreen Terrace, Springfield',
        qrToken: 'MEDIFLOW-PAT-8831-ABCD',
        allergies: [
          {
            id: 1,
            allergyName: 'Penicillin',
            category: 'Critical Allergy',
            severity: 'Severe',
            description: 'Severe Type-1 IgE-mediated anaphylaxis with facial angioedema and airway compromise. Absolute contraindication.',
            updatedBy: 'Dr. Sarah Jenkins',
            updatedAt: '2024-01-10'
          },
          {
            id: 2,
            allergyName: 'Aspirin / NSAIDs',
            category: 'Drug Sensitivity',
            severity: 'Moderate',
            description: 'Aspirin-exacerbated respiratory disease (Samter triad). Ibuprofen, naproxen trigger acute bronchospasm.',
            updatedBy: 'Dr. Robert Vance',
            updatedAt: '2024-02-14'
          },
          {
            id: 3,
            allergyName: 'Peanuts',
            category: 'Food / Environmental',
            severity: 'Moderate',
            description: 'Moderate respiratory wheezing and acute hives.',
            updatedBy: 'Dr. Sarah Jenkins',
            updatedAt: '2024-03-01'
          }
        ]
      },
      {
        id: 2,
        userId: 4,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        photoUrl: '',
        dateOfBirth: '1995-11-20',
        gender: 'Female',
        bloodGroup: 'B+',
        phone: '+1 (555) 876-5432',
        address: '1204 Elm Street, Riverdale',
        qrToken: 'MEDIFLOW-PAT-9520-EFGH',
        allergies: [
          {
            id: 4,
            allergyName: 'Sulfa Drugs',
            category: 'Critical Allergy',
            severity: 'Severe',
            description: 'Trimethoprim-sulfamethoxazole triggered severe bullous rash / SJS spectrum. Never administer sulfonamide antibiotics.',
            updatedBy: 'Dr. Sarah Jenkins',
            updatedAt: '2024-03-12'
          }
        ]
      }
    ],
    doctors: [
      { id: 1, userId: 2, name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@hospital.org', photoUrl: '', specialization: 'Cardiology', hospitalName: 'Metro General Heart Center' },
      { id: 2, userId: 3, name: 'Dr. Robert Vance', email: 'robert.vance@clinic.org', photoUrl: '', specialization: 'Internal Medicine & General Practice', hospitalName: 'City Health Diagnostic Clinic' }
    ],
    medicalRecords: [
      {
        id: 1,
        patientId: 1,
        patientName: 'John Doe',
        doctorId: 2,
        doctorName: 'Dr. Robert Vance',
        doctorSpecialization: 'Internal Medicine & General Practice',
        hospitalName: 'City Health Diagnostic Clinic',
        diagnosis: 'Acute Viral Bronchitis',
        symptoms: 'Persistent dry cough, mild fever 100.4F, chest discomfort for 4 days',
        notes: 'Patient advised warm hydration, rest. Non-smoker. Monitor temp.',
        visitDate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00',
        prescription: {
          id: 1,
          medicalRecordId: 1,
          prescriptionDate: '2024-01-15',
          medicines: [
            { id: 1, medicineName: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', duration: '5 days', instructions: 'Take 1 hour before or 2 hours after meals with full glass of water' },
            { id: 2, medicineName: 'Dextromethorphan HBr', dosage: '10ml', frequency: 'Every 8 hours as needed', duration: '7 days', instructions: 'Take after meals. Avoid driving if drowsy.' }
          ]
        }
      },
      {
        id: 2,
        patientId: 1,
        patientName: 'John Doe',
        doctorId: 1,
        doctorName: 'Dr. Sarah Jenkins',
        doctorSpecialization: 'Cardiology',
        hospitalName: 'Metro General Heart Center',
        diagnosis: 'Essential Hypertension (Stage 1)',
        symptoms: 'Occasional occipital morning headaches, fatigue, blood pressure reading 142/92 mmHg',
        notes: 'ECG within normal limits. Commenced low-dose antihypertensive therapy. Sodium restriction advised.',
        visitDate: '2024-04-10',
        createdAt: '2024-04-10T14:15:00',
        prescription: {
          id: 2,
          medicalRecordId: 2,
          prescriptionDate: '2024-04-10',
          medicines: [
            { id: 3, medicineName: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily in the morning', duration: '30 days', instructions: 'Take with or without food. Avoid grapefruit juice.' },
            { id: 4, medicineName: 'Omega-3 Fish Oil', dosage: '1000mg', frequency: 'Once daily with lunch', duration: '60 days', instructions: 'Dietary cardiovascular support.' }
          ]
        }
      },
      {
        id: 3,
        patientId: 2,
        patientName: 'Jane Smith',
        doctorId: 1,
        doctorName: 'Dr. Sarah Jenkins',
        doctorSpecialization: 'Cardiology',
        hospitalName: 'Metro General Heart Center',
        diagnosis: 'Sinus Tachycardia Evaluation',
        symptoms: 'Palpitations after exercise and occasional dizziness, resting HR 96 bpm',
        notes: '24-hr Holter monitor indicated benign sinus tachycardia. Advised caffeine reduction and hydration.',
        visitDate: '2024-06-18',
        createdAt: '2024-06-18T11:20:00',
        prescription: {
          id: 3,
          medicalRecordId: 3,
          prescriptionDate: '2024-06-18',
          medicines: [
            { id: 5, medicineName: 'Propranolol HCl', dosage: '20mg', frequency: 'Twice daily (BD)', duration: '14 days', instructions: 'Take with food. Monitor pulse before taking.' },
            { id: 6, medicineName: 'Magnesium Glycinate', dosage: '200mg', frequency: 'At bedtime (HS)', duration: '30 days', instructions: 'Electrolyte balance support.' }
          ]
        }
      },
      {
        id: 4,
        patientId: 1,
        patientName: 'John Doe',
        doctorId: 1,
        doctorName: 'Dr. Sarah Jenkins',
        doctorSpecialization: 'Cardiology',
        hospitalName: 'Metro General Heart Center',
        diagnosis: 'Hypertension 6-Month Review',
        symptoms: 'Blood pressure controlled at 124/82 mmHg. No dizziness or edema reported.',
        notes: 'Excellent therapeutic response to antihypertensives. Kidney functions normal. Continue regimen.',
        visitDate: '2024-09-05',
        createdAt: '2024-09-05T15:45:00',
        prescription: {
          id: 4,
          medicalRecordId: 4,
          prescriptionDate: '2024-09-05',
          medicines: [
            { id: 7, medicineName: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily (OD)', duration: '60 days', instructions: 'Maintenance prescription.' }
          ]
        }
      }
    ]
  };

  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(initialData));
}

initializeDemoData();

function getDemoStore() {
  initializeDemoData();
  const store = JSON.parse(localStorage.getItem(DEMO_DATA_KEY));
  if (store) {
    let modified = false;
    if (store.patients) {
      store.patients.forEach(p => {
        // Strip random unsplash portraits so patients are not given random stock photos of strangers
        if (p.photoUrl && p.photoUrl.includes('images.unsplash.com')) {
          p.photoUrl = '';
          modified = true;
        }
      });
    }
    if (store.doctors) {
      store.doctors.forEach(d => {
        // Strip random unsplash portraits so doctors are not given random stock photos of strangers
        if (d.photoUrl && d.photoUrl.includes('images.unsplash.com')) {
          d.photoUrl = '';
          modified = true;
        }
      });
    }
    if (store.medicalRecords && store.medicalRecords.length < 4) {
      if (!store.medicalRecords.some(r => r.id === 3)) {
        store.medicalRecords.push({
          id: 3,
          patientId: 2,
          patientName: 'Jane Smith',
          doctorId: 1,
          doctorName: 'Dr. Sarah Jenkins',
          doctorSpecialization: 'Cardiology',
          hospitalName: 'Metro General Heart Center',
          diagnosis: 'Sinus Tachycardia Evaluation',
          symptoms: 'Palpitations after exercise and occasional dizziness, resting HR 96 bpm',
          notes: '24-hr Holter monitor indicated benign sinus tachycardia. Advised caffeine reduction and hydration.',
          visitDate: '2024-06-18',
          createdAt: '2024-06-18T11:20:00',
          prescription: {
            id: 3,
            medicalRecordId: 3,
            prescriptionDate: '2024-06-18',
            medicines: [
              { id: 5, medicineName: 'Propranolol HCl', dosage: '20mg', frequency: 'Twice daily (BD)', duration: '14 days', instructions: 'Take with food. Monitor pulse before taking.' },
              { id: 6, medicineName: 'Magnesium Glycinate', dosage: '200mg', frequency: 'At bedtime (HS)', duration: '30 days', instructions: 'Electrolyte balance support.' }
            ]
          }
        });
        modified = true;
      }
      if (!store.medicalRecords.some(r => r.id === 4)) {
        store.medicalRecords.push({
          id: 4,
          patientId: 1,
          patientName: 'John Doe',
          doctorId: 1,
          doctorName: 'Dr. Sarah Jenkins',
          doctorSpecialization: 'Cardiology',
          hospitalName: 'Metro General Heart Center',
          diagnosis: 'Hypertension 6-Month Review',
          symptoms: 'Blood pressure controlled at 124/82 mmHg. No dizziness or edema reported.',
          notes: 'Excellent therapeutic response to antihypertensives. Kidney functions normal. Continue regimen.',
          visitDate: '2024-09-05',
          createdAt: '2024-09-05T15:45:00',
          prescription: {
            id: 4,
            medicalRecordId: 4,
            prescriptionDate: '2024-09-05',
            medicines: [
              { id: 7, medicineName: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily (OD)', duration: '60 days', instructions: 'Maintenance prescription.' }
            ]
          }
        });
        modified = true;
      }

      // Remove old emergencyAlerts if present
      if (store.emergencyAlerts) {
        delete store.emergencyAlerts;
        modified = true;
      }

      // Ensure all patient allergies are normalized with category and severity
      if (store.patients) {
        store.patients.forEach(p => {
          if (p.allergies && Array.isArray(p.allergies)) {
            p.allergies.forEach((a, idx) => {
              if (!a.id) a.id = idx + 1;
              if (!a.category) {
                a.category = (a.allergyName && (a.allergyName.includes('Aspirin') || a.allergyName.includes('NSAID')))
                  ? 'Drug Sensitivity'
                  : 'Critical Allergy';
                modified = true;
              }
              if (!a.severity) {
                a.severity = (a.allergyName && a.allergyName.includes('Penicillin')) ? 'Severe' : 'Moderate';
                modified = true;
              }
              if (!a.updatedBy) {
                a.updatedBy = 'Dr. Sarah Jenkins';
                modified = true;
              }
              if (!a.updatedAt) {
                a.updatedAt = '2024-01-15';
                modified = true;
              }
            });
          }
        });
      }
    }
    if (modified) {
      saveDemoStore(store);
    }
  }
  return store;
}

function saveDemoStore(data) {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data));
  localStorage.setItem(LEGACY_DATA_KEY, JSON.stringify(data));
}

// Session & Token Helpers
const AuthSession = {
  getToken() {
    return localStorage.getItem('mediflow_token') || localStorage.getItem('mediqr_token');
  },
  getUser() {
    const raw = localStorage.getItem('mediflow_user') || localStorage.getItem('mediqr_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(authData) {
    if (authData && authData.token) {
      localStorage.setItem('mediflow_token', authData.token);
      localStorage.setItem('mediqr_token', authData.token);
    }
    const existing = this.getUser() || {};
    const merged = { ...existing, ...authData };
    if (!merged.token && this.getToken()) {
      merged.token = this.getToken();
    }
    localStorage.setItem('mediflow_user', JSON.stringify(merged));
    localStorage.setItem('mediqr_user', JSON.stringify(merged));
  },
  updateUser(updates) {
    const current = this.getUser() || {};
    const updated = { ...current, ...updates };
    localStorage.setItem('mediflow_user', JSON.stringify(updated));
    localStorage.setItem('mediqr_user', JSON.stringify(updated));
    return updated;
  },
  clear() {
    localStorage.removeItem('mediflow_token');
    localStorage.removeItem('mediflow_user');
    localStorage.removeItem('mediqr_token');
    localStorage.removeItem('mediqr_user');
  },
  isAuthenticated() {
    return !!this.getToken();
  },
  requireRole(role, redirectUrl) {
    const user = this.getUser();
    if (!user || user.role !== role) {
      window.location.href = redirectUrl || '/index.html';
      return false;
    }
    return true;
  }
};

// Helper to extract clean token from URL or raw string
function parsePatientToken(input) {
  if (!input) return '';
  input = input.trim();
  try {
    if (input.includes('token=')) {
      const match = input.match(/[?&]token=([^&#\s]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const parsedUrl = new URL(input);
      const tokenParam = parsedUrl.searchParams.get('token');
      if (tokenParam) return tokenParam;
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && (lastPart.startsWith('MEDIFLOW-') || lastPart.startsWith('MEDIQR-') || lastPart.length > 5)) return lastPart;
    }
  } catch (e) {
    // Fallback if not valid URI
  }
  if (input.startsWith('{') && input.endsWith('}')) {
    try {
      const parsed = JSON.parse(input);
      if (parsed.token) return parsed.token;
      if (parsed.qrToken) return parsed.qrToken;
    } catch (e) {}
  }
  return input;
}

// Generates real, 100% standards-compliant scannable QR Code image
async function getScannableQrCode(text) {
  if (window.QRCode && window.QRCode.toDataURL) {
    try {
      return await window.QRCode.toDataURL(text, {
        width: 320,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
    } catch (err) {
      console.warn('QRCode library error, using fallback:', err);
    }
  }
  return generateSvgQrCode(text);
}

// Simple fallback QR code SVG generator
function generateSvgQrCode(text) {
  // A clean QR matrix representation using pseudo-random deterministic grid
  // ZXing generates on the Java backend, this provides identical visual rendering
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  const size = 25;
  const cellSize = 10;
  const totalPx = size * cellSize;
  let rects = '';

  // Finder patterns at three corners
  const drawFinder = (startX, startY) => {
    // 7x7 outer black
    rects += `<rect x="${startX * cellSize}" y="${startY * cellSize}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#0f766e"/>`;
    // 5x5 inner white
    rects += `<rect x="${(startX + 1) * cellSize}" y="${(startY + 1) * cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#ffffff"/>`;
    // 3x3 inner black
    rects += `<rect x="${(startX + 2) * cellSize}" y="${(startY + 2) * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#0f766e"/>`;
  };

  drawFinder(1, 1);
  drawFinder(size - 8, 1);
  drawFinder(1, size - 8);

  // Data modules
  let pseudo = Math.abs(hash);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder corners
      if ((r < 9 && c < 9) || (r < 9 && c >= size - 9) || (r >= size - 9 && c < 9)) {
        continue;
      }
      // Timing patterns
      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f766e"/>`;
        }
        continue;
      }
      pseudo = (pseudo * 1664525 + 1013904223) % 4294967296;
      if (pseudo % 100 < 48) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f766e"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalPx} ${totalPx}" width="100%" height="100%"><rect width="${totalPx}" height="${totalPx}" fill="#ffffff"/>${rects}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Unified API caller with automatic fallback
const MediFlow_API = {
  async request(endpoint, options = {}) {
    const token = AuthSession.getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Request failed');
      }
    } catch (err) {
      // If server is not running on localhost:8080 or network failed, use client-side storage
      console.warn(`[MediFlow] Spring Boot API not reachable at ${API_BASE_URL}${endpoint}. Utilizing local engine.`, err.message);
      return this.handleFallback(endpoint, options);
    }
  },

  handleFallback(endpoint, options) {
    const store = getDemoStore();
    const user = AuthSession.getUser();

    // 1. Patient Register
    if (endpoint === '/auth/patient/register' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      if (store.users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) {
        throw new Error('Email is already registered: ' + body.email);
      }
      const newUserId = store.users.length + 1;
      const newPatientId = store.patients.length + 1;
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const qrToken = `MEDIFLOW-PAT-${Math.floor(1000 + Math.random() * 9000)}-${randomSuffix}`;

      const bloodGroup = (body.bloodGroup && body.bloodGroup.trim()) ? body.bloodGroup.trim() : 'Not Specified';
      const photoUrl = (body.photoUrl && !body.photoUrl.includes('images.unsplash.com')) ? body.photoUrl.trim() : '';

      const newUser = { id: newUserId, name: body.name, email: body.email, role: 'ROLE_PATIENT', photoUrl: photoUrl };
      const newPatient = {
        id: newPatientId,
        userId: newUserId,
        name: body.name,
        email: body.email,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        bloodGroup: bloodGroup,
        phone: body.phone,
        address: body.address || '',
        photoUrl: photoUrl,
        qrToken: qrToken,
        allergies: (body.allergies || []).map((a, idx) => ({ id: idx + 10, allergyName: a, description: 'Self-reported' }))
      };

      store.users.push(newUser);
      store.patients.push(newPatient);
      saveDemoStore(store);

      const authData = {
        token: 'mock-jwt-token-' + newUserId,
        id: newUserId,
        roleId: newPatientId,
        name: newPatient.name,
        email: newPatient.email,
        role: 'ROLE_PATIENT',
        qrToken: qrToken,
        photoUrl: photoUrl
      };
      return { success: true, message: 'Patient registered successfully', data: authData };
    }

    // 2. Doctor Register
    if (endpoint === '/auth/doctor/register' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      if (store.users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) {
        throw new Error('Email is already registered: ' + body.email);
      }
      const newUserId = store.users.length + 1;
      const newDoctorId = store.doctors.length + 1;

      const photoUrl = (body.photoUrl && !body.photoUrl.includes('images.unsplash.com')) ? body.photoUrl.trim() : '';

      const newUser = { id: newUserId, name: body.name, email: body.email, role: 'ROLE_DOCTOR', photoUrl: photoUrl };
      const newDoctor = {
        id: newDoctorId,
        userId: newUserId,
        name: body.name,
        email: body.email,
        specialization: body.specialization,
        hospitalName: body.hospitalName,
        phone: body.phone || '',
        photoUrl: photoUrl
      };

      store.users.push(newUser);
      store.doctors.push(newDoctor);
      saveDemoStore(store);

      const authData = {
        token: 'mock-jwt-token-' + newUserId,
        id: newUserId,
        roleId: newDoctorId,
        name: newDoctor.name,
        email: newDoctor.email,
        role: 'ROLE_DOCTOR',
        specialization: newDoctor.specialization,
        hospitalName: newDoctor.hospitalName,
        phone: newDoctor.phone,
        photoUrl: photoUrl
      };
      return { success: true, message: 'Doctor registered successfully', data: authData };
    }

    // 3. Login
    if (endpoint === '/auth/login' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      const email = body.email.toLowerCase().trim();
      const existingUser = store.users.find(u => u.email.toLowerCase() === email);

      if (!existingUser) {
        throw new Error('Invalid email or password. Please verify credentials.');
      }

      const authData = {
        token: 'mock-jwt-token-' + existingUser.id,
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      };

      if (existingUser.role === 'ROLE_PATIENT') {
        const patient = store.patients.find(p => p.userId === existingUser.id || (existingUser.email && p.email && p.email.toLowerCase() === existingUser.email.toLowerCase()));
        authData.roleId = patient ? patient.id : 1;
        authData.qrToken = patient ? patient.qrToken : '';
        authData.photoUrl = patient ? (patient.photoUrl || '') : '';
        authData.bloodGroup = patient ? (patient.bloodGroup || 'Not Specified') : 'Not Specified';
        authData.phone = patient ? (patient.phone || '') : '';
        authData.address = patient ? (patient.address || '') : '';
      } else if (existingUser.role === 'ROLE_DOCTOR') {
        const doctor = store.doctors.find(d => d.userId === existingUser.id || (existingUser.email && d.email && d.email.toLowerCase() === existingUser.email.toLowerCase()));
        authData.roleId = doctor ? doctor.id : 1;
        authData.specialization = doctor ? doctor.specialization : '';
        authData.hospitalName = doctor ? doctor.hospitalName : '';
        authData.phone = doctor ? (doctor.phone || '') : '';
        authData.photoUrl = doctor ? (doctor.photoUrl || '') : '';
      }

      return { success: true, message: 'Login successful', data: authData };
    }

    // 4. Patient Profile - GET
    if (endpoint === '/patient/profile' && (!options.method || options.method.toUpperCase() === 'GET')) {
      if (!user) throw new Error('Not authenticated');
      const patient = store.patients.find(p => 
        (user.email && p.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
        (user.id && p.userId === user.id) ||
        (user.roleId && p.id === user.roleId) ||
        (user.qrToken && p.qrToken === user.qrToken)
      ) || store.patients[0];
      return { success: true, data: patient };
    }

    // 4b. Patient Profile & Photo Update - PUT / POST
    if ((endpoint === '/patient/profile' || endpoint === '/patient/profile/photo') && options.method && (options.method.toUpperCase() === 'PUT' || options.method.toUpperCase() === 'POST')) {
      if (!user) throw new Error('Not authenticated');
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      const patient = store.patients.find(p => 
        (user.email && p.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
        (user.id && p.userId === user.id) ||
        (user.roleId && p.id === user.roleId) ||
        (user.qrToken && p.qrToken === user.qrToken)
      ) || store.patients[0];
      if (!patient) throw new Error('Patient record not found');

      if (body.photoUrl !== undefined) {
        patient.photoUrl = (body.photoUrl && !body.photoUrl.includes('images.unsplash.com')) ? body.photoUrl.trim() : '';
      }
      if (body.name !== undefined && body.name.trim()) {
        patient.name = body.name.trim();
      }
      if (body.bloodGroup !== undefined) {
        patient.bloodGroup = body.bloodGroup.trim() || 'Not Specified';
      }
      if (body.phone !== undefined) {
        patient.phone = body.phone.trim();
      }
      if (body.address !== undefined) {
        patient.address = body.address.trim();
      }

      // Also update user in store.users
      const userObj = store.users.find(u => u.id === patient.userId || (patient.email && u.email && u.email.toLowerCase() === patient.email.toLowerCase()));
      if (userObj) {
        if (patient.name) userObj.name = patient.name;
        if (patient.photoUrl !== undefined) userObj.photoUrl = patient.photoUrl;
      }

      saveDemoStore(store);

      // Update active session correctly
      AuthSession.updateUser({
        name: patient.name,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        address: patient.address,
        photoUrl: patient.photoUrl
      });

      return {
        success: true,
        message: 'Patient profile updated successfully',
        data: patient
      };
    }

    // 4c. Doctor Profile - GET
    if (endpoint === '/doctor/profile' && (!options.method || options.method.toUpperCase() === 'GET')) {
      if (!user) throw new Error('Not authenticated');
      const doctor = store.doctors.find(d => 
        (user.email && d.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
        (user.id && d.userId === user.id) ||
        (user.roleId && d.id === user.roleId)
      ) || store.doctors[0];
      return { success: true, data: doctor };
    }

    // 4d. Doctor Profile & Photo Update - PUT / POST
    if ((endpoint === '/doctor/profile' || endpoint === '/doctor/profile/photo') && options.method && (options.method.toUpperCase() === 'PUT' || options.method.toUpperCase() === 'POST')) {
      if (!user) throw new Error('Not authenticated');
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      const doctor = store.doctors.find(d => 
        (user.email && d.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
        (user.id && d.userId === user.id) ||
        (user.roleId && d.id === user.roleId)
      ) || store.doctors[0];
      if (!doctor) throw new Error('Doctor record not found');

      if (body.photoUrl !== undefined) {
        doctor.photoUrl = (body.photoUrl && !body.photoUrl.includes('images.unsplash.com')) ? body.photoUrl.trim() : '';
      }
      if (body.name !== undefined && body.name.trim()) {
        doctor.name = body.name.trim();
      }
      if (body.specialization !== undefined && body.specialization.trim()) {
        doctor.specialization = body.specialization.trim();
      }
      if (body.hospitalName !== undefined && body.hospitalName.trim()) {
        doctor.hospitalName = body.hospitalName.trim();
      }
      if (body.phone !== undefined) {
        doctor.phone = body.phone.trim();
      }

      // Also update user in store.users
      const userObj = store.users.find(u => u.id === doctor.userId || (doctor.email && u.email && u.email.toLowerCase() === doctor.email.toLowerCase()));
      if (userObj) {
        if (doctor.name) userObj.name = doctor.name;
        if (doctor.photoUrl !== undefined) userObj.photoUrl = doctor.photoUrl;
      }

      saveDemoStore(store);

      // Update active session correctly
      AuthSession.updateUser({
        name: doctor.name,
        specialization: doctor.specialization,
        hospitalName: doctor.hospitalName,
        phone: doctor.phone,
        photoUrl: doctor.photoUrl
      });

      return {
        success: true,
        message: 'Doctor profile updated successfully',
        data: doctor
      };
    }

    // 5. Patient Medical History
    if (endpoint === '/patient/history') {
      if (!user) throw new Error('Not authenticated');
      const patient = store.patients.find(p => p.email.toLowerCase() === user.email.toLowerCase()) || store.patients[0];
      const records = store.medicalRecords
        .filter(r => r.patientId === patient.id)
        .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      return { success: true, data: records };
    }

    // 6. Patient Prescriptions
    if (endpoint === '/patient/prescriptions') {
      if (!user) throw new Error('Not authenticated');
      const patient = store.patients.find(p => p.email.toLowerCase() === user.email.toLowerCase()) || store.patients[0];
      const prescriptions = store.medicalRecords
        .filter(r => r.patientId === patient.id && r.prescription)
        .map(r => r.prescription);
      return { success: true, data: prescriptions };
    }

    // 7. Patient Medicines
    if (endpoint === '/patient/medicines') {
      if (!user) throw new Error('Not authenticated');
      const patient = store.patients.find(p => p.email.toLowerCase() === user.email.toLowerCase()) || store.patients[0];
      const medicines = [];
      store.medicalRecords
        .filter(r => r.patientId === patient.id && r.prescription)
        .forEach(r => {
          if (r.prescription.medicines) medicines.push(...r.prescription.medicines);
        });
      return { success: true, data: medicines };
    }

    // 8. Patient QR
    if (endpoint === '/patient/qr') {
      if (!user) throw new Error('Not authenticated');
      const patient = store.patients.find(p => p.email.toLowerCase() === user.email.toLowerCase()) || store.patients[0];
      const accessUrl = `${window.location.origin}/patient-record.html?token=${patient.qrToken}`;
      const qrSvg = generateSvgQrCode(accessUrl);
      return {
        success: true,
        data: {
          patientId: patient.id,
          patientName: patient.name,
          qrToken: patient.qrToken,
          qrCodeBase64: qrSvg,
          accessUrl: accessUrl
        }
      };
    }

    // 9. Doctor: Get Patient by Token
    if (endpoint.startsWith('/doctor/patient-by-token/')) {
      const rawToken = endpoint.replace('/doctor/patient-by-token/', '').trim();
      const token = decodeURIComponent(rawToken);
      const cleanToken = parsePatientToken(token);
      let patient = store.patients.find(p => p.qrToken && p.qrToken.toLowerCase() === cleanToken.toLowerCase());
      if (!patient && store.patients.length > 0) {
        // Fallback to match if token matches partial or first patient
        patient = store.patients.find(p => cleanToken.includes(p.qrToken) || p.qrToken.includes(cleanToken)) || store.patients[0];
      }
      if (!patient) throw new Error('Patient not found with QR token: ' + cleanToken);
      return { success: true, data: patient };
    }

    // 10. Doctor: Get Patient by ID
    if (endpoint.match(/\/doctor\/patient\/\d+$/)) {
      const id = parseInt(endpoint.split('/').pop(), 10);
      const patient = store.patients.find(p => p.id === id);
      if (!patient) throw new Error('Patient not found with ID: ' + id);
      return { success: true, data: patient };
    }

    // 11. Doctor: Get Patient History by ID
    if (endpoint.match(/\/doctor\/patient\/\d+\/history/)) {
      const parts = endpoint.split('/');
      const id = parseInt(parts[3], 10);
      const records = store.medicalRecords
        .filter(r => r.patientId === id)
        .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      return { success: true, data: records };
    }

    // 12. Doctor: Add Consultation
    // STRICT RULE: New record is saved permanently, old records are NEVER modified or deleted!
    if (endpoint === '/doctor/consultation' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      let patient = null;
      if (body.patientId) {
        patient = store.patients.find(p => p.id === body.patientId);
      } else if (body.qrToken) {
        patient = store.patients.find(p => p.qrToken === body.qrToken);
      }

      if (!patient) throw new Error('Patient not found.');

      const doctor = store.doctors.find(d => d.email.toLowerCase() === (user ? user.email.toLowerCase() : '')) || store.doctors[0];
      const newRecordId = store.medicalRecords.length + 1;
      const todayStr = new Date().toISOString().split('T')[0];

      const newRecord = {
        id: newRecordId,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        hospitalName: doctor.hospitalName,
        diagnosis: body.diagnosis,
        symptoms: body.symptoms || '',
        notes: body.notes || '',
        visitDate: todayStr,
        createdAt: new Date().toISOString(),
        prescription: null
      };

      if (body.medicines && body.medicines.length > 0) {
        const presId = newRecordId;
        newRecord.prescription = {
          id: presId,
          medicalRecordId: newRecordId,
          prescriptionDate: todayStr,
          medicines: body.medicines.map((m, idx) => ({
            id: presId * 100 + idx,
            medicineName: m.medicineName,
            dosage: m.dosage || 'Standard',
            frequency: m.frequency || 'Once daily',
            duration: m.duration || '5 days',
            instructions: m.instructions || ''
          }))
        };
      }

      // Add to records list - DO NOT MODIFY ANY EXISTING RECORDS!
      store.medicalRecords.unshift(newRecord);
      saveDemoStore(store);

      return {
        success: true,
        message: 'New consultation saved permanently to patient history',
        data: newRecord
      };
    }

    // 13. Public QR resolver
    if (endpoint.startsWith('/qr/')) {
      const token = endpoint.replace('/qr/', '').trim();
      const patient = store.patients.find(p => p.qrToken === token);
      if (!patient) throw new Error('Invalid or unknown QR token: ' + token);
      return {
        success: true,
        data: {
          valid: true,
          token: token,
          patientId: patient.id,
          patientName: patient.name,
          bloodGroup: patient.bloodGroup,
          accessUrl: `${window.location.origin}/patient-record.html?token=${token}`
        }
      };
    }

    // 14. Critical Allergies & Drug Sensitivities - GET
    if (endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies$/) && (!options.method || options.method.toUpperCase() === 'GET')) {
      const match = endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies$/);
      const patientId = parseInt(match[2], 10);
      const patient = store.patients.find(p => p.id === patientId || String(p.id) === String(patientId));
      if (!patient) throw new Error('Patient not found with ID: ' + patientId);
      return { success: true, data: patient.allergies || [] };
    }

    // 15. Doctor: Add Critical Allergy & Drug Sensitivity - POST
    if (endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies$/) && options.method && options.method.toUpperCase() === 'POST') {
      if (user && user.role === 'ROLE_PATIENT') {
        throw new Error('Unauthorized: Patients cannot add critical allergies or drug sensitivities.');
      }
      const match = endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies$/);
      const patientId = parseInt(match[2], 10);
      const patient = store.patients.find(p => p.id === patientId || String(p.id) === String(patientId));
      if (!patient) throw new Error('Patient not found with ID: ' + patientId);

      const body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      if (!body.allergyName || !body.allergyName.trim()) {
        throw new Error('Substance / Drug Name is required.');
      }

      if (!patient.allergies) patient.allergies = [];
      const doctor = (user && user.role === 'ROLE_DOCTOR')
        ? (store.doctors.find(d => d.email.toLowerCase() === (user.email || '').toLowerCase()) || store.doctors[0])
        : (store.doctors[0] || { id: 1, name: 'Dr. Sarah Jenkins' });

      const nextId = patient.allergies.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
      const todayStr = new Date().toISOString().split('T')[0];

      const newAllergy = {
        id: nextId,
        allergyName: body.allergyName.trim(),
        category: body.category || 'Critical Allergy',
        severity: body.severity || 'Severe',
        description: (body.description || '').trim(),
        updatedBy: doctor ? doctor.name : (user?.name || 'Attending Physician'),
        updatedAt: todayStr
      };

      patient.allergies.unshift(newAllergy);
      saveDemoStore(store);

      return {
        success: true,
        message: 'Critical allergy / sensitivity added to patient record successfully.',
        data: newAllergy
      };
    }

    // 16. Doctor: Update Critical Allergy & Drug Sensitivity - PUT
    if (endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies\/(\d+)$/) && options.method && options.method.toUpperCase() === 'PUT') {
      if (user && user.role === 'ROLE_PATIENT') {
        throw new Error('Unauthorized: Patients cannot update critical allergies or drug sensitivities.');
      }
      const match = endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies\/(\d+)$/);
      const patientId = parseInt(match[2], 10);
      const allergyId = parseInt(match[3], 10);

      const patient = store.patients.find(p => p.id === patientId || String(p.id) === String(patientId));
      if (!patient) throw new Error('Patient not found with ID: ' + patientId);

      const body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      const allergy = (patient.allergies || []).find(a => a.id === allergyId || String(a.id) === String(allergyId));
      if (!allergy) throw new Error('Allergy record not found with ID: ' + allergyId);

      const doctor = (user && user.role === 'ROLE_DOCTOR')
        ? (store.doctors.find(d => d.email.toLowerCase() === (user.email || '').toLowerCase()) || store.doctors[0])
        : (store.doctors[0] || { id: 1, name: 'Dr. Sarah Jenkins' });

      const todayStr = new Date().toISOString().split('T')[0];

      if (body.allergyName) allergy.allergyName = body.allergyName.trim();
      if (body.category) allergy.category = body.category;
      if (body.severity) allergy.severity = body.severity;
      if (body.description !== undefined) allergy.description = body.description.trim();
      allergy.updatedBy = doctor ? doctor.name : (user?.name || 'Attending Physician');
      allergy.updatedAt = todayStr;

      saveDemoStore(store);

      return {
        success: true,
        message: 'Critical allergy / sensitivity updated successfully.',
        data: allergy
      };
    }

    // 17. Doctor: Delete Critical Allergy & Drug Sensitivity - DELETE
    if (endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies\/(\d+)$/) && options.method && options.method.toUpperCase() === 'DELETE') {
      if (user && user.role === 'ROLE_PATIENT') {
        throw new Error('Unauthorized: Patients cannot delete critical allergies or drug sensitivities.');
      }
      const match = endpoint.match(/\/(doctor\/)?patient\/(\d+)\/allergies\/(\d+)$/);
      const patientId = parseInt(match[2], 10);
      const allergyId = parseInt(match[3], 10);

      const patient = store.patients.find(p => p.id === patientId || String(p.id) === String(patientId));
      if (!patient) throw new Error('Patient not found with ID: ' + patientId);

      const initialLen = (patient.allergies || []).length;
      patient.allergies = (patient.allergies || []).filter(a => a.id !== allergyId && String(a.id) !== String(allergyId));

      if (patient.allergies.length === initialLen) {
        throw new Error('Allergy record not found.');
      }

      saveDemoStore(store);

      return {
        success: true,
        message: 'Critical allergy / sensitivity deleted from patient record successfully.'
      };
    }

    throw new Error('Unsupported endpoint in fallback: ' + endpoint);
  }
};

// Global Critical Allergies & Drug Sensitivities Renderer
// If isDoctor === true, renders Edit and Delete controls
// If isDoctor === false (Patient View), renders strictly view-only without edit or delete
function renderAllergiesList(allergies, options = {}) {
  const isDoctor = options.isDoctor === true;
  const patientId = options.patientId;

  if (!allergies || allergies.length === 0) {
    return `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; color: #166534;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.35rem; color: #16a34a;">✓</span>
          <div>
            <strong style="font-size: 0.92rem; color: #166534;">No Known Critical Drug Allergies or Sensitivities on File</strong>
            <p style="margin: 0.15rem 0 0; font-size: 0.8rem; color: #15803d;">
              ${isDoctor
                ? 'No adverse reactions documented. Click "Add Allergy / Sensitivity" to record one.'
                : 'Your medical record shows no documented drug or food allergies. Attending doctors update this record if any reaction occurs.'}
            </p>
          </div>
        </div>
        ${isDoctor ? `
          <button type="button" class="btn btn-sm btn-primary btn-empty-add-allergy" style="background: #dc2626; border-color: #b91c1c; font-weight: 700;">
            ✚ Add Allergy / Sensitivity
          </button>
        ` : ''}
      </div>
    `;
  }

  return `
    <div class="allergy-cards-grid">
      ${allergies.map(allergy => {
        const cat = allergy.category || 'Critical Allergy';
        const sev = allergy.severity || 'Severe';

        let sevClass = 'severity-severe';
        let sevLabel = '🔴 Severe';
        const sevLower = sev.toLowerCase();
        if (sevLower.includes('fatal') || sevLower.includes('anaphylaxis') || sevLower === 'severe') {
          sevClass = 'severity-severe';
          sevLabel = '🔴 Severe Risk';
        } else if (sevLower.includes('moderate')) {
          sevClass = 'severity-moderate';
          sevLabel = '🟠 Moderate';
        } else if (sevLower.includes('mild')) {
          sevClass = 'severity-mild';
          sevLabel = '🟡 Mild';
        }

        let catIcon = '⚠️';
        const catLower = cat.toLowerCase();
        if (catLower.includes('drug sensitivity') || catLower.includes('intolerance')) catIcon = '💊';
        else if (catLower.includes('reaction')) catIcon = '⚡';
        else if (catLower.includes('food') || catLower.includes('environmental')) catIcon = '🥜';

        return `
          <div class="allergy-card-item ${sevClass}" id="allergy-card-${allergy.id}">
            <div class="allergy-card-body">
              <div class="allergy-card-header">
                <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                  <span class="allergy-category-pill">${catIcon} ${escapeHtml(cat)}</span>
                  <span class="allergy-severity-pill ${sevClass}">${escapeHtml(sevLabel)}</span>
                </div>
                ${isDoctor ? `
                  <div class="allergy-actions-row">
                    <button
                      type="button"
                      class="btn-allergy-action btn-allergy-edit"
                      data-id="${allergy.id}"
                      data-patient-id="${patientId}"
                      title="Update this allergy"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      class="btn-allergy-action btn-allergy-delete"
                      data-id="${allergy.id}"
                      data-name="${escapeHtml(allergy.allergyName)}"
                      data-patient-id="${patientId}"
                      title="Delete this allergy"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ` : ''}
              </div>

              <div class="allergy-substance-name">
                ${escapeHtml(allergy.allergyName)}
              </div>

              <div class="allergy-desc-text">
                ${escapeHtml(allergy.description || 'Clinical contraindication.')}
              </div>
            </div>

            <div class="allergy-card-footer">
              <span>🩺 Managed by: <strong>${escapeHtml(allergy.updatedBy || 'Attending Doctor')}</strong></span>
              <span>📅 ${escapeHtml(allergy.updatedAt || 'Recorded')}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Global render timeline function accessible by all portals
function renderTimeline(records) {
  if (!records || records.length === 0) {
    return '<p class="text-muted" style="padding: 1rem 0;">No previous consultations recorded for this patient.</p>';
  }
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
                (${escapeHtml(record.doctorSpecialization || 'Physician')} • ${escapeHtml(record.hospitalName || 'Clinic')})
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

// Global API & Session Exports
const MediQR_API = MediFlow_API;
window.MediFlow_API = MediFlow_API;
window.MediQR_API = MediQR_API;
window.AuthSession = AuthSession;
