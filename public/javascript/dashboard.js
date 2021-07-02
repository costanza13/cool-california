// for user tags
const tagInputEls = document.querySelectorAll('.tag-input');

async function userTagHandler(event) {
  const tag_id = event.target.value;
  const tag_state = event.target.checked;

  let apiUrl, apiPayload;

  if (tag_state) {
    apiUrl = '/api/users/tag';
    apiPayload = {
      method: 'POST',
      body: JSON.stringify({ tag_id }),
      headers: { 'Content-Type': 'application/json' }
    }
  } else {
    apiUrl = `/api/users/tag/${tag_id}`;
    apiPayload = {
      method: 'DELETE'
    }
  }

  // console.log({ tag_id, tag_state, apiUrl, apiPayload });
  const response = await fetch(apiUrl, apiPayload);
  if (response.ok) {
    console.log('success');
  } else {
    event.target.checked = !tag_state;
    alert(response.statusText);
  }
}

for (let i = 0; i < tagInputEls.length; i++) {
  tagInputEls[i].addEventListener('change', userTagHandler);
}


// for account info
const flashMessage = function(messageEl, messageContent) {
  messageEl.innerHTML = messageContent;
  messageEl.classList.remove('hidden');
  setTimeout(function() {
    messageEl.classList.add('hidden')
    messageEl.innerHTML = '';
  }, 3000)
}

async function updateFormHandler(event) {
  event.preventDefault();

  const username = document.querySelector('#username-update').value.trim();
  const nickname = document.querySelector('#nickname-update').value.trim();
  const email = document.querySelector('#email-update').value.trim();
  const password = document.querySelector('#password-update').value.trim();

  if (username || nickname || email || password) {

    // only update the fields specified by the user
    const putBody = {};
    if (username.trim()) {
      putBody.username = username.trim();
    }
    if (nickname.trim()) {
      putBody.nickname = nickname.trim();
    }
    if (email.trim()) {
      putBody.email = email.trim();
    }
    if (password.trim()) {
      putBody.password = password.trim();
    }

    const response = await fetch('/api/users', {
      method: 'put',
      body: JSON.stringify(putBody),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const messageEl = document.querySelector('#update-message');
      const messageContent = '<span style="color:green">Account Updated</span>';
      flashMessage(messageEl, messageContent);
    } else {
      const error = await response.json();
      const messageEl = document.querySelector('#update-message');
      flashMessage(messageEl, '<span style="color:red">' + error.message + '</span>');
    }
  }
}

document.querySelector('.update-form').addEventListener('submit', updateFormHandler);