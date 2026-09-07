const toast = document.getElementById("toast");
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
};

const openModal = (id) => document.getElementById(id).classList.add("open");
const closeModal = (element) => element.classList.remove("open");

document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === tab.dataset.page));
  };
});

["proof", "measurement", "report"].forEach((name) => {
  document.getElementById("add" + (name === "measurement" ? "Measurement" : name === "proof" ? "Proof" : ""))?.addEventListener("click", () => openModal(name + "Modal"));
});
document.getElementById("viewReport").onclick = () => openModal("reportModal");
document.querySelectorAll(".close").forEach((button) => button.onclick = () => closeModal(button.closest(".backdrop")));
document.querySelectorAll(".backdrop").forEach((modal) => modal.onclick = (event) => { if (event.target === modal) closeModal(modal); });
document.getElementById("proofForm").onsubmit = (event) => { event.preventDefault(); closeModal(proofModal); showToast("Work proof saved"); };
document.getElementById("measurementForm").onsubmit = (event) => { event.preventDefault(); closeModal(measurementModal); showToast("Measurement saved"); };

function calculateArea() {
  const area = (Number(length.value) || 0) * (Number(width.value) || 0);
  areaValue.textContent = area.toFixed(2) + " m²";
}
length.oninput = calculateArea;
width.oninput = calculateArea;

// Sidebar and projects
const sidebar = document.createElement("aside");
sidebar.className = "project-sidebar";
sidebar.innerHTML = '<div class="side-brand"><b>R</b><span>reno.</span><button class="sidebar-close">Close</button></div><p>YOUR PROJECTS</p><button class="project-item active">Hillside Residence<small>68% complete</small></button><button class="project-item">The Maple House<small>42% complete</small></button><button class="project-item">88 Jalan Aman<small>85% complete</small></button><button class="new-project">+ New project</button>';
document.body.prepend(sidebar);

const expandButton = document.createElement("button");
expandButton.className = "sidebar-toggle";
expandButton.textContent = "Menu";
document.body.prepend(expandButton);

function setSidebarCollapsed(value) {
  sidebar.classList.toggle("collapsed", value);
  document.body.classList.toggle("sidebar-is-collapsed", value);
}
if (innerWidth < 900) setSidebarCollapsed(true);
expandButton.onclick = () => setSidebarCollapsed(false);
sidebar.querySelector(".sidebar-close").onclick = () => setSidebarCollapsed(true);

function selectProject(button, project) {
  sidebar.querySelectorAll(".project-item").forEach((item) => item.classList.toggle("active", item === button));
  const name = project ? project.name : button.childNodes[0].textContent.trim();
  document.querySelector(".current-project").textContent = name;
  document.querySelector("#projects h1").textContent = name;

  if (project) {
    document.querySelector("#projects .hero").innerHTML =
      "<span>" + project.phase + " · " + project.address + "</span><b>New project</b><h2>0% complete</h2>" +
      '<div class="bar"><i style="width: 0%"></i></div><p>' + project.owner + " · Starts " + project.start + " · Due " + project.due + "</p>";
  }
  showToast("Switched to " + name);
}

sidebar.querySelectorAll(".project-item").forEach((button) => button.onclick = () => selectProject(button));

const projectModal = document.createElement("div");
projectModal.id = "projectModal";
projectModal.className = "backdrop";
projectModal.innerHTML = '<form class="modal" id="projectForm"><button type="button" class="close form-close">×</button><p class="eyebrow">PROJECT SETUP</p><h2>Create a new project</h2><label>Project name<input id="projectName" required></label><label>Client / owner name<input id="projectOwner" required></label><label>Address<input id="projectAddress" required></label><div class="project-dates"><label>Start date<input id="projectStart" type="date" required></label><label>Due date<input id="projectDue" type="date" required></label></div><label>Project phase<select id="projectPhase"><option>Planning</option><option selected>Renovation</option><option>Finishes</option><option>Handover</option></select></label><div class="modal-actions"><button type="button" class="cancel-project">Cancel</button><button class="save">Save project</button></div></form>';
document.body.append(projectModal);

