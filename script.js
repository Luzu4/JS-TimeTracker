const apikey = config.APIKEY;
const apihost = config.APIHOST;

document.addEventListener('DOMContentLoaded', function () {
    const repository = new Repository()
    const taskView = new TaskView(document.querySelector("#app"), repository)
    const form = new Form(document.querySelector("form"), repository);

    form.onCreateTaskInRepository = (task) => {
        taskView.createSection(task.title, task.description, task.id, task.status);
    };

});

class Repository {

    deleteTask(id) {
        return fetch(apihost + "/api/tasks/" + id, {
            method: "delete",
            headers: {
                "Authorization": apikey
            }
        }).then(resp => {
            if (!resp.ok) {
                alert("Cannot delete task with such id!");
            }
            return resp.json();
        })
    }

    deleteOperationInTask(id) {
        return fetch(apihost + "/api/operations/" + id, {
            method: "delete",
            headers: {
                "Authorization": apikey,
                "Content-Type": 'application/json'
            }
        }).then(resp => {
            if (!resp.ok) {
                alert("Can't delete this operation, wrong id or the developer is wrong!!")
            }
            return resp.json();
        })
    }

    createTaskInRepository(taskName, taskDescription) {
        return fetch(apihost + "/api/tasks", {
            method: "post",
            headers: {
                Authorization: apikey,
                "Content-Type": 'application/json',
            },
            body: JSON.stringify({
                title: taskName,
                description: taskDescription,
                status: "open"
            })
        }).then(function (resp) {
            if (resp.ok) {
                return resp.json();
            } else {
                alert("Create task failed!")
                return Promise.reject(resp);
            }
        }).then(function (resp) {
            return resp.data;
        })
    }

    createOperationForTaskInRepository(operationDescription, taskId) {
        return fetch(apihost + "/api/tasks/" + taskId + "/operations", {
            method: "post",
            headers: {
                "Authorization": apikey,
                "Content-Type": 'application/json',
            },
            body: JSON.stringify({
                description: operationDescription,
                timeSpent: 0,
            })
        }).then(resp => {
            if (!resp.ok) {
                alert("Something went wrong, cant add operation for this task");
            }
            return resp.json();
        }).then(resp => {
            return resp.data;
        })
    }

    updateTimeSpentInOperation(operation, timeSpent) {
        return fetch(apihost + "/api/operations/" + operation.id, {
            method: "put",
            headers: {
                "Authorization": apikey,
                "Content-Type": 'application/json',
            },
            body: JSON.stringify({
                description: operation.description,
                timeSpent: timeSpent,
            })
        }).then(resp => {
            if (!resp.ok) {
                alert("Can update this operation!")
            }
            return resp.json()
        }).then(resp => {
            return resp.data
        })
    }

    updateTaskStatus(taskId, taskName, taskDescription) {
        return fetch(apihost + "/api/tasks/" + taskId, {
            method: "put",
            headers: {
                "Authorization": apikey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: taskName,
                description: taskDescription,
                status: "closed"
            })
        }).then(resp => {
            if (!resp.ok) {
                alert("Cant update task status");
            }

            return resp.json();
        }).then(resp => {
            return resp.data;
        })
    }

    getAllTasks() {
        return fetch(apihost + "/api/tasks", {
            headers: {
                Authorization: apikey
            }
        }).then(function (resp) {
            if (!resp.ok) {
                alert("error Something went wrong");
            }
            return resp.json()
        })
    }

    getAllOperationsOfTask(id) {
        return fetch(apihost + '/api/tasks/' + id + '/operations', {
            headers: {
                Authorization: apikey
            }
        }).then(function (resp) {
            if (!resp.ok) {
                alert("error, there is no task with such id")
            }
            return resp.json()
        }).then(function (resp) {
            return resp.data;
        })
    }
}

class Form {

    constructor(baseNode, repository) {
        this.formEl = baseNode;
        this.repository = repository;
        this.titleEl = baseNode.querySelector("input[name='title']");
        this.descriptionEl = baseNode.querySelector("input[name='description']");

        this.onCreateTaskInRepository = () => {};
        this.init();
    }

    init() {
        this.formEl.addEventListener("submit", (e) => {
            e.preventDefault();
            this.repository.createTaskInRepository(this.titleEl.value, this.descriptionEl.value)
                .then(resp => {
                    this.onCreateTaskInRepository(resp);
                    this.titleEl.value = "";
                    this.descriptionEl.value = "";
                }).catch(() => {
            });

        })
    }

}

class TaskView {

    constructor(baseNode, repository) {
        this.app = baseNode;
        this.repository = repository

        this.init();
    }

    init() {
        this.fetchInitialData();
    }

    deleteElement(id) {
        const sectionToRemove = this.app.querySelector('[data-id="' + id + '"]')
        sectionToRemove.remove();
    }

    createSection(taskName, taskDescription, id, taskStatus) {
        const section = document.createElement("section");
        section.classList.add("card", "mt-5", "shadow-sm");
        section.dataset.id = id;
        const cardHeader = this.createCardHeader(taskName, taskDescription, id, taskStatus);
        section.appendChild(cardHeader);
        const operations = this.createOperationsInTask(id, taskStatus);
        section.appendChild(operations);
        if (taskStatus === "open") {
            const cardBody = this.createBody(id);
            section.appendChild(cardBody);
        }
        this.app.appendChild(section);

    }

