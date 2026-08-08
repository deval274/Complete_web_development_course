# Todo CLI Notes (`todo.js`)

Study notes for the Node.js file-handling todo app: CLI commands, reading/writing JSON, and core array methods.

**Run from:** `Handling_files_with_Nodejs` (parent of `todo/`), so `./tasks.json` resolves correctly.

```bash
cd topics/section_19/Handling_files_with_Nodejs
node todo/todo.js add "hello"
node todo/todo.js list
node todo/todo.js remove "hello"
```

---

## 1. `require("fs")` — File System module

**What:** Built-in Node module for reading and writing files.

**Why:** Persist tasks on disk in `tasks.json` so data survives after the script exits.

**Example:**

```js
const fs = require("fs");
fs.readFileSync("./tasks.json");   // read
fs.writeFileSync("./tasks.json", "[]"); // write
```

---

## 2. Relative file path

```js
const filePath = "./tasks.json";
```

**What:** Path relative to the **current working directory** (`process.cwd()`), not always the folder of `todo.js`.

**Why / when:** Simple scripts when you always run the command from a known folder.

**Gotcha:** If you `cd` into `todo/` and run `node todo.js`, `./tasks.json` looks inside `todo/`, not the parent folder.

---

## 3. `loadTasks()` — Buffer → string → JS data

```js
const dataBuffer = fs.readFileSync(filePath); // Buffer (bytes)
const dataJSON = dataBuffer.toString();       // JSON text string
const data = JSON.parse(dataJSON);            // real JS array/object
return data;
```

### Terminology

| Name | Meaning | Type |
|------|---------|------|
| **Buffer** | Raw file bytes in memory | `Buffer` |
| **JSON string** | Text that looks like JSON | `string` |
| **`JSON.parse`** | JSON string → JavaScript value | array/object |
| **`JSON.stringify`** | JavaScript value → JSON string | `string` |

### Pipeline (mental model)

```text
Disk bytes → Buffer (dataBuffer) → string (dataJSON) → parse → JS data
```

### Example

File on disk:

```json
[{"task":"how"},{"task":"are"}]
```

```js
dataBuffer; // <Buffer 5b 7b 22 74 61 73 6b ...>
dataJSON;   // '[{"task":"how"},{"task":"are"}]'
data;       // [ { task: "how" }, { task: "are" } ]
```

### Why / when / where

- **Why Buffer?** Files are bytes; Node’s default sync read returns a Buffer.
- **Why `.toString()`?** Turn bytes into readable text for `JSON.parse`.
- **Why `JSON.parse`?** So you can use `.push()`, `.filter()`, `.map()`, etc.
- **Where:** configs, caches, CLI apps, APIs storing JSON on disk.

### Shortcut (same idea)

```js
const dataJSON = fs.readFileSync(filePath, "utf8"); // already a string
const data = JSON.parse(dataJSON);
```

### `try / catch`

If the file is missing or invalid JSON, return `[]` so the app still works on first run.

```js
try {
  // read + parse
} catch (error) {
  return [];
}
```

---

## 4. `saveTasks()` — JS data → string → disk

```js
const dataJSON = JSON.stringify(tasks);
fs.writeFileSync(filePath, dataJSON);
```

**Pipeline:**

```text
JS array → stringify → JSON string → write file
```

**Example:**

```js
JSON.stringify([{ task: "hello" }]);
// '[{"task":"hello"}]'
```

**Why:** Disk stores text/bytes, not live JavaScript objects.

---

## 5. Data shapes: string array vs object array

### Plain string array

```js
tasks.push(task);
// ["hello", "how", "are"]
```

List with: `task` (the string itself).

### Object array (what this app uses)

```js
tasks.push({ task }); // shorthand for { task: task }
// [{"task":"hello"},{"task":"how"}]
```

List with: `task.task`.

**Why objects?** Easier to add fields later (`done`, `id`, `createdAt`).

**Rule:** `add`, `list`, and `remove` must all use the **same** shape.

---

## 6. `addTask(task)`

```js
const tasks = loadTasks();
tasks.push({ task });
saveTasks(tasks);
```

**What:** Load → append → save.

**`push`:** Adds an item to the **end** of an array (mutates the array).

---

## 7. `listTasks()`

```js
tasks.map((task, index) => console.log(`${index + 1}-${task.task}`));
```

**`map`:** Runs a function for each item. Here it is used mainly to print (side effect). For “only print,” `forEach` is also common.

**`index + 1`:** Convert 0-based array index to human-friendly 1, 2, 3…

**Example output:**

```text
Tasks
1-how
2-are
3-you
```