function closeProjectForm() {
  closeModal(projectModal);
  projectForm.reset();
}
sidebar.querySelector(".new-project").onclick = () => openModal("projectModal");
projectModal.querySelector(".form-close").onclick = closeProjectForm;
projectModal.querySelector(".cancel-project").onclick = closeProjectForm;
projectModal.onclick = (event) => { if (event.target === projectModal) closeProjectForm(); };
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeProjectForm(); });

projectForm.onsubmit = (event) => {
  event.preventDefault();
  const project = { name: projectName.value, owner: projectOwner.value, address: projectAddress.value, start: projectStart.value, due: projectDue.value, phase: projectPhase.value };
  const button = document.createElement("button");
  button.className = "project-item";
  button.innerHTML = project.name + "<small>0% complete</small>";
  sidebar.querySelector(".new-project").before(button);
  button.onclick = () => selectProject(button, project);
  closeProjectForm();
  selectProject(button, project);
};

// Draggable task board
const columns = [
  ["To do", "Install kitchen cabinetry", "Carpentry · Level 1 Kitchen", "Mason Co.", "Sep 07", "High"],
  ["In progress", "Electrical rough-in", "Electrical · Level 2 Bedrooms", "Bright Wire", "Sep 06", "High"],
  ["Review", "Waterproof shower recess", "Waterproofing · Master ensuite", "SealPro", "Sep 05", "Normal"],
  ["Approved", "Demolish old pantry wall", "Demolition · Level 1", "BuildRight", "Sep 04", "Normal"]
];

function taskCard(task, approved) {
  return '<article class="task-card" draggable="true"><span class="priority ' + task[5].toLowerCase() + '">' + task[5] + "</span><h3>" + task[1] + "</h3><p>" + task[2] + "</p><div>Contractor: " + task[3] + "<b>" + task[4] + "</b></div><footer>Photos: 4 <em>" + (approved ? "Approved" : "Awaiting approval") + "</em></footer>" + (approved ? '<div class="payment">Eligible for payment</div>' : "") + "</article>";
}

taskPage.innerHTML = '<div class="heading"><div><p class="eyebrow">WORKFLOW BOARD</p><h1>Tasks</h1></div></div><div class="board">' +
  columns.map((task) => '<section class="board-column ' + (task[0] === "Approved" ? "approved-column" : "") + '"><header><h2>' + task[0] + ' <span>1</span></h2></header><div class="drop-zone">' + taskCard(task, task[0] === "Approved") + "</div></section>").join("") + "</div>";

let draggedCard;
document.querySelectorAll(".task-card").forEach((card) => card.ondragstart = () => { draggedCard = card; });
document.querySelectorAll(".drop-zone").forEach((zone) => {
  zone.ondragover = (event) => event.preventDefault();
  zone.ondrop = (event) => {
    event.preventDefault();
    zone.append(draggedCard);
    document.querySelectorAll(".board-column").forEach((column) => {
      const cards = column.querySelectorAll(".task-card");
      column.querySelector("h2 span").textContent = cards.length;
      cards.forEach((card) => card.querySelector(".payment")?.remove());
      if (column.classList.contains("approved-column")) cards.forEach((card) => card.insertAdjacentHTML("beforeend", '<div class="payment">Eligible for payment</div>'));
    });
    showToast("Task moved");
  };
});

// Plans and Markups workspace
const planWorkspace = document.getElementById("planWorkspace");
const pinsLayer = document.getElementById("pinsLayer");
const pinList = document.getElementById("pinList");
const canvas = document.getElementById("markupCanvas");
const context = canvas.getContext("2d");
let activeTool = "arrow";
let drawingStart = null;
let pinNumber = 0;

const samplePins = [
  { title: "Island power outlet", category: "M&E", description: "Confirm pop-up outlet position before stone templating.", contractor: "Bright Wire", status: "Open", approval: "Awaiting approval", x: 49, y: 47 },
  { title: "Pantry tall units", category: "Built-in", description: "Verify internal shelf layout against owner selection.", contractor: "Mason Co.", status: "In progress", approval: "Not requested", x: 25, y: 24 },
  { title: "Fridge clearance", category: "Appliance", description: "Maintain 20 mm ventilation clearance to adjacent tall unit.", contractor: "Mason Co.", status: "Open", approval: "Approved", x: 75, y: 26 }
];

function resizeCanvas() {
  canvas.width = planWorkspace.clientWidth;
  canvas.height = planWorkspace.clientHeight;
}

