cloudinary.openUploadWidget(
    { 
      cloud_name: 'cool-california', 
      upload_preset: 'o3yfd6hz', 
      sources: [ 'local', 'url', 'camera' ]}, 
    function(error, result) { console.log(error, result) });

async function newFormHandler(event) {
    event.preventDefault();
  
    const title = document.querySelector('input[name="post-title"]').value;
    const description = document.querySelector('input[name="post-description"]').value;
    const image_url = document.querySelector('input[name="post-image_url"]').value;
    const latitude = document.querySelector('input[name="post-latitude"]').value;
    const longitude = document.querySelector('input[name="post-longitude"]').value;
  
    

    const response = await fetch(`/api/posts`, {
      method: 'POST',
      body: JSON.stringify({
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
  
  document.querySelector('.new-post-form').addEventListener('submit', newFormHandler);