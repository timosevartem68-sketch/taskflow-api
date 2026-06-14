console.log("TaskFlow JS loaded");

const API_URL = "http://127.0.0.1:8000/api/v1";

// Экран авторизации
const authScreen = document.querySelector("#auth-screen");
const appPage = document.querySelector("#app-page");

const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");
const authForm = document.querySelector("#auth-form");
const fullNameLabel = document.querySelector("#full-name-label");
const fullNameInput = document.querySelector("#auth-full-name");
const emailInput = document.querySelector("#auth-email");
const passwordInput = document.querySelector("#auth-password");
const authSubmitButton = document.querySelector("#auth-submit-button");
const authMessage = document.querySelector("#auth-message");

// Основной интерфейс
const currentUser = document.querySelector("#current-user");
const logoutButton = document.querySelector("#logout-button");
const workspaceContext = document.querySelector("#workspace-context");

const createTaskButton = document.querySelector("#create-task-button");
const createCard = document.querySelector(".create-card");

const searchInput = document.querySelector(".search-input");
const filterButtons = document.querySelectorAll(".filter-button");

// Модальное окно задачи
const taskModal = document.querySelector("#task-modal");
const closeModalButton = document.querySelector("#close-modal-button");
const cancelTaskButton = document.querySelector("#cancel-task-button");
const taskForm = document.querySelector("#task-form");

const taskTitleInput = document.querySelector("#task-title");
const taskDescriptionInput = document.querySelector("#task-description");
const taskCategoryInput = document.querySelector("#task-category");
const taskPriorityInput = document.querySelector("#task-priority");

// Состояние приложения
let authMode = "login";
let activePriority = "all";
let currentWorkspace = null;
let currentProject = null;

/*
    localStorage - это маленькое хранилище в браузере.
    Мы кладём туда JWT-токен, чтобы пользователь не входил заново
    после каждого обновления страницы.
*/
function getToken() {
    return localStorage.getItem("taskflow_token");
}

function saveToken(token) {
    localStorage.setItem("taskflow_token", token);
}

function removeToken() {
    localStorage.removeItem("taskflow_token");
}

/*
    Заголовок Authorization нужен backend, чтобы понять,
    какой пользователь делает запрос.
*/
function getAuthHeaders() {
    return {
        "Authorization": `Bearer ${getToken()}`,
    };
}

function getJsonAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`,
    };
}

function showAuthScreen() {
    authScreen.classList.remove("hidden");
    appPage.classList.add("hidden");
}

function showAppPage(user) {
    authScreen.classList.add("hidden");
    appPage.classList.remove("hidden");

    const userName = user.full_name || user.email;
    const firstLetter = userName.slice(0, 1).toUpperCase();

    currentUser.innerHTML = `
        <span class="current-user-avatar">${firstLetter}</span>
        <span class="current-user-name">${escapeHtml(userName)}</span>
    `;
}

function showAuthMessage(message, type = "error") {
    authMessage.innerText = message;

    if (type === "success") {
        authMessage.classList.add("success");
    } else {
        authMessage.classList.remove("success");
    }
}

function clearAuthMessage() {
    authMessage.innerText = "";
    authMessage.classList.remove("success");
}

function setAuthMode(mode) {
    authMode = mode;
    clearAuthMessage();

    if (mode === "login") {
        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        fullNameLabel.classList.add("hidden");
        fullNameInput.removeAttribute("required");

        authSubmitButton.innerText = "Войти";
    } else {
        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        fullNameLabel.classList.remove("hidden");
        fullNameInput.setAttribute("required", "required");

        authSubmitButton.innerText = "Зарегистрироваться";
    }
}

/*
    Универсальная функция для запросов к API.
    Она:
    1. отправляет запрос
    2. получает JSON
    3. если ошибка - красиво достаёт текст ошибки
*/
async function requestJson(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        let message = "Ошибка запроса";

        if (typeof data.detail === "string") {
            message = data.detail;
        }

        if (Array.isArray(data.detail)) {
            message = data.detail
                .map(function (errorItem) {
                    return errorItem.msg || "Ошибка валидации";
                })
                .join("; ");
        }

        console.error("Ошибка API:", response.status, data);

        throw new Error(message);
    }

    return data;
}

/*
    Некоторые endpoints могут вернуть просто массив:
    [ ... ]

    А некоторые могут вернуть пагинацию:
    {
        items: [ ... ],
        total: 10
    }

    Эта функция делает оба варианта нормальными.
*/
function normalizeList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data.items)) {
        return data.items;
    }

    return [];
}

// -------------------- AUTH --------------------

async function registerUser() {
    await requestJson(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
            full_name: fullNameInput.value.trim(),
        }),
    });

    showAuthMessage("Регистрация прошла успешно. Теперь войдите.", "success");
    setAuthMode("login");
}

async function loginUser() {
    const data = await requestJson(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
        }),
    });

    saveToken(data.access_token);

    const user = await getCurrentUser();

    showAppPage(user);
    await loadDashboardData();
}

async function getCurrentUser() {
    return await requestJson(`${API_URL}/auth/me`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
}

async function checkAuthOnStart() {
    const token = getToken();

    if (!token) {
        showAuthScreen();
        return;
    }

    try {
        const user = await getCurrentUser();

        showAppPage(user);
        await loadDashboardData();
    } catch (error) {
        console.error(error);
        removeToken();
        showAuthScreen();
    }
}

// -------------------- WORKSPACE / PROJECT --------------------

async function loadDashboardData() {
    currentWorkspace = await getOrCreateWorkspace();
    currentProject = await getOrCreateProject(currentWorkspace.id);

    workspaceContext.innerText = `${currentWorkspace.name} · ${currentProject.name}`;

    await loadTasks();
}

async function getOrCreateWorkspace() {
    const data = await requestJson(`${API_URL}/workspaces`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const workspaces = normalizeList(data);

    if (workspaces.length > 0) {
        return workspaces[0];
    }

    return await requestJson(`${API_URL}/workspaces`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            name: "Личное рабочее пространство",
        }),
    });
}

async function getOrCreateProject(workspaceId) {
    const data = await requestJson(`${API_URL}/projects?workspace_id=${workspaceId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const projects = normalizeList(data);

    if (projects.length > 0) {
        return projects[0];
    }

    return await requestJson(`${API_URL}/projects`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            workspace_id: workspaceId,
            name: "Основной проект",
            description: "Первый проект в TaskFlow CRM",
        }),
    });
}

