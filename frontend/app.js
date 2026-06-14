console.log("TaskFlow JS loaded");
const API_URL = "http://127.0.0.1:8000/api/v1";

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

const currentUser = document.querySelector("#current-user");
const logoutButton = document.querySelector("#logout-button");

const createTaskButton = document.querySelector("#create-task-button");
const searchInput = document.querySelector(".search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const firstColumn = document.querySelector(".column");

const taskModal = document.querySelector("#task-modal");
const closeModalButton = document.querySelector("#close-modal-button");
const cancelTaskButton = document.querySelector("#cancel-task-button");
const taskForm = document.querySelector("#task-form");

const taskTitleInput = document.querySelector("#task-title");
const taskDescriptionInput = document.querySelector("#task-description");
const taskCategoryInput = document.querySelector("#task-category");
const taskPriorityInput = document.querySelector("#task-priority");

let authMode = "login";
let activePriority = "all";

function getToken() {
    return localStorage.getItem("taskflow_token");
}

function saveToken(token) {
    localStorage.setItem("taskflow_token", token);
}

function removeToken() {
    localStorage.removeItem("taskflow_token");
}

function showAuthScreen() {
    authScreen.classList.remove("hidden");
    appPage.classList.add("hidden");
}

function showAppPage(user) {
    authScreen.classList.add("hidden");
    appPage.classList.remove("hidden");

    currentUser.innerText = user.full_name || user.email;
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
                    return errorItem.msg || "упс.... кажись неверный пароль или ещё что-то";
                })
                .join("; ");
        }

        throw new Error(message);
    }

    return data;
}

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
}

async function getCurrentUser() {
    return await requestJson(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${getToken()}`,
        },
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
    } catch (error) {
        removeToken();
        showAuthScreen();
    }
}

function getTaskCards() {
    return document.querySelectorAll(".task-card");
}

function openTaskModal() {
    taskModal.classList.remove("hidden");
    taskTitleInput.focus();
}

function closeTaskModal() {
    taskModal.classList.add("hidden");
    taskForm.reset();
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

function createTaskCard(task) {
    const taskCard = document.createElement("article");

    const color = getTaskColorByPriority(task.priority);

    taskCard.className = `task-card ${color}`;
    taskCard.dataset.priority = task.priority;

    taskCard.innerHTML = `
        <div class="task-category">${task.category}</div>
        <h3>${task.title}</h3>
        <p>${task.description}</p>

        <div class="task-progress">
            <span>Чек-лист</span>
            <span>0 из 3</span>
        </div>

        <div class="progress-line">
            <div style="width: 10%;"></div>
        </div>

        <div class="task-meta">
            <span>${task.date}</span>
            <span>0 / 8 ч.</span>
        </div>
    `;

    const addButton = firstColumn.querySelector(".add-column-button");

    firstColumn.insertBefore(taskCard, addButton);

    updateColumnCounters();
    filterTasks();
}

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
    const columns = document.querySelectorAll(".column");

    columns.forEach(function (column) {
        const tasks = column.querySelectorAll(".task-card");
        const counter = column.querySelector(".column-header span");

        counter.innerText = tasks.length;
    });
}

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
    showAuthScreen();
});

createTaskButton.addEventListener("click", function () {
    openTaskModal();
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

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const task = {
        title: taskTitleInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        category: taskCategoryInput.value,
        priority: taskPriorityInput.value,
        date: new Date().toISOString().slice(0, 10),
    };

    createTaskCard(task);
    closeTaskModal();
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

setAuthMode("login");
updateColumnCounters();
checkAuthOnStart();