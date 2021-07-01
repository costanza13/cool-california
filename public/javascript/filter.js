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

if (document.location.href.indexOf('/interests') > -1) {
  filterSelectEl.value = 'user-tags';
} else if (document.location.href.indexOf('/likes') > -1) {
  filterSelectEl.value = 'user-likes';
}

filterSelectEl.addEventListener('change', filterHandler);
