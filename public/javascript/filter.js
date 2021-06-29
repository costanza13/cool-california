const filterSelectEl = document.querySelector('.filter-select');

async function filterHandler(event) {
  const filterValue = filterSelectEl.value;

  let nextUrl = '/';
  switch (filterValue) {
    case 'user-tags':
      const response = await fetch('/api/users/tags');
      const userTags = await response.json();
      console.log(userTags);
      nextUrl = '/tag/' + userTags.join(',');
      break;
    case 'user-likes':
      nextUrl = '/likes';
      break;
  }

  document.location.replace(nextUrl);
};

filterSelectEl.addEventListener('change', filterHandler);
