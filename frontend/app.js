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

let activePriority = "all";

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

updateColumnCounters();