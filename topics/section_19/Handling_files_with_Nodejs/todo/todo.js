const fs = require("fs");
const filePath = "./tasks.json";

const loadTasks = () => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    return [];
  }
};

const saveTasks = (tasks) => {
  const dataJSON = JSON.stringify(tasks);
  fs.writeFileSync(filePath, dataJSON);
};

const addTask = (task) => {
  const tasks = loadTasks();

  //tasks.push(task); // this is code for list out task without object but as pure array lis ["hello","how","are","you"]

  tasks.push({ task }); // this is code for list out task with object like [{"task":"hello"},{"task":"how"},{"task":"are"},{"task":"you"}]
  saveTasks(tasks);
  console.log(`Task "${task}" added successfully`);
};

// this is code for list out task with object like [{"task":"hello"},{"task":"how"},{"task":"are"},{"task":"you"}]
const listTasks = () => {
  const tasks = loadTasks();
  console.log("Tasks");
  tasks.map((task, index) => console.log(`${index + 1}-${task.task}`));
  console.log(process.cwd());
};

// this is code for list out task without object but as pure array lis ["hello","how","are","you"]
// const listTasks = () => {
//   const tasks = loadTasks();
//   console.log("Tasks");
//   tasks.map((task, index) => console.log(`${index + 1}-${task}`));
// };

const removeTask = (task) => {
  const tasks = loadTasks();
  const filteredTasks = tasks.filter((t) => t.task !== task);
  saveTasks(filteredTasks);
  console.log(`Task "${task}" removed successfully`);
};

// const removeTaskByIndex = (index) => {
//   const tasks = loadTasks();
//   tasks.splice(index, 1); // how this works?
//   saveTasks(tasks);
//   console.log(`Task at index ${index} removed successfully`);
// };

const command = process.argv[2];
const argument = process.argv[3];
const cwd = process.cwd();

if (command === "add") {
  if (!argument) {
    console.log("Please provide a task name");
    process.exit(1);
  }
  console.log("ok");
  process.exit(0);
  addTask(argument);
} else if (command === "list") {
  listTasks();
} else if (command === "remove") {
  removeTask(argument);
  //removeTaskByIndex(argument);
}
