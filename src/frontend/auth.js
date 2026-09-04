const api = window.CollegeBuddyAPI;

function showMessage(message, isError = false) {
  const element = document.getElementById('message');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error', isError);
}

async function submit(form, action, successMessage) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  showMessage('');
  try {
    const result = await action();
    showMessage(successMessage);
    window.location.href = result.user?.profileCompleted || result.profileCompleted ? 'index.html' : 'complete-profile.html';
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    button.disabled = false;
  }
}

document.getElementById('signupForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  submit(event.currentTarget, () => api.auth.signup({
    name: document.getElementById('signupName').value.trim(),
    email: document.getElementById('signupEmail').value.trim(),
    password: document.getElementById('signupPassword').value,
  }), 'Account created. Opening your profile…');
});

document.getElementById('loginForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  submit(event.currentTarget, () => api.auth.login({
    email: document.getElementById('loginEmail').value.trim(),
    password: document.getElementById('loginPassword').value,
  }), 'Welcome back. Opening Campus OS…');
});

document.getElementById('profileForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  submit(event.currentTarget, () => api.auth.completeProfile({
    rollNumber: document.getElementById('rollNumber').value.trim(),
    course: document.getElementById('course').value.trim(),
    branch: document.getElementById('branch').value.trim(),
    currentSem: document.getElementById('currentSem').value,
  }), 'Profile completed. Opening Campus OS…');
});