---

## 8. `removeTask(task)` — `filter`

```js
const filteredTasks = tasks.filter((t) => t.task !== task);
saveTasks(filteredTasks);
```

**`filter`:** Returns a **new** array keeping only items where the callback returns `true`.

**Example:**

```js
// remove "are"
[{ task: "how" }, { task: "are" }, { task: "you" }]
// → [{ task: "how" }, { task: "you" }]
```

### Shadowing bug to avoid

```js
// BAD — inner `task` hides the argument
tasks.filter((task) => task.task !== task);

// GOOD — different name for the loop item
tasks.filter((t) => t.task !== task);
```

---

## 9. `splice` — remove by index (optional / commented)

```js
tasks.splice(index, 1);
```

| Arg | Meaning |
|-----|---------|
| `index` | Where to start |
| `1` | How many items to delete |

**`splice`:** Changes the **original** array (mutates). Returns the removed items.

**Example:**

```js
const arr = ["how", "are", "you"];
arr.splice(1, 1); // remove "are"
// arr → ["how", "you"]
```

### `splice` vs `slice`

| Method | Changes original? | Use |
|--------|-------------------|-----|
| `splice` | Yes | Insert / delete in place |
| `slice` | No | Copy a portion |

```js
["how", "are", "you"].slice(1, 3); // ["are", "you"] — original unchanged
```

**Index caveat:** Arrays are 0-based. If the UI shows `1-how`, `2-are`, user input `2` often means “second item” → use `splice(Number(index) - 1, 1)`.

---

## 10. `process` — Node global for the running program

Object with info and controls for the current Node process.

### `process.argv` — CLI arguments

**Term:** Argument vector = strings from the command line.

```bash
node todo/todo.js add "hello"
```

| Index | Value | Meaning |
|-------|--------|---------|
| `[0]` | path to `node` | runtime |
| `[1]` | path to `todo.js` | script |
| `[2]` | `"add"` | command |
| `[3]` | `"hello"` | argument |

```js
const command = process.argv[2];
const argument = process.argv[3];
```

**When:** Building CLIs (`add` / `list` / `remove`).

**Quotes tip:** `add buy milk` → three args; `add "buy milk"` → one task string.

### `process.cwd()` — current working directory

**Term:** Folder your terminal was in when you ran `node`.

```js
console.log(process.cwd());
// e.g. .../Handling_files_with_Nodejs
```

vs `__dirname` = folder of the **script file** (`.../todo`).

**Why it matters:** `./tasks.json` is resolved from `cwd`.

### `process.env` — environment variables

**Term:** Key–value config set outside the code (shell, OS, host).

```bash
PORT=3000 NODE_ENV=production node server.js
```

```js
const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";
```

| Variable | Common use |
|----------|------------|
| `PORT` | Server port |
| `NODE_ENV` | `"development"` / `"production"` / `"test"` |

Values are **strings** (or `undefined`).

### `process.exit(code)` — stop the program

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` (non-zero) | Error / failure |

```js
if (!argument) {
  console.error("Please provide a task name");
  process.exit(1);
}
```

### `process.platform` — OS id

| Value | OS |
|-------|-----|
| `"darwin"` | macOS |
| `"win32"` | Windows |
| `"linux"` | Linux |

```js
if (process.platform === "win32") {
  // Windows-specific path/command
}
```

---

## 11. Command router (`if / else if`)

```js
if (command === "add") {
  addTask(argument);
} else if (command === "list") {
  listTasks();
} else if (command === "remove") {
  removeTask(argument);
}
```

**What:** Map CLI words to functions.

**Flow for `add "hello"`:**

1. `argv` → `command = "add"`, `argument = "hello"`
2. `loadTasks` → Buffer → string → parse
3. `push({ task: "hello" })`
4. `stringify` → write `tasks.json`
5. Log success

---

## Cheat sheet

```text
fs.readFileSync / writeFileSync  → read & write files
Buffer                           → raw bytes from disk
.toString()                      → bytes → text
JSON.parse / stringify           → text ↔ JS data
push                             → add item
map / forEach                    → loop items
filter                           → keep matching items (new array)
splice                           → delete/insert in place
slice                            → copy a portion (no mutate)
process.argv                     → CLI input
process.cwd()                    → where you ran the command from
process.env                      → external config
process.exit(n)                  → stop with status code
process.platform                 → which OS
```

---

## Practice commands

```bash
node todo/todo.js add "learn node"
node todo/todo.js add "practice fs"
node todo/todo.js list
node todo/todo.js remove "learn node"
node todo/todo.js list
```