function addPin(pin) {
  pinNumber += 1;
  const button = document.createElement("button");
  button.className = "plan-pin";
  button.textContent = pinNumber;
  button.style.left = pin.x + "%";
  button.style.top = pin.y + "%";
  button.title = pin.title;
  button.onclick = () => showToast(pin.title + ": " + pin.status);
  pinsLayer.append(button);

  const item = document.createElement("article");
  item.className = "pin-item";
  item.innerHTML = "<h3>" + pinNumber + ". " + pin.title + "</h3><p>" + pin.category + " · " + pin.status + "</p><small>" + pin.contractor + " · " + pin.approval + "</small>";
  item.onclick = () => button.click();
  pinList.append(item);
}

samplePins.forEach(addPin);
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

document.querySelectorAll(".plan-view").forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll(".plan-view").forEach((item) => item.classList.toggle("active", item === button));
    planWorkspace.classList.toggle("original-mode", button.dataset.view === "original");
  };
});

document.querySelectorAll(".drawing-tools button").forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll(".drawing-tools button").forEach((item) => item.classList.toggle("active", item === button));
    activeTool = button.dataset.tool;
    canvas.style.pointerEvents = "auto";
  };
});

function pointFromEvent(event) {
  const box = canvas.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

canvas.addEventListener("pointerdown", (event) => {
  drawingStart = pointFromEvent(event);
  canvas.setPointerCapture(event.pointerId);
  context.strokeStyle = "#dc6840";
  context.lineWidth = 3;
  context.lineCap = "round";
  if (activeTool === "freehand") {
    context.beginPath();
    context.moveTo(drawingStart.x, drawingStart.y);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!drawingStart || activeTool !== "freehand") return;
  const point = pointFromEvent(event);
  context.lineTo(point.x, point.y);
  context.stroke();
});

canvas.addEventListener("pointerup", (event) => {
  if (!drawingStart) return;
  const end = pointFromEvent(event);
  const width = end.x - drawingStart.x;
  const height = end.y - drawingStart.y;
  context.strokeStyle = "#dc6840";
  context.lineWidth = 3;

  if (activeTool === "arrow") {
    const angle = Math.atan2(height, width);
    context.beginPath();
    context.moveTo(drawingStart.x, drawingStart.y);
    context.lineTo(end.x, end.y);
    context.lineTo(end.x - 12 * Math.cos(angle - 0.5), end.y - 12 * Math.sin(angle - 0.5));
    context.moveTo(end.x, end.y);
    context.lineTo(end.x - 12 * Math.cos(angle + 0.5), end.y - 12 * Math.sin(angle + 0.5));
    context.stroke();
  } else if (activeTool === "box") {
    context.strokeRect(drawingStart.x, drawingStart.y, width, height);
  } else if (activeTool === "circle") {
    context.beginPath();
    context.ellipse(drawingStart.x + width / 2, drawingStart.y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2);
    context.stroke();
  }
  drawingStart = null;
});

document.getElementById("addPin").onclick = () => openModal("pinModal");
document.getElementById("pinForm").onsubmit = (event) => {
  event.preventDefault();
  addPin({
    title: pinTitle.value,
    category: pinCategory.value,
    description: pinDescription.value,
    contractor: pinContractor.value || "Unassigned",
    status: pinStatus.value,
    approval: pinApproval.value,
    x: 52,
    y: 58
  });
  closeModal(document.getElementById("pinModal"));
  event.target.reset();
  showToast("Plan pin added");
};

document.getElementById("planUpload").onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type === "application/pdf") {
    document.getElementById("samplePlan").innerHTML = '<span class="plan-title">PDF PLAN: ' + file.name + "</span><div class='pdf-placeholder'>PDF layout loaded<br><small>Use the original document for detailed viewing.</small></div>";
  } else {
    const reader = new FileReader();
    reader.onload = () => {
      const plan = document.getElementById("samplePlan");
      plan.style.backgroundImage = "url(" + reader.result + ")";
      plan.style.backgroundSize = "contain";
      plan.style.backgroundPosition = "center";
      plan.style.backgroundRepeat = "no-repeat";
      plan.innerHTML = '<span class="plan-title">UPLOADED PLAN: ' + file.name + "</span>";
    };
    reader.readAsDataURL(file);
  }
  showToast("Plan uploaded");
};
