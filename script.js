document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadTasks();
    updateProgress();
    checkReminders();
    setInterval(checkReminders, 60000); // every minute
  
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('exportTasksBtn').addEventListener('click', exportTasks);
    document.getElementById('filterInput').addEventListener('change', filterTasks);
    document.getElementById('sortInput').addEventListener('change', filterTasks);
    document.getElementById('taskInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') addTask();
    });
    document.getElementById('importInput').addEventListener('change', importTasks);
    document.getElementById('taskList').addEventListener('keydown', handleKeyboardNav);
    document.getElementById('searchInput').addEventListener('input', filterTasks);
  });
  
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = document.body.classList.contains('dark-mode') ? '☀' : '🌙';
  });
  
  function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      document.getElementById('themeToggle').textContent = '☀';
    } else {
      document.getElementById('themeToggle').textContent = '🌙';
    }
  }
  
  function addTask() {
    const taskInput = document.getElementById('taskInput');
    const categoryInput = document.getElementById('categoryInput');
    const priorityInput = document.getElementById('priorityInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const taskText = taskInput.value.trim();
  
    if (!taskText) {
      alert('Please enter a task!');
      return;
    }
  
    const task = {
      id: Date.now(),
      text: taskText,
      category: categoryInput.value,
      priority: priorityInput.value,
      dueDate: dueDateInput.value || null,
      completed: false
    };
  
    saveTask(task);
    taskInput.value = '';
    dueDateInput.value = '';
    filterTasks();
    updateProgress();
  }
  
  function saveTask(task) {
    const tasks = getTasks();
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
  
  function getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
  }
  
  function loadTasks() {
    filterTasks();
  }
  
  function renderTask(task) {
    const taskList = document.getElementById('taskList');
    const li = document.createElement('li');
    li.setAttribute('data-id', task.id);
    li.setAttribute('tabindex', '0');
    if (task.completed) li.classList.add('completed');
    if (task.dueDate && new Date(task.dueDate) < new Date() && !task.completed) li.classList.add('overdue');
  
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
  
    li.innerHTML = `
      <div class="task-info">
        <div class="task-text">${task.text}</div>
        <div class="task-meta">
          Category: ${task.category} | 
          Priority: <span class="priority-${task.priority.toLowerCase()}">${task.priority}</span> | 
          Due: ${dueDate}
        </div>
      </div>
      <div class="task-actions">
        <button onclick="toggleTask(${task.id})">${task.completed ? 'Undo' : 'Complete'}</button>
        <button onclick="editTask(${task.id})">Edit</button>
        <button onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;
    taskList.appendChild(li);
  }
  
  function toggleTask(id) {
    let tasks = getTasks();
    tasks = tasks.map(task => {
      if (task.id === id) task.completed = !task.completed;
      return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    filterTasks();
    updateProgress();
  }
  
  function editTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
  
    document.getElementById('taskInput').value = task.text;
    document.getElementById('categoryInput').value = task.category;
    document.getElementById('priorityInput').value = task.priority;
    document.getElementById('dueDateInput').value = task.dueDate || '';
  
    deleteTask(id);
  }
  
  function deleteTask(id) {
    let tasks = getTasks();
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    filterTasks();
    updateProgress();
  }
  
  function filterTasks() {
    const filter = document.getElementById('filterInput').value;
    const sort = document.getElementById('sortInput').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
  
    let tasks = getTasks();
  
    if (search) {
      tasks = tasks.filter(task =>
        task.text.toLowerCase().includes(search) ||
        task.category.toLowerCase().includes(search) ||
        task.priority.toLowerCase().includes(search)
      );
    }
  
    if (filter === 'pending') tasks = tasks.filter(task => !task.completed);
    if (filter === 'completed') tasks = tasks.filter(task => task.completed);
  
    if (sort === 'dueDate') {
      tasks.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
    } else if (sort === 'priority') {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } else if (sort === 'category') {
      tasks.sort((a, b) => a.category.localeCompare(b.category));
    }
  
    tasks.forEach(renderTask);
  }
  
  function updateProgress() {
    const tasks = getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    document.getElementById('progressBar').value = percentage;
    document.getElementById('progressText').textContent = `${percentage}%`;
  }
  
  function checkReminders() {
    const tasks = getTasks();
    const now = new Date();
  
    tasks.forEach(task => {
      if (task.dueDate && !task.completed) {
        const due = new Date(task.dueDate);
        const li = document.querySelector(`li[data-id="${task.id}"]`);
        if (!li) return;
  
        if (due < now && !li.classList.contains('overdue')) {
          li.classList.add('overdue');
          alert(`Task "${task.text}" is overdue! (${due.toLocaleString()})`);
        } else if (due - now <= 3600000 && due - now > 0 && !li.dataset.reminded) {
          li.dataset.reminded = 'true';
          alert(`Reminder: Task "${task.text}" is due soon at ${due.toLocaleString()}`);
        }
      }
    });
  }
  
  function exportTasks() {
    const tasks = getTasks();
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function importTasks(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/json') {
      alert('Please select a valid JSON file!');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tasks = JSON.parse(e.target.result);
        if (Array.isArray(tasks) && tasks.every(t => t.id && t.text && t.category && t.priority && 'completed' in t)) {
          localStorage.setItem('tasks', JSON.stringify(tasks));
          filterTasks();
          updateProgress();
          alert('Tasks imported successfully!');
        } else {
          alert('Invalid task data format!');
        }
      } catch (err) {
        alert('Error reading file!');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
  
  function handleKeyboardNav(e) {
    const tasks = document.querySelectorAll('#taskList li');
    const focused = document.activeElement;
    const index = Array.from(tasks).indexOf(focused);
  
    if (e.key === 'ArrowDown' && index < tasks.length - 1) {
      tasks[index + 1].focus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && index > 0) {
      tasks[index - 1].focus();
      e.preventDefault();
    } else if (e.key === 'Enter' && focused.tagName === 'LI') {
      const id = parseInt(focused.getAttribute('data-id'));
      toggleTask(id);
      e.preventDefault();
    }
  }
  