(function () {
  const main = document.getElementById('mainContent');
  if (main) {
    const base = typeof VIEWS_HTML !== 'undefined' ? VIEWS_HTML : '';
    const ext = typeof VIEWS_HTML_EXT !== 'undefined' ? VIEWS_HTML_EXT : '';
    main.innerHTML = base + ext;
  }

  const loginPage = document.getElementById('loginPage');
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');

  function showApp() {
    loginPage.style.display = 'none';
    app.classList.add('visible');
  }

  function setView(name) {
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === 'view-' + name);
    });
    const navSelectors = '.nav-item, .kb-card, .home-app, .kb-subnav .btn';
    document.querySelectorAll(navSelectors).forEach(el => {
      if (!el.dataset.view) return;
      const match = el.dataset.view === name;
      if (el.classList.contains('nav-item') || el.classList.contains('btn')) {
        el.classList.toggle('active', match);
      }
    });
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
  }

  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  }

  document.getElementById('loginBtn')?.addEventListener('click', showApp);

  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const collapsed = sidebar.classList.contains('collapsed');
    document.getElementById('sidebarToggle').innerHTML = collapsed
      ? '▶ <span class="collapse-text">展开</span>'
      : '◀ <span class="collapse-text">收起侧边栏</span>';
  });

  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view]');
    if (viewBtn && !viewBtn.dataset.modal) {
      e.preventDefault();
      setView(viewBtn.dataset.view);
    }

    const modalBtn = e.target.closest('[data-modal]');
    if (modalBtn) {
      e.preventDefault();
      openModal(modalBtn.dataset.modal);
    }

    if (e.target.closest('[data-close]')) {
      closeModals();
      const goView = e.target.closest('[data-close][data-view]');
      if (goView) setView(goView.dataset.view);
    }

    if (e.target.classList.contains('modal-overlay')) {
      closeModals();
    }
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tab.closest('.tabs')?.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
})();
