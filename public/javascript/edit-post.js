var imageUploadWidget = cloudinary.createUploadWidget(
  {
    cloud_name: 'cool-california',
    upload_preset: 'o3yfd6hz',
    sources: ['local', 'url', 'camera']
  },
  (error, result) => {
    if (!error && result && result.event === "success") {
      console.log('Done! Here is the image info: ', result.info);
      document.querySelector('input[name="image_url"]').value = result.info.secure_url;
    }
  }
)

async function editFormHandler(event) {
  event.preventDefault();

  const post_id = document.querySelector('input[name="id"]').value;
  const title = document.querySelector('input[name="title"]').value;
  const description = document.querySelector('textarea[name="description"]').value;
  const image_url = document.querySelector('input[name="image_url"]').value;
  const latitude = document.querySelector('input[name="latitude"]').value;
  const longitude = document.querySelector('input[name="longitude"]').value;

  const response = await fetch(`/api/posts`, {
    method: (post_id ? 'PUT' : 'POST'),
    body: JSON.stringify({
      id: post_id,
      title,
      description,
      image_url,
      latitude,
      longitude
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    document.location.replace('/dashboard');
  } else {
    alert(response.statusText);
  }
}

async function tagHandler(event) {
  const tag_id = event.target.value;
  const tag_state = event.target.checked;
  const post_id = document.querySelector('input[name="id"]').value;

  const response = await fetch(`/api/posts/tag`, {
    method: (tag_state ? 'POST' : 'DELETE'),
    body: JSON.stringify({
      post_id,
      tag_id
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    console.log('success');
  } else {
    alert(response.statusText);
  }
}

document.querySelector('.tag-inputs').addEventListener('change', tagHandler);
document.querySelector('input[name="image_url"]').addEventListener('click', function() {
  imageUploadWidget.open();
}, false);
document.querySelector('#edit-form').addEventListener('submit', editFormHandler);