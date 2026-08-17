# Event Logger Notes (`logger.js`)

Study notes for the Node.js event-driven logger: `EventEmitter`, custom events, writing to a file, and reading system memory.

**Run from:** `Event_driven_arch_EventLogger` (the folder that contains `logger.js`), so `./eventlog.txt` is created next to the script.

```bash
cd topics/section_19/Event_driven_arch_EventLogger
node logger.js
```

The script never exits on its own (a timer keeps running). Stop it with `Ctrl + C`.

After it runs, open `eventlog.txt` in the same folder. You should see lines like:

```text
2026-08-17T06:16:01.123Z - Application Started
2026-08-17T06:16:01.125Z - Application event occured
2026-08-17T06:16:04.126Z - Current memory usage: 42.18
2026-08-17T06:16:07.128Z - Current memory usage: 41.97
```

---

## 0. Big picture — what this file does

This script is a tiny **event-driven logger**.

1. You call `logger.log("some text")`.
2. That does **not** write to a file directly.
3. It **emits** (fires) an event named `"message"`.
4. A listener function (`logToFile`) is waiting for `"message"`.
5. When the event fires, the listener appends a timestamped line to `eventlog.txt`.

That pattern — **emit an event, let listeners react** — is called **event-driven architecture**.

It is the same idea as a button click in the browser:

```text
You click a button  →  "click" event fires  →  your handler runs
You call logger.log →  "message" event fires →  logToFile writes the file
```

### Why not just write the file inside `log()`?

You could. This demo separates **announcing that something happened** from **what to do about it**.

Later you could add more listeners without changing `log()`:

- write to a file
- print to the console
- send an email
- count how many logs happened

One emit, many reactions.

---

## 1. The three Node.js modules

```js
const fs = require("fs");
const os = require("os");
const EventEmitter = require("events");
```

`require(...)` loads a built-in Node.js module. You do not install these with npm.

| Module | Full name | What this file uses it for |
|--------|-----------|----------------------------|
| `fs` | File System | Append log lines to `eventlog.txt` |
| `os` | Operating System | Read free memory and total memory |
| `events` | Events | Create and listen to custom events |

### Tiny examples (each module on its own)

**`fs` — append text to a file**

```js
const fs = require("fs");
fs.appendFileSync("./eventlog.txt", "hello\n");
```

`appendFileSync` means: add this text to the end of the file, and **wait until it is written** before continuing. If the file does not exist, Node creates it.

**`os` — ask the computer about itself**

```js
const os = require("os");
console.log(os.freemem());  // free RAM in bytes, e.g. 2147483648
console.log(os.totalmem()); // total RAM in bytes, e.g. 8589934592
```

**`events` — fire a custom event and listen for it**

```js
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("hello", (data) => {
  console.log("got:", data);
});

emitter.emit("hello", { name: "Deva" });
// prints: got: { name: 'Deva' }
```

---

## 2. Event-driven architecture (the idea)

### Two styles of code

**Direct (what you already know):**

```js
function log(message) {
  fs.appendFileSync("./eventlog.txt", message);
}

log("Application Started"); // this function itself writes the file
```

The caller and the file-writing are tightly coupled. `log()` **does** the work.

**Event-driven (what this file uses):**

```js
logger.log("Application Started"); // only announces: "a message happened"
// someone else (a listener) decides what to do
```

The logger **announces**. Listeners **react**.

### Vocabulary

| Word | Meaning | In this file |
|------|---------|--------------|
| **Event** | A named signal that something happened | `"message"` |
| **Emit** | Fire / publish that event | `this.emit("message", { message })` |
| **Listener / handler** | Function that runs when the event fires | `logToFile` |
| **Subscribe / `on`** | Register a listener | `logger.on("message", logToFile)` |
| **Payload / data** | Extra info sent with the event | `{ message: "Application Started" }` |
| **EventEmitter** | Object that can emit events and hold listeners | `Logger` (and `logger`) |

### Mental model

```text
          emit("message", { message: "..." })
  Logger --------------------------------------> Event bus
                                                    |
                                                    |  on("message", ...)
                                                    v
                                              logToFile(event)
                                                    |
                                                    v
                                            eventlog.txt
```

