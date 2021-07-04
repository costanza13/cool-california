const filterSelectEl = document.querySelector('.filter-select');

async function filterHandler(event) {
  const filterValue = filterSelectEl.value;

  let nextUrl = '/';
  switch (filterValue) {
    case 'user-tags':
      nextUrl = '/interests';
      break;
    case 'user-likes':
      nextUrl = '/likes';
      break;
  }

  document.location.replace(nextUrl);
};

if (document.location.pathname.indexOf('/interests') === 0) {
  filterSelectEl.value = 'user-tags';
} else if (document.location.pathname.indexOf('/likes') === 0) {
  filterSelectEl.value = 'user-likes';
} else if (document.location.pathname === '/') {
  filterSelectEl.value = 'all-posts';
}

filterSelectEl.addEventListener('change', filterHandler);
