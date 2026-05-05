console.log('Shell Bridge Plugin initializing...');

const DAEMON_URL = "http://127.0.0.1:30142";

// Send debug info about PluginAPI
fetch(`${DAEMON_URL}/debug`, {
    method: "POST",
    body: "PluginAPI Keys: " + Object.keys(PluginAPI).join(",")
}).catch(e=>e);

let currentTaskId = null;
let currentTaskTitle = "No active task";

async function syncTask() {
    try {
        const payload = currentTaskId ? { id: currentTaskId, title: currentTaskTitle } : { id: null, title: "No active task" };
        fetch(`${DAEMON_URL}/debug`, { method: "POST", body: "SYNC: " + JSON.stringify(payload) }).catch(e=>e);
        
        await fetch(`${DAEMON_URL}/set-task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }
    catch (e) {
        // Ignore fetch errors if daemon is not running
    }
}

PluginAPI.registerHook('currentTaskChange', (task) => {
    fetch(`${DAEMON_URL}/debug`, { method: "POST", body: "HOOK currentTaskChange: " + (task ? task.title : "null") }).catch(e=>e);

    currentTaskId = task ? task.id : null;
    currentTaskTitle = task ? task.title : "No active task";
    syncTask();
});

// We can still try to catch 'action' as backup, but it's very unreliable since it relies on internal NGRX names.
// Note: we can also keep the background sync if needed.

// Periodic sync and action polling
setInterval(async () => {
    try {
        const tasks = await PluginAPI.getTasks();
        fetch(`${DAEMON_URL}/debug`, { method: "POST", body: "POLL: Task count " + (tasks ? tasks.length : "null") }).catch(e=>e);
    } catch(e) {
        fetch(`${DAEMON_URL}/debug`, { method: "POST", body: "POLL ERROR: " + String(e) }).catch(e=>e);
    }
    
    syncTask();
    try {
        const res = await fetch(`${DAEMON_URL}/get-action`);
        const data = await res.json();
        if (data && data.action) {
            if (data.action === 'toggle') {
                PluginAPI.dispatchAction({ type: '[Task] Toggle Start' });
            }
            else if (data.action === 'done' && currentTaskId) {
                PluginAPI.dispatchAction({ type: '[Task] Update Task', payload: { task: { id: currentTaskId, changes: { isDone: true } } } });
                PluginAPI.dispatchAction({ type: '[Task] SetCurrentTask', payload: null });
            }
        }
    }
    catch (e) { }
}, 2000);

PluginAPI.showSnack({ msg: "Shell Bridge Plugin initialized!", type: "SUCCESS" });
