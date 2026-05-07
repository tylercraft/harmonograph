// Stub data for visual development. Enabled via CONFIG.stub = true.

const STUB_CALENDAR = [
  {
    id: '1',
    title: 'Design sync',
    start: (() => { const d = new Date(); d.setHours(d.getHours() - 1); return d.toISOString(); })(),
    end:   (() => { const d = new Date(); d.setHours(d.getHours() + 1); return d.toISOString(); })(),
    account: 'work',
    current: true,
  },
  {
    id: '2',
    title: 'Client call — Acme',
    start: (() => { const d = new Date(); d.setHours(14, 0, 0, 0); return d.toISOString(); })(),
    end:   (() => { const d = new Date(); d.setHours(14, 30, 0, 0); return d.toISOString(); })(),
    account: 'personal',
    current: false,
  },
  {
    id: '3',
    title: 'Sprint planning',
    start: (() => { const d = new Date(); d.setHours(16, 0, 0, 0); return d.toISOString(); })(),
    end:   (() => { const d = new Date(); d.setHours(17, 0, 0, 0); return d.toISOString(); })(),
    account: 'work',
    current: false,
  },
];

const STUB_TASKS = [
  {
    id: 't1',
    title: 'Resolve flaky auth token refresh',
    priority: 1,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })(),
    state: { name: 'In Progress', type: 'started' },
    project: { name: 'Platform' },
  },
  {
    id: 't2',
    title: 'Migrate checkout to new design system tokens',
    priority: 2,
    dueDate: new Date().toISOString().split('T')[0],
    state: { name: 'In Progress', type: 'started' },
    project: { name: 'Storefront' },
  },
  {
    id: 't3',
    title: 'Add skeleton loaders to dashboard',
    priority: 2,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })(),
    state: { name: 'Todo', type: 'unstarted' },
    project: { name: 'Storefront' },
  },
  {
    id: 't4',
    title: 'Write API docs for webhooks',
    priority: 3,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(),
    state: { name: 'Todo', type: 'unstarted' },
    project: { name: 'Platform' },
  },
  {
    id: 't5',
    title: 'QA pass on mobile nav',
    priority: 3,
    dueDate: null,
    state: { name: 'Todo', type: 'unstarted' },
    project: { name: 'Storefront' },
  },
];

