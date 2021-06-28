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

  console.log({ tag_id, tag_state, apiUrl, apiPayload });
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