// -------------------- TASKS --------------------

async function loadTasks() {
    if (!currentProject) {
        return;
    }

    const data = await requestJson(`${API_URL}/tasks?project_id=${currentProject.id}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const tasks = normalizeList(data);

    renderTasks(tasks);
}

async function createTaskFromForm() {
    if (!currentProject) {
        alert("Проект ещё не загружен");
        return;
    }

    const createdTask = await requestJson(`${API_URL}/tasks`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            project_id: currentProject.id,
            title: taskTitleInput.value.trim(),
            description: taskDescriptionInput.value.trim(),
            priority: taskPriorityInput.value,
            assignee_id: null,
            due_date: null,
        }),
    });

    renderTaskCard(createdTask);
    updateColumnCounters();
    updateStats();
    filterTasks();
}

function getTaskCards() {
    return document.querySelectorAll(".task-card");
}

function getColumns() {
    return document.querySelectorAll(".column");
}

function getColumnByStatus(status) {
    return document.querySelector(`.column[data-status="${status}"]`);
}

function clearTaskCards() {
    const cards = getTaskCards();

    cards.forEach(function (card) {
        card.remove();
    });
}

function renderTasks(tasks) {
    clearTaskCards();

    tasks.forEach(function (task) {
        renderTaskCard(task);
    });

    updateColumnCounters();
    updateStats();
    filterTasks();
}

function renderTaskCard(task) {
    const status = task.status || "todo";
    const column = getColumnByStatus(status);

    if (!column) {
        console.warn("Не найдена колонка для статуса:", status);
        return;
    }

    const taskCard = document.createElement("article");
    const color = getTaskColorByPriority(task.priority);

    taskCard.className = `task-card ${color}`;
    taskCard.dataset.priority = task.priority || "medium";
    taskCard.dataset.taskId = task.id;

    taskCard.innerHTML = `
        <div class="task-category">${getPriorityLabel(task.priority)}</div>
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description || "Без описания")}</p>

        <div class="task-progress">
            <span>Статус</span>
            <span>${getStatusLabel(status)}</span>
        </div>

        <div class="progress-line">
            <div style="width: ${getProgressByStatus(status)}%;"></div>
        </div>

        <div class="task-meta">
            <span>${formatDate(task.due_date)}</span>
            <span>ID: ${task.id}</span>
        </div>
    `;

    const addButton = column.querySelector(".add-column-button");

    column.insertBefore(taskCard, addButton);
}

function getTaskColorByPriority(priority) {
    if (priority === "high") {
        return "red";
    }

    if (priority === "low") {
        return "blue";
    }

    return "yellow";
}

function getPriorityLabel(priority) {
    if (priority === "high") {
        return "Высокий";
    }

    if (priority === "medium") {
        return "Средний";
    }

    if (priority === "low") {
        return "Низкий";
    }

    return "Средний";
}

function getStatusLabel(status) {
    if (status === "todo") {
        return "Очередь";
    }

    if (status === "in_progress") {
        return "В работе";
    }

    if (status === "done") {
        return "Выполнено";
    }

    if (status === "cancelled") {
        return "Отменено";
    }

    return status;
}

function getProgressByStatus(status) {
    if (status === "todo") {
        return 10;
    }

    if (status === "in_progress") {
        return 50;
    }

    if (status === "done") {
        return 100;
    }

    if (status === "cancelled") {
        return 0;
    }

    return 10;
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "Без срока";
    }

    return String(dateValue).slice(0, 10);
}

/*
    escapeHtml защищает интерфейс.
    Если пользователь введёт HTML-код в название задачи,
    мы покажем его как текст, а не выполним как код.
*/
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// -------------------- MODAL --------------------

function openTaskModal() {
    taskModal.classList.remove("hidden");
    taskTitleInput.focus();
}

function closeTaskModal() {
    taskModal.classList.add("hidden");
    taskForm.reset();
}

// -------------------- FILTERS / STATS --------------------

function filterTasks() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const taskCards = getTaskCards();

    taskCards.forEach(function (taskCard) {
        const taskText = taskCard.innerText.toLowerCase();
        const taskPriority = taskCard.dataset.priority;

        const matchesSearch = taskText.includes(searchValue);
        const matchesPriority =
            activePriority === "all" || taskPriority === activePriority;

        if (matchesSearch && matchesPriority) {
            taskCard.style.display = "block";
        } else {
            taskCard.style.display = "none";
        }
    });
}

function updateColumnCounters() {
    const columns = getColumns();

    columns.forEach(function (column) {
        const tasks = column.querySelectorAll(".task-card");
        const counter = column.querySelector(".column-header span");

        counter.innerText = tasks.length;
    });
}

function updateStats() {
    const allTasks = getTaskCards();
    const doneTasks = document.querySelectorAll('.column[data-status="done"] .task-card');
    const inProgressTasks = document.querySelectorAll('.column[data-status="in_progress"] .task-card');

    const statValues = document.querySelectorAll(".stat-value");
    const statTexts = document.querySelectorAll(".stat-text");

    const total = allTasks.length;
    const done = doneTasks.length;
    const inProgress = inProgressTasks.length;

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    if (statValues[0]) {
        statValues[0].innerText = `${percent}%`;
    }

    if (statTexts[0]) {
        statTexts[0].innerText = `${done} из ${total} задач выполнено`;
    }

    if (statValues[1]) {
        statValues[1].innerText = `${inProgress}`;
    }

    if (statTexts[1]) {
        statTexts[1].innerText = "Задач сейчас в работе";
    }

    if (statValues[2]) {
        statValues[2].innerText = `${total}`;
    }

    if (statTexts[2]) {
        statTexts[2].innerText = "Всего задач в проекте";
    }
}

// -------------------- EVENTS --------------------

loginTab.addEventListener("click", function () {
    setAuthMode("login");
});

registerTab.addEventListener("click", function () {
    setAuthMode("register");
});

authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    clearAuthMessage();

    try {
        if (authMode === "register") {
            await registerUser();
        } else {
            await loginUser();
        }
    } catch (error) {
        showAuthMessage(error.message);
    }
});

logoutButton.addEventListener("click", function () {
    removeToken();
    currentWorkspace = null;
    currentProject = null;
    clearTaskCards();
    showAuthScreen();
});

createTaskButton.addEventListener("click", function () {
    openTaskModal();
});

if (createCard) {
    createCard.addEventListener("click", function () {
        openTaskModal();
    });
}

const addColumnButtons = document.querySelectorAll(".add-column-button");

addColumnButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        openTaskModal();
    });
});

closeModalButton.addEventListener("click", function () {
    closeTaskModal();
});

cancelTaskButton.addEventListener("click", function () {
    closeTaskModal();
});

taskModal.addEventListener("click", function (event) {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

taskForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
        await createTaskFromForm();
        closeTaskModal();
    } catch (error) {
        alert(error.message);
    }
});

searchInput.addEventListener("input", function () {
    filterTasks();
});

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        filterButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        const buttonText = button.innerText.toLowerCase();

        if (buttonText === "все") {
            activePriority = "all";
        }

        if (buttonText === "высокий") {
            activePriority = "high";
        }

        if (buttonText === "средний") {
            activePriority = "medium";
        }

        if (buttonText === "низкий") {
            activePriority = "low";
        }

        filterTasks();
    });
});

// -------------------- START --------------------

setAuthMode("login");
updateColumnCounters();
updateStats();
checkAuthOnStart();