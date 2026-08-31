const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
    window.location.href = "index.html";
}

const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");

const taskList = document.getElementById("taskList");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const progressTasks = document.getElementById("progressTasks");
const completedTasks = document.getElementById("completedTasks");

const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");
const closeModal = document.getElementById("closeModal");

const taskForm = document.getElementById("taskForm");

const modalTitle = document.getElementById("modalTitle");

const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskStatus = document.getElementById("taskStatus");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");

let tasks = [];
let currentFilter = "All";
let editingTaskId = null;

welcomeText.textContent = `Welcome, ${user.name}!`;

// LOGOUT
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "index.html";
});

// LOAD TASKS
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logoutBtn.click();
            return;
        }

        tasks = await response.json();

        updateStats();
        displayTasks();

    } catch (error) {
        taskList.innerHTML = `
            <div class="empty-state">
                Unable to load tasks. Please check the backend.
            </div>
        `;
    }
}

// UPDATE STATS
function updateStats() {
    totalTasks.textContent = tasks.length;

    pendingTasks.textContent =
        tasks.filter(task => task.status === "Pending").length;

    progressTasks.textContent =
        tasks.filter(task => task.status === "In Progress").length;

    completedTasks.textContent =
        tasks.filter(task => task.status === "Completed").length;
}

// DISPLAY TASKS
function displayTasks() {

    let filteredTasks = tasks;

    if (currentFilter !== "All") {
        filteredTasks = tasks.filter(
            task => task.status === currentFilter
        );
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Create a task to get started.</p>
            </div>
        `;

        return;
    }

    taskList.innerHTML = filteredTasks
        .map(task => createTaskHTML(task))
        .join("");
}

// TASK HTML
function createTaskHTML(task) {

    let statusClass = "status-pending";

    if (task.status === "In Progress") {
        statusClass = "status-progress";
    }

    if (task.status === "Completed") {
        statusClass = "status-completed";
    }

    const priorityClass =
        `priority-${task.priority.toLowerCase()}`;

    const dueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString()
        : "No due date";

    return `
        <div class="task-card">

            <h3>${escapeHTML(task.title)}</h3>

            <p>
                ${escapeHTML(task.description || "No description")}
            </p>

            <div class="task-meta">

                <span class="badge ${statusClass}">
                    ${task.status}
                </span>

                <span class="badge ${priorityClass}">
                    ${task.priority} Priority
                </span>

                <span class="badge">
                    Due: ${dueDate}
                </span>

            </div>

            <div class="task-actions">

                <button
                    class="edit-btn"
                    onclick="editTask('${task._id}')"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteTask('${task._id}')"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}

// ADD TASK
addTaskBtn.addEventListener("click", () => {

    editingTaskId = null;

    modalTitle.textContent = "Add Task";

    taskForm.reset();

    taskStatus.value = "Pending";
    taskPriority.value = "Medium";

    taskModal.classList.remove("hidden");
});

// CLOSE MODAL
closeModal.addEventListener("click", () => {
    taskModal.classList.add("hidden");
});

taskModal.addEventListener("click", (e) => {
    if (e.target === taskModal) {
        taskModal.classList.add("hidden");
    }
});

// SAVE TASK
taskForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const taskData = {
        title: taskTitle.value,
        description: taskDescription.value,
        status: taskStatus.value,
        priority: taskPriority.value,
        dueDate: taskDueDate.value || null
    };

    try {

        let response;

        if (editingTaskId) {

            response = await fetch(
                `${API_URL}/tasks/${editingTaskId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(taskData)
                }
            );

        } else {

            response = await fetch(
                `${API_URL}/tasks`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(taskData)
                }
            );
        }

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Operation failed");
            return;
        }

        taskModal.classList.add("hidden");

        await loadTasks();

    } catch (error) {
        alert("Unable to connect to server.");
    }
});

// EDIT TASK
window.editTask = function (id) {

    const task = tasks.find(task => task._id === id);

    if (!task) return;

    editingTaskId = id;

    modalTitle.textContent = "Edit Task";

    taskTitle.value = task.title;
    taskDescription.value = task.description || "";
    taskStatus.value = task.status;
    taskPriority.value = task.priority;

    if (task.dueDate) {
        taskDueDate.value =
            new Date(task.dueDate)
                .toISOString()
                .split("T")[0];
    } else {
        taskDueDate.value = "";
    }

    taskModal.classList.remove("hidden");
};

// DELETE TASK
window.deleteTask = async function (id) {

    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `${API_URL}/tasks/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Delete failed");
            return;
        }

        await loadTasks();

    } catch (error) {
        alert("Unable to connect to server.");
    }
};

// FILTERS
document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter-btn")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        displayTasks();
    });
});

// BASIC HTML ESCAPE
function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}

// INITIAL LOAD
loadTasks();