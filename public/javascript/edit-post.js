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

async function newFormHandler(event) {
  event.preventDefault();

  const title = document.querySelector('input[name="title"]').value;
  const description = document.querySelector('textarea[name="description"]').value;
  const image_url = document.querySelector('input[name="image_url"]').value;
  const latitude = document.querySelector('input[name="latitude"]').value;
  const longitude = document.querySelector('input[name="longitude"]').value;

  const response = await fetch(`/api/posts`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      description,
      image_url,
      latitude: 1000000,
      longitude: 1000000,
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

document.querySelector('input[name="image_url"]').addEventListener('click', function() {
  imageUploadWidget.open();
}, false);
document.querySelector('#edit-form').addEventListener('submit', newFormHandler);