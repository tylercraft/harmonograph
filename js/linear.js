const LINEAR_API     = 'https://api.linear.app/graphql';
const PRIORITY_ORDER = { 1: 0, 2: 1, 3: 2, 4: 3, 0: 4 };

async function linearQuery(query, variables = {}, apiKey) {
  const res = await fetch(LINEAR_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
    body:    JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Linear API ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message);
  return json.data;
}

async function fetchMyTasks(apiKey) {
  const data = await linearQuery(`
    query MyTasks {
      viewer {
        assignedIssues(
          filter: { state: { type: { nin: ["completed", "cancelled"] } } }
          first: 50
        ) {
          nodes {
            id
            identifier
            url
            title
            priority
            dueDate
            state { name type }
            project { name }
            updatedAt
          }
        }
      }
    }
  `, {}, apiKey);

  return data ? data.viewer.assignedIssues.nodes : null;
}

function classifyTask(task) {
  const now = new Date();
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return {
    isInProgress: task.state?.type === 'started',
    isOverdue:    due && due < now,
    isDueToday:   due && due.toDateString() === now.toDateString(),
  };
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const ca = classifyTask(a), cb = classifyTask(b);
    if (ca.isInProgress && !cb.isInProgress) return -1;
    if (!ca.isInProgress && cb.isInProgress) return  1;
    if (ca.isOverdue    && !cb.isOverdue)    return -1;
    if (!ca.isOverdue   && cb.isOverdue)     return  1;
    if (ca.isDueToday   && !cb.isDueToday)   return -1;
    if (!ca.isDueToday  && cb.isDueToday)    return  1;
    return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
  });
}

function buildTaskEl(task) {
  const el = document.createElement('a');
  el.className = 'item-link';
  el.href      = task.url || 'https://linear.app';
  el.target    = '_blank';
  el.rel       = 'noopener';

  const title = document.createElement('span');
  title.className   = 'item-title';
  title.textContent = task.title;

  if (task.identifier) {
    const secondary = document.createElement('span');
    secondary.className   = 'item-secondary';
    secondary.textContent = task.identifier;
    title.appendChild(secondary);
  }

  el.appendChild(title);
  return el;
}

function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');
  const section   = container.closest('section');

  if (tasks === null) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';

  if (tasks === false) {
    container.innerHTML = '<p class="error-state">Couldn\'t load tasks.</p>';
    return;
  }

  const sorted   = sortTasks(tasks);
  const visible  = sorted.slice(0, 8);
  const overflow = sorted.length - visible.length;

  container.innerHTML = '';

  if (visible.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks assigned.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const task of visible) fragment.appendChild(buildTaskEl(task));

  if (overflow > 0) {
    const link = document.createElement('a');
    link.className = 'item-link';
    link.href      = 'https://linear.app';
    link.target    = '_blank';
    link.rel       = 'noopener';

    const label = document.createElement('span');
    label.className   = 'item-secondary';
    label.style.marginLeft = '0';
    label.textContent = `+${overflow} more in Linear`;
    link.appendChild(label);
    fragment.appendChild(link);
  }

  container.appendChild(fragment);
}

async function initLinear(apiKey, silent = false) {
  if (!apiKey) { if (!silent) renderTasks(null); return; }

  try {
    const tasks = await fetchMyTasks(apiKey);
    renderTasks(tasks);
  } catch (err) {
    if (!silent) renderTasks(false);
    console.error('Devcito: Linear error', err);
  }
}

function reloadLinear(apiKey) {
  initLinear(apiKey);
}

window.reloadLinear = reloadLinear;
