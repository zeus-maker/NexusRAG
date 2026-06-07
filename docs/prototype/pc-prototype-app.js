(function () {
  const KB_NAV = [
    { view: 'kb-detail', label: '概览' },
    { view: 'kb-documents', label: '文件' },
    { view: 'kb-retrieval', label: '检索测试' },
    { view: 'kb-index', label: '索引状态' },
    { view: 'kb-config', label: '配置' },
    { view: 'kb-wiki', label: 'Wiki' },
    { view: 'kb-pageindex', label: 'PageIndex' },
    { view: 'kb-graphrag', label: '知识图谱' },
    { view: 'kb-permissions', label: '权限' },
    { view: 'kb-datasource', label: '数据源' },
    { view: 'kb-logs', label: '日志' },
  ];

  const BREADCRUMBS = {
    home: ['工作台'],
    'kb-list': ['知识库管理'],
    'kb-detail': ['知识库管理', '法务合同知识库', '概览'],
    'kb-documents': ['知识库管理', '法务合同知识库', '文件'],
    'kb-parse': ['知识库管理', '法务合同知识库', '解析预览'],
    'kb-chunks': ['知识库管理', '法务合同知识库', '分块预览'],
    'kb-index': ['知识库管理', '法务合同知识库', '索引状态'],
    'kb-retrieval': ['知识库管理', '法务合同知识库', '检索测试'],
    'kb-config': ['知识库管理', '法务合同知识库', '配置'],
    'kb-wiki': ['知识库管理', '法务合同知识库', 'Wiki Hub'],
    'kb-pageindex': ['知识库管理', '法务合同知识库', 'PageIndex Hub'],
    'kb-graphrag': ['知识库管理', '法务合同知识库', 'GraphRAG Hub'],
    'kb-permissions': ['知识库管理', '法务合同知识库', '权限'],
    'kb-datasource': ['知识库管理', '法务合同知识库', '数据源'],
    'kb-logs': ['知识库管理', '法务合同知识库', '日志'],
    chat: ['智能对话'],
    search: ['搜索应用'],
    agent: ['Agent 编排'],
    'eval-dashboard': ['评测中心', '仪表盘'],
    'eval-tasks': ['评测中心', '评测任务'],
    'eval-ab': ['评测中心', 'A/B 测试'],
    'eval-cost': ['评测中心', '成本中心'],
    'eval-replay': ['评测中心', '回放评测'],
    'sys-users': ['系统管理', '用户管理'],
    'sys-roles': ['系统管理', '角色管理'],
    'sys-models': ['系统管理', '模型提供商'],
    'sys-datasource': ['系统管理', '数据源'],
    'sys-mcp': ['系统管理', 'MCP'],
    'sys-classifier': ['系统管理', '分类器路由'],
    'sys-fusion': ['系统管理', '融合与精排'],
    'sys-retrieval-strategy': ['系统管理', '检索策略'],
    'sys-generation-strategy': ['系统管理', '生成策略'],
    'sys-pipeline': ['系统管理', '流水线配置'],
    'sys-security': ['系统管理', '安全合规'],
    'sys-audit': ['系统管理', '审计日志'],
    'sys-monitor': ['系统管理', '系统监控'],
  };

  const KB_VIEWS = new Set(KB_NAV.map(n => n.view).concat(['kb-parse', 'kb-chunks', 'kb-graph']));

  const main = document.getElementById('mainContent');
  if (main) {
    const base = typeof VIEWS_HTML !== 'undefined' ? VIEWS_HTML : '';
    const ext = typeof VIEWS_HTML_EXT !== 'undefined' ? VIEWS_HTML_EXT : '';
    const v16 = typeof VIEWS_HTML_V16 !== 'undefined' ? VIEWS_HTML_V16 : '';
    main.innerHTML = base + ext + v16;
  }

  const loginPage = document.getElementById('loginPage');
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const breadcrumbEl = document.getElementById('topBreadcrumb');

  function renderKBSidenav(active) {
    const html = KB_NAV.map(item =>
      `<button class="kb-nav-item${item.view === active ? ' active' : ''}" data-view="${item.view}">${item.label}</button>`
    ).join('');
    document.querySelectorAll('[data-kb-nav]').forEach(nav => {
      nav.innerHTML = html;
      const slotActive = nav.getAttribute('data-kb-nav');
      nav.querySelectorAll('.kb-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === active || btn.dataset.view === slotActive);
      });
    });
  }

  function updateBreadcrumb(name) {
    if (!breadcrumbEl) return;
    const crumbs = BREADCRUMBS[name] || ['工作台'];
    breadcrumbEl.innerHTML = crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      return `<span class="crumb${isLast ? ' current' : ''}">${c}</span>`;
    }).join('<span class="crumb-sep">/</span>');
  }

  function showApp() {
    loginPage.style.display = 'none';
    app.classList.add('visible');
    setView('home');
  }

  function setView(name) {
    if (name === 'kb-graph') name = 'kb-graphrag';
    if (name === 'kb-retrieval') {
      const v16 = document.getElementById('view-kb-retrieval-v16');
      if (v16) name = 'kb-retrieval-v16';
    }

    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === 'view-' + name);
    });

    document.querySelectorAll('.nav-item').forEach(el => {
      if (!el.dataset.view) return;
      const v = el.dataset.view;
      let active = v === name;
      if (v === 'kb-list' && KB_VIEWS.has(name)) active = true;
      if (v === 'eval-dashboard' && name.startsWith('eval-')) active = true;
      if (v === 'sys-users' && name.startsWith('sys-')) active = true;
      el.classList.toggle('active', active);
    });

    if (KB_VIEWS.has(name) || name === 'kb-retrieval-v16') {
      const kbActive = name === 'kb-retrieval-v16' ? 'kb-retrieval' : name;
      renderKBSidenav(kbActive);
    }

    updateBreadcrumb(name);
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
  });

  document.addEventListener('click', (e) => {
    const hubTab = e.target.closest('[data-hub-panel]');
    if (hubTab) {
      e.preventDefault();
      const panelId = hubTab.dataset.hubPanel;
      const container = hubTab.closest('[data-hub]')?.parentElement;
      if (container) {
        container.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
        hubTab.classList.add('active');
        container.querySelectorAll('.hub-panel').forEach(p => p.classList.remove('active'));
        const panel = container.querySelector('#' + panelId);
        if (panel) panel.classList.add('active');
      }
      return;
    }

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

    if (e.target.classList.contains('modal-overlay')) closeModals();
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tab.closest('.tabs')?.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  document.querySelectorAll('[data-kb-nav]').forEach(nav => renderKBSidenav('kb-detail'));
})();
