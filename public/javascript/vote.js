async function voteHandler(event) {
  const vote_value = event.target.value;
  const post_id = event.target.getAttribute('data-post-id');

  const vote_body = {
    post_id
  }
  let vote_method = 'POST';
  switch (vote_value) {
    case 'like':
      vote_body.like = true;
      break;
    case 'dislike':
      vote_body.like = false;
      break;
    default:
      vote_method = 'DELETE';
  }

  const fetchOptions = {
    method: vote_method,
    body: JSON.stringify(vote_body),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log(fetchOptions);
  const response = await fetch(`/api/posts/vote`, fetchOptions);

  if (response.ok) {
    response.json().then(voteData => {
      console.log('success: ', voteData);
      document.querySelector('#post-' + post_id + '-vote').querySelector('.like-count').textContent = voteData.likes;
      document.querySelector('#post-' + post_id + '-vote').querySelector('.dislike-count').textContent = voteData.dislikes;
    });
  } else {
    event.target.checked = !event.target.checked;
    alert(response.statusText);
  }
}

// wait until all posts are loaded, with their vote buttons
window.onload = (event) => {
  const voteInputEls = document.querySelectorAll('.vote-input');
  console.log(voteInputEls);
  voteInputEls.forEach(likeInput => {
    likeInput.addEventListener('click', voteHandler);
  });
};