`on` must happen **before** `emit`, or the event fires with nobody listening and the data is lost.

---

## 3. `class Logger extends EventEmitter`

```js
class Logger extends EventEmitter {
  log(message) {
    this.emit("message", { message });
  }
}
```

### What is a class?

A **class** is a blueprint. `new Logger()` creates one object from that blueprint.

```js
const logger = new Logger(); // one real logger object
```

### What does `extends EventEmitter` mean?

`Logger` **inherits** everything `EventEmitter` already has, including:

- `.on(eventName, callback)` — listen
- `.emit(eventName, data)` — fire
- `.off(...)` / `.removeListener(...)` — stop listening (not used here)

So a `Logger` **is an** EventEmitter, plus a convenience method called `log`.

Without inheritance you would write:

```js
const logger = new EventEmitter();
logger.emit("message", { message: "hi" });
```

With the class, the rest of the code can say the clearer thing:

```js
logger.log("hi");
```

### What does `log(message)` actually do?

```js
log(message) {
  this.emit("message", { message });
}
```

Step by step:

1. Someone calls `logger.log("Application Started")`.
2. Inside the method, `message` is the string `"Application Started"`.
3. `{ message }` is shorthand for `{ message: message }`, so the object is:

```js
{ message: "Application Started" }
```

4. `this.emit("message", { message })` fires the event named `"message"` and passes that object as data.
5. `log()` itself does **not** touch the file.

`this` means "this logger object" (`logger`).

### Why wrap the string in an object?

```js
this.emit("message", { message });
```

instead of:

```js
this.emit("message", message); // also works
```

An object is easier to extend later:

```js
this.emit("message", { message, level: "info", userId: 12 });
```

The listener already expects `event.message`, so extra fields would not break it.

---

## 4. Creating the logger and choosing the file

```js
const logger = new Logger();
const logFile = "./eventlog.txt";
```

| Line | Meaning |
|------|---------|
| `new Logger()` | Create one logger instance. All `.on` and `.log` calls use this same object. |
| `"./eventlog.txt"` | Relative path. File is created in the **current working directory** (where you ran `node`), not always next to `logger.js`. |

**Gotcha:** If you run `node Event_driven_arch_EventLogger/logger.js` from the repo root, `eventlog.txt` appears in the repo root. `cd` into the folder first.

---

## 5. The listener: `logToFile`

```js
const logToFile = (event) => {
  const logMessage = `${new Date().toISOString()} - ${event.message}\n`;
  fs.appendFileSync(logFile, logMessage);
};
```

This is a normal function. It becomes a listener only because it is passed to `.on` later.

### Parameter `event`

When `emit` runs:

```js
this.emit("message", { message: "Application Started" });
```

Node calls:

```js
logToFile({ message: "Application Started" });
```

So inside the function:

```js
event.message; // "Application Started"
```

### Building the line

```js
const logMessage = `${new Date().toISOString()} - ${event.message}\n`;
```

| Piece | Example | Why |
|-------|---------|-----|
| `new Date()` | current date/time object | "when did this happen?" |
| `.toISOString()` | `2026-08-17T06:16:01.123Z` | Standard UTC timestamp, easy to sort |
| ` - ` | separator | Readable |
| `event.message` | `Application Started` | The actual log text |
| `\n` | newline | Each log is its own line in the file |

Result:

```text
2026-08-17T06:16:01.123Z - Application Started
```

### `fs.appendFileSync(logFile, logMessage)`

| Part | Meaning |
|------|---------|
| `appendFile` | Add to the **end**. Do not overwrite the whole file. |
| `Sync` | Blocking: wait until the write finishes, then continue. |

If the file is missing, Node creates it. If it already exists, new lines are added at the bottom. That is why restarting the script does not wipe old logs.

**Sync vs async (good to know):**

```js
fs.appendFileSync(path, text);           // wait, then next line runs
fs.appendFile(path, text, callback);     // do not wait; callback later
```

This demo uses Sync because the script is small and a missed log would be confusing.

---

## 6. Wiring the listener: `logger.on(...)`

```js
logger.on("message", logToFile);
```

