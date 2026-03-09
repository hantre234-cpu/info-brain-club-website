;(function () {
  function hideLoader() {
    document.body.classList.add('page-loaded');
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    loader.classList.add('page-loader--hidden');
    setTimeout(() => loader.remove(), 600);
  }
  if (document.readyState === 'complete') setTimeout(hideLoader, 0);
  else window.addEventListener('load', () => setTimeout(hideLoader, 200));
})();
