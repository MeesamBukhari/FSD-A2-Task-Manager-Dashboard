const STORAGE_KEY = "taskManager_v1";

let tasks = [];
let activeFilter = "all";
let activeCategory = "all";
let sortAsc = true;

// DOM Elements
const taskGrid = document.getElementById("taskGrid");
const addForm = document.getElementById("addTaskForm");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskDate = document.getElementById("taskDate");
const filterButtons = document.querySelectorAll("[data-filter]");
const categoryFilter = document.getElementById("categoryFilter");
const globalSearch = document.getElementById("globalSearch");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const sortDateBtn = document.getElementById("sortDateBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const taskStats = document.getElementById("taskStats");

// Edit Modal
const editModal = new bootstrap.Modal(document.getElementById("editModal"));
const editId = document.getElementById("editId");
const editTitle = document.getElementById("editTitle");
const editCategory = document.getElementById("editCategory");
const editDate = document.getElementById("editDate");
const editCompleted = document.getElementById("editCompleted");
const saveEditBtn = document.getElementById("saveEditBtn");

// Utility
const uid = () => "_" + Math.random().toString(36).substr(2, 9);
const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

// Load & save
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
    console.log("Tasks loaded:", tasks.length);
  } catch (e) {
    console.error("Error loading tasks:", e);
    tasks = [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    console.log("Tasks saved:", tasks.length);
  } catch (e) {
    console.error("Error saving tasks:", e);
  }
}

// Render tasks
function renderTasks() {
  console.log("Rendering tasks...");
  
  let q = globalSearch.value.toLowerCase().trim();
  let filtered = tasks.filter((t) => {
    if (activeFilter === "pending" && t.completed) return false;
    if (activeFilter === "completed" && !t.completed) return false;
    if (activeCategory !== "all" && t.category !== activeCategory) return false;
    if (q && !t.title.toLowerCase().includes(q)) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return sortAsc
      ? new Date(a.dueDate) - new Date(b.dueDate)
      : new Date(b.dueDate) - new Date(a.dueDate);
  });

  taskGrid.innerHTML = "";

  if (filtered.length === 0) {
    taskGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center empty-state">
          <i class="bi bi-inbox d-block"></i>
          <h5>No tasks found</h5>
          <p class="mb-0">Add your first task to get started!</p>
        </div>
      </div>`;
    updateStats();
    return;
  }

  filtered.forEach((t) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3 fade-in";

    const card = document.createElement("div");
    card.className = "card h-100 task-card";
    if (t.completed) card.classList.add("task-completed");

    // Format date
    let dateDisplay = "No due date";
    if (t.dueDate) {
      try {
        const date = new Date(t.dueDate + 'T00:00:00');
        dateDisplay = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (e) {
        dateDisplay = t.dueDate;
      }
    }

    // Status badge
    const statusBadge = t.completed
      ? '<span class="badge bg-success ms-1">Completed</span>'
      : '<span class="badge bg-warning text-dark ms-1">Pending</span>';

    card.innerHTML = `
      <div class="card-body d-flex flex-column">
        <h6 class="task-title mb-2">${escapeHtml(t.title)}</h6>
        <div class="text-muted small mb-2">
          <i class="bi bi-calendar-event me-1"></i>
          Due: ${dateDisplay}
        </div>
        <div class="mb-3">
          <span class="badge bg-secondary">${escapeHtml(t.category)}</span>
          ${statusBadge}
        </div>
        <div class="mt-auto d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-primary flex-fill" data-action="edit">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm ${t.completed ? 'btn-outline-warning' : 'btn-outline-success'} flex-fill" data-action="complete">
            <i class="bi ${t.completed ? 'bi-arrow-counterclockwise' : 'bi-check-circle'}"></i>
            ${t.completed ? 'Undo' : 'Done'}
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" style="width: 40px;">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;

    // Event listeners
    card.querySelector('[data-action="edit"]').onclick = () => openEdit(t);
    card.querySelector('[data-action="complete"]').onclick = () => toggleComplete(t.id);
    card.querySelector('[data-action="delete"]').onclick = () => removeTask(t.id, col);

    col.appendChild(card);
    taskGrid.appendChild(col);
  });

  updateStats();
  updateCategories();
}