English: "Whenever this logger emits `"message"`, run `logToFile`."

You can register more than one listener for the same event:

```js
logger.on("message", logToFile);
logger.on("message", (event) => {
  console.log("also print:", event.message);
});
```

Then one `logger.log("hi")` would **both** write the file **and** print to the terminal.

### `on` vs `emit` (easy to mix up)

```js
logger.on("message", logToFile);   // subscribe / listen  (set up)
logger.log("hi");                  // which internally emits (fire)
```

| Method | Role | Analogy |
|--------|------|---------|
| `.on(name, fn)` | "When name happens, run fn" | Putting a doorbell camera up |
| `.emit(name, data)` | "Name just happened, here is data" | Pressing the doorbell |

If you emit before you call `.on`, the event is gone. Nobody was listening yet.

That is why this file registers `logger.on` **before** the `logger.log(...)` calls at the bottom.

---

## 7. The memory timer: `setInterval`

```js
setInterval(() => {
  const memoryUsage = (os.freemem() / os.totalmem()) * 100;
  logger.log(`Current memory usage: ${memoryUsage.toFixed(2)}`);
}, 3000);
```

### What `setInterval` does

```js
setInterval(callback, delayInMilliseconds);
```

Run `callback` again and again, waiting `delay` ms between runs.

`3000` ms = 3 seconds.

This is why the program does not exit. Node keeps the process alive while a timer is active.

### Memory math

```js
const memoryUsage = (os.freemem() / os.totalmem()) * 100;
```

| Call | Returns | Unit |
|------|---------|------|
| `os.freemem()` | RAM currently free | bytes |
| `os.totalmem()` | Installed RAM | bytes |

Example:

```text
freemem  = 4_000_000_000
totalmem = 8_000_000_000

4_000_000_000 / 8_000_000_000 = 0.5
0.5 * 100 = 50
```

So `memoryUsage` is **percent of RAM that is free**, not percent used.

`.toFixed(2)` turns `42.18391...` into the string `"42.18"` (two decimal places).

The template string becomes:

```text
Current memory usage: 42.18
```

Then `logger.log(...)` emits `"message"`, and `logToFile` writes it.

**Note:** The log line does not include a `%` sign. The number is still a percentage.

---

## 8. The two startup logs

```js
logger.log("Application Started");
logger.log("Application event occured");
```

These run **once**, immediately, when the script starts.

Then every 3 seconds the interval adds another memory line.

Startup order in the file:

1. Define `Logger`
2. Create `logger`
3. Define `logToFile`
4. `logger.on("message", logToFile)` ← listen first
5. Start the 3-second timer
6. Log "Application Started"
7. Log "Application event occured"

`setInterval` is **scheduled** in step 5, but its first run waits 3 seconds. So the two startup lines are written first.

---

## 9. Full flow diagram

```text
                    node logger.js
                           |
                           v
              +------------------------+
              | Create Logger          |
              | logger.on("message",   |
              |           logToFile)   |
              +------------------------+
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
  logger.log("Application          setInterval every 3s
  Started")                        compute free RAM %
  logger.log("Application          logger.log("Current
  event occured")                  memory usage: ...")
          |                                 |
          +----------------+----------------+
                           |
                           v
              logger.log(text)
                           |
                           v
              this.emit("message", { message: text })
                           |
                           v
              logToFile(event)
                           |
                           v
              "TIMESTAMP - text\n"
                           |
                           v
              fs.appendFileSync("./eventlog.txt", ...)
                           |
                           v
                    eventlog.txt
```

### Sequence (first few seconds)

```text
t = 0s   Application Started
t = 0s   Application event occured
t = 3s   Current memory usage: 42.18
t = 6s   Current memory usage: 41.97
t = 9s   Current memory usage: 43.02
...      (until you press Ctrl + C)
```

---

## 10. Line-by-line walkthrough of `logger.js`

### Lines 1–4 — imports

```js
const fs = require("fs");
const os = require("os");
const EventEmitter = require("events");
```

Load tools: files, system info, events.

### Lines 6–10 — Logger class

```js
class Logger extends EventEmitter {
  log(message) {
    this.emit("message", { message });
  }
}
```

