const post_id = document.querySelector('input[name="id"]').value;
const tagIdsInputEl = document.querySelector('input[name="tag-ids"]');
const tagInputEls = document.querySelectorAll('.tag-input');
const tagsSelected = [];

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

  const title = document.querySelector('input[name="title"]').value;
  const description = document.querySelector('textarea[name="description"]').value;
  const image_url = document.querySelector('input[name="image_url"]').value;
  const latitude = document.querySelector('input[name="latitude"]').value;
  const longitude = document.querySelector('input[name="longitude"]').value;
  const tags = document.querySelector('input[name="tag-ids"]').value;


  const response = await fetch(`/api/posts${post_id ? '/' + post_id : ''}`, {
    method: (post_id ? 'PUT' : 'POST'),
    body: JSON.stringify({
      id: post_id,
      title,
      description,
      image_url,
      latitude,
      longitude,
      tags
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

const updateTagIdsInput = function (tag_id, checked) {
  console.log('tag input:', tag_id, checked);
  if (checked) {
    tagsSelected.push(tag_id);
  } else {
    if (tagsSelected.indexOf(tag_id) > -1) {
      tagsSelected.splice(tagsSelected.indexOf(tag_id), 1);
    }
  }
  console.log(tagsSelected);

  tagIdsInputEl.value = tagsSelected.join(',');
};

async function tagHandler(event) {
  const tag_id = event.target.value;
  const tag_state = event.target.checked;

  updateTagIdsInput(tag_id, tag_state);
}

for (let i = 0; i < tagInputEls.length; i++) {
  tagInputEls[i].addEventListener('change', tagHandler);
  updateTagIdsInput(tagInputEls[i].value, tagInputEls[i].checked);
}
document.querySelector('input[name="image_url"]').addEventListener('click', function () {
  imageUploadWidget.open();
}, false);
document.querySelector('#edit-form').addEventListener('submit', editFormHandler);