// Update stats
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  
  taskStats.innerHTML = `
    <span class="badge bg-primary">${total}</span>
    <span class="badge bg-success">${completed}</span>
    <span class="badge bg-warning text-dark">${pending}</span>
  `;
}

// Update category dropdown
function updateCategories() {
  const cats = [...new Set(tasks.map(t => t.category))];
  const currentValue = categoryFilter.value;
  
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  cats.forEach(c => {
    const selected = currentValue === c ? 'selected' : '';
    categoryFilter.innerHTML += `<option value="${escapeHtml(c)}" ${selected}>${escapeHtml(c)}</option>`;
  });
}

// Add Task
function addTask(title, category, date) {
  const trimmedTitle = title.trim();
  
  if (!trimmedTitle) {
    alert("Please enter a task title!");
    return false;
  }
  
  if (!category) {
    alert("Please select a category!");
    return false;
  }

  const newTask = {
    id: uid(),
    title: trimmedTitle,
    category: category,
    dueDate: date || "",
    completed: false,
    createdAt: Date.now()
  };

  tasks.push(newTask);
  save();
  renderTasks();
  
  console.log("Task added:", newTask);
  return true;
}

// Remove Task
function removeTask(id, element) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  element.classList.add("removing");
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    save();
    renderTasks();
    console.log("Task deleted:", id);
  }, 300);
}

// Toggle Complete
function toggleComplete(id) {
  tasks = tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  save();
  renderTasks();
  console.log("Task toggled:", id);
}

// Edit
function openEdit(task) {
  editId.value = task.id;
  editTitle.value = task.title;
  editCategory.value = task.category;
  editDate.value = task.dueDate;
  editCompleted.checked = task.completed;
  editModal.show();
}

saveEditBtn.onclick = () => {
  const id = editId.value;
  const newTitle = editTitle.value.trim();

  if (!newTitle) {
    alert("Task title cannot be empty!");
    return;
  }

  tasks = tasks.map(t =>
    t.id === id
      ? {
          ...t,
          title: newTitle,
          category: editCategory.value,
          dueDate: editDate.value,
          completed: editCompleted.checked
        }
      : t
  );

  save();
  renderTasks();
  editModal.hide();
  console.log("Task updated:", id);
};

// Event Listeners
addForm.onsubmit = (e) => {
  e.preventDefault();
  console.log("Form submitted");
  
  if (addTask(taskTitle.value, taskCategory.value, taskDate.value)) {
    addForm.reset();
  }
};

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    console.log("Filter changed:", activeFilter);
    renderTasks();
  });
});

categoryFilter.onchange = () => {
  activeCategory = categoryFilter.value;
  console.log("Category filter changed:", activeCategory);
  renderTasks();
};

globalSearch.oninput = () => {
  renderTasks();
};

clearSearchBtn.onclick = () => {
  globalSearch.value = "";
  renderTasks();
};

sortDateBtn.onclick = () => {
  sortAsc = !sortAsc;
  sortDateBtn.innerHTML = sortAsc
    ? '<i class="bi bi-sort-up"></i> Sort by Date'
    : '<i class="bi bi-sort-down"></i> Sort by Date';
  renderTasks();
};

clearAllBtn.onclick = () => {
  if (tasks.length === 0) {
    alert("No tasks to clear!");
    return;
  }

  if (confirm(`Delete all ${tasks.length} tasks? This cannot be undone!`)) {
    tasks = [];
    save();
    renderTasks();
    console.log("All tasks cleared");
  }
};

// Initialize
console.log("Initializing Task Manager...");
load();
renderTasks();
console.log("Task Manager ready!");