A logger that can emit `"message"` events.

### Lines 12–13 — instance and file path

```js
const logger = new Logger();
const logFile = "./eventlog.txt";
```

One logger. Logs go to `eventlog.txt`.

### Lines 15–18 — the file writer

```js
const logToFile = (event) => {
  const logMessage = `${new Date().toISOString()} - ${event.message}\n`;
  fs.appendFileSync(logFile, logMessage);
};
```

Turn `{ message }` into `timestamp - message` and append it.

### Line 20 — subscribe

```js
logger.on("message", logToFile);
```

Connect the event to the writer.

### Lines 22–25 — repeating memory log

```js
setInterval(() => {
  const memoryUsage = (os.freemem() / os.totalmem()) * 100;
  logger.log(`Current memory usage: ${memoryUsage.toFixed(2)}`);
}, 3000);
```

Every 3 seconds, emit a memory snapshot.

### Lines 27–28 — one-time logs

```js
logger.log("Application Started");
logger.log("Application event occured");
```

Announce that the app started.

---

## 11. Mini examples you can try

### A. EventEmitter with no class

Create `try-events.js`:

```js
const EventEmitter = require("events");
const bus = new EventEmitter();

bus.on("greet", (payload) => {
  console.log("Hello,", payload.name);
});

bus.emit("greet", { name: "Deva" });
```

```bash
node try-events.js
# Hello, Deva
```

### B. Two listeners for one event

```js
const EventEmitter = require("events");
const bus = new EventEmitter();

bus.on("message", (e) => console.log("A:", e.text));
bus.on("message", (e) => console.log("B:", e.text));

bus.emit("message", { text: "hi" });
```

Prints both `A:` and `B:`. One emit, two reactions.

### C. Emit with nobody listening

```js
const EventEmitter = require("events");
const bus = new EventEmitter();

bus.emit("message", { text: "lost" }); // nothing happens
bus.on("message", (e) => console.log(e.text));
```

The first emit is ignored. Order matters: **listen, then emit**.

### D. Log only to the console (same Logger)

Comment out `logger.on("message", logToFile)` and add:

```js
logger.on("message", (event) => {
  console.log(event.message);
});
```

Same `logger.log(...)` calls, different reaction.

---

## 12. How this shows up in real Node.js

You will see the same pattern everywhere:

| Place | Event name example | Who emits | Who listens |
|-------|--------------------|-----------|-------------|
| HTTP server | `"request"` | Node, when a browser hits your server | Your handler sends a response |
| File stream | `"data"`, `"end"` | The stream, as chunks arrive | Your code processes chunks |
| Process | `"exit"` | Node, when the process is shutting down | Cleanup code |
| This demo | `"message"` | `logger.log()` | `logToFile` |

`http.createServer((req, res) => { ... })` is a shortcut for "listen to the `"request"` event".

Event-driven code is how Node stays efficient: it does not sit in a loop asking "did anything happen?" It waits, then runs a listener when something does happen.

---

## 13. Common mix-ups

| Mix-up | What is actually true |
|--------|------------------------|
| `log()` writes the file | `log()` only emits. `logToFile` writes the file. |
| `memoryUsage` is RAM used | It is **free** RAM as a percent of total. |
| `./eventlog.txt` is always next to `logger.js` | It is relative to **where you ran `node`**. |
| `setInterval(..., 3000)` runs immediately | First run is after 3 seconds. |
| `EventEmitter` is a npm package | It is built into Node: `require("events")`. |
| `{ message }` is a special event syntax | It is ordinary object shorthand: `{ message: message }`. |

---

## 14. Practice checks

After you understand the file, try these without looking:

1. Add a second listener that `console.log`s every message.
2. Change the interval from 3 seconds to 5 seconds.
3. Log **used** memory percent instead of free: `((os.totalmem() - os.freemem()) / os.totalmem()) * 100`.
4. Add `logger.log("Application stopping")` is not enough to run on exit — look up `process.on("SIGINT", ...)` if you want a log when you press `Ctrl + C`.
5. Explain to yourself, out loud: "Who emits? Who listens? What is the payload?"

If you can answer those, you understand this file.
