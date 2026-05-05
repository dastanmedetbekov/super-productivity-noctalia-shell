console.log('Shell Bridge Plugin initializing...');

const DAEMON_URL = "http://127.0.0.1:30142";

// Send debug info about PluginAPI
fetch(`${DAEMON_URL}/debug`, {
    method: "POST",
    body: JSON.stringify({ pluginApiKeys: Object.keys(PluginAPI) })
}).catch(e=>e);

let currentTaskId = null;
let currentTaskTitle = "No active task";

async function syncTask() {
    try {
        const tasks = await PluginAPI.getTasks();
        const activeTask = tasks.find(t => t.id === currentTaskId) || null;
        await fetch(`${DAEMON_URL}/set-task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(activeTask || { id: null, title: "No active task" })
        });
    }
    catch (e) {
        // Ignore fetch errors if daemon is not running
    }
}

PluginAPI.registerHook('action', (action) => {
    fetch(`${DAEMON_URL}/debug`, { method: "POST", body: JSON.stringify({ actionType: action?.type, payload: action?.payload }) }).catch(e=>e);

    if (action?.type === '[Task] SetCurrentTask') {
        currentTaskId = action.payload;
        syncTask();
    }
});

// Periodic sync and action polling
setInterval(async () => {
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
