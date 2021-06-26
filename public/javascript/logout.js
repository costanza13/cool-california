const SESSION_INACTIVITY_TIMEOUT_MINUTES = 30;

async function logout(event) {
  if (event) {
    event.preventDefault();
  }

  const response = await fetch('/api/users/logout', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.ok) {
    // added 1-second delay, because immediate redirect creates race condition with cookie storage
    setTimeout(() => { document.location.replace('/'); }, 1);
  } else {
    alert(response.statusText);
  }
}

// timeout on inactivity
let inactivityTimer;
const resetSessionTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(logout, SESSION_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);
}
resetSessionTimer();

// listen for common user interaction events to reset the session timer
document.addEventListener('click', resetSessionTimer);
document.addEventListener('touch', resetSessionTimer);
document.addEventListener('scroll', resetSessionTimer);
document.addEventListener('keydown', resetSessionTimer);

document.querySelector('#logout').addEventListener('click', logout);
