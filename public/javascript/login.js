async function signupFormHandler(event) {
  event.preventDefault();

  const username = document.querySelector('#username-signup').value.trim();
  const email = document.querySelector('#email-signup').value.trim();
  const password = document.querySelector('#password-signup').value.trim();

  if (username && email && password) {
    const response = await fetch('/api/users', {
      method: 'post',
      body: JSON.stringify({
        username,
        email,
        password
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      document.location.replace(nextUrl);
    } else {
      const error = await response.json();
      const errorText = document.querySelector('#sign-up-error');
      errorText.innerText = error.message;
      errorText.setAttribute("style", "display: block !important");
    }
  }
}

async function loginFormHandler(event) {
  event.preventDefault();

  const username = document.querySelector('#username-login').value.trim();
  const password = document.querySelector('#password-login').value.trim();

  if (username && password) {
    const response = await fetch('/api/users/login', {
      method: 'post',
      body: JSON.stringify({
        username,
        password
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      // added 1-second delay, because immediate redirect creates race condition with cookie storage
      setTimeout(() => { document.location.replace(nextUrl); }, 1);
    } else {
      const error = await response.json();
      const errorText = document.querySelector('#login-error');
      errorText.innerText = error.message;
      errorText.setAttribute("style", "display: block !important");
    }
  }
}

let nextUrl = '/';
if (document.location.search) {
  const qsParams = document.location.search.substr(1).split('&');
  for (let i = 0; i < qsParams.length; i++) {
    const [name, value] = qsParams[i].split('=');
    if (name === '_next') {
      nextUrl = value;
    }
  }
}

document.querySelector('.signup-form').addEventListener('submit', signupFormHandler);
document.querySelector('.signin-form').addEventListener('submit', loginFormHandler);
document.querySelector('#sign-up-switch').addEventListener('click', function (event) {
  event.preventDefault();
  document.querySelector('#sign-in-wrapper').classList.add('hidden');
  document.querySelector('#sign-up-wrapper').classList.remove('hidden');
});
document.querySelector('#sign-in-switch').addEventListener('click', function (event) {
  event.preventDefault();
  document.querySelector('#sign-up-wrapper').classList.add('hidden');
  document.querySelector('#sign-in-wrapper').classList.remove('hidden');
});