    createCardHeader(name, description, id, status) {
        const cardHeader = document.createElement("div");
        cardHeader.classList.add("card-header", "d-flex", "justify-content-between", "align-items-center");
        const divH = document.createElement("div");
        const nameOfTask = document.createElement("h5")
        nameOfTask.innerText = name;
        divH.appendChild(nameOfTask);
        const descriptionOfTask = document.createElement("h6");
        descriptionOfTask.innerText = description;
        divH.appendChild(descriptionOfTask);
        cardHeader.appendChild(divH);

        const divButtons = document.createElement("div");
        if (status === "open") {
            const finishButton = document.createElement("button");
            finishButton.classList.add("btn", "btn-dark", "btn-sm");
            finishButton.innerText = "Finish";
            finishButton.addEventListener("click", (e) => {
                this.repository.updateTaskStatus(id, name, description).then(() => {
                    const bodyToRemove = e.target.closest("section").querySelector("div.card-body");
                    const operationsButtonToRemove = e.target.closest("section").querySelector("ul.list-group");
                    operationsButtonToRemove.querySelectorAll("button").forEach(button => button.remove())
                    bodyToRemove.remove();
                    e.target.remove();
                })
            })
            divButtons.appendChild(finishButton);
        }
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("btn", "btn-outline-danger", "btn-sm", "ml-2");
        deleteButton.innerText = "DELETE"
        deleteButton.addEventListener("click", () => {

            this.repository.deleteTask(id).then(() => {
                this.deleteElement(id);
            })
        })

        divButtons.appendChild(deleteButton);

        cardHeader.appendChild(divButtons);
        return cardHeader;
    }

    changeMinAtHoursAndMinToShow(min) {
        const hours = Math.floor(parseInt(min) / 60)
        const minutes = parseInt(min) - (60 * hours)
        return hours + "h " + minutes + "m";
    }

    viewUpdateTimeSpentInOperation(operation, minutesToAdd) {
        const timeSpent = parseInt(operation.timeSpent) + parseInt(minutesToAdd);
        this.repository.updateTimeSpentInOperation(operation, timeSpent).then(resp => {
            operation.timeSpent = resp.timeSpent;
            document.querySelector("li[data-id='" + operation.id + "']")
                .querySelector("span").innerText = this.changeMinAtHoursAndMinToShow(resp.timeSpent);
        })
    }

    createOperationInTask(operation, taskStatus) {
        const li = document.createElement("li");
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center')
        li.dataset.id = operation.id;
        const divText = document.createElement("div");
        divText.innerText = operation.description;
        const span = document.createElement("span");
        span.classList.add('badge', 'badge-success', 'badge-pill', 'ml-2');
        span.innerText = this.changeMinAtHoursAndMinToShow(operation.timeSpent);
        divText.appendChild(span);
        li.appendChild(divText);
        if (taskStatus === "open") {
            const buttonDiv = document.createElement("div");
            const fifteenButton = document.createElement("button");
            const oneHourButton = document.createElement("button");
            const deleteButton = document.createElement("button");
            fifteenButton.classList.add('btn', 'btn-outline-success', 'btn-sm', 'mr-2')
            fifteenButton.innerText = "+15m";
            fifteenButton.addEventListener("click", () => {
                    this.viewUpdateTimeSpentInOperation(operation, 15);
                }
            )

            oneHourButton.classList.add('btn', 'btn-outline-success', 'btn-sm', 'mr-2')
            oneHourButton.innerText = "+1h";
            oneHourButton.addEventListener("click", () => {
                    this.viewUpdateTimeSpentInOperation(operation, 60);
                }
            )
            deleteButton.classList.add('btn', 'btn-outline-danger', 'btn-sm')
            deleteButton.innerText = "Delete";
            deleteButton.addEventListener("click", () => {
                this.repository.deleteOperationInTask(operation.id).then(() => {
                        this.deleteElement(operation.id)
                    }
                )
            })
            buttonDiv.appendChild(fifteenButton);
            buttonDiv.appendChild(oneHourButton);
            buttonDiv.appendChild(deleteButton);
            li.appendChild(buttonDiv);
        }

        return li;


    }

    createOperationsInTask(id, taskStatus) {
        const ulOfOperations = document.createElement("ul");
        ulOfOperations.classList.add('list-group', 'list-group-flush');
        this.repository.getAllOperationsOfTask(id).then((operations) => {
            operations.forEach(operation => {
                ulOfOperations.appendChild(this.createOperationInTask(operation, taskStatus));
            })
        })

        return ulOfOperations;


    }

    createBody(id) {

        const divBody = document.createElement("div");
        divBody.classList.add("card-body");
        const form = document.createElement("form");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (input.value.length < 1) {
                alert("Description of operation is too short");
            } else {
                this.repository.createOperationForTaskInRepository(input.value, id)
                    .then(resp => {
                        document.querySelector("[data-id='" + id + "']")
                            .querySelector("ul")
                            .appendChild(this.createOperationInTask(resp, "open"));
                        input.value = "";
                    })
            }

        })
        const divForm = document.createElement("div");
        divForm.classList.add("input-group");
        const input = document.createElement("input");
        input.classList.add("form-control");
        input.setAttribute("type", "text");
        input.setAttribute("placeholder", "Operation Description");
        input.setAttribute("minlength", "5");
        divForm.appendChild(input);
        const divInput = document.createElement("div");
        divInput.classList.add("input-group-append")
        const addButton = document.createElement("button");
        addButton.classList.add("btn", "btn-info");
        addButton.innerText = "Add";
        divInput.appendChild(addButton);
        divForm.appendChild(divInput);
        form.appendChild(divForm);
        divBody.appendChild(form);
        return divBody;
    }

    fetchInitialData() {
        this.repository.getAllTasks().then((tasks) => {
            this.createListOfTasks(tasks.data);
        });
    }

    createListOfTasks(tasks) {
        tasks.forEach((task) => {
            this.createSection(task.title, task.description, task.id, task.status);
        })

    }

}
