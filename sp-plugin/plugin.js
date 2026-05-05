console.log('Shell Bridge Plugin V6 (Timer Polling)');
const DAEMON_URL = "http://127.0.0.1:30142";

let previousTimeSpent = {};
let currentTask = { id: null, title: "No active task", timeSpent: 0, timeEstimate: 0 };

// Backup hook (just in case it occasionally works)
try {
    PluginAPI.registerHook('currentTaskChange', (task) => {
        if (task) {
            currentTask = { id: task.id, title: task.title, timeSpent: task.timeSpent || 0, timeEstimate: task.timeEstimate || 0 };
            sendToDaemon();
        } else {
            currentTask = { id: null, title: "No active task", timeSpent: 0, timeEstimate: 0 };
            sendToDaemon();
        }
    });
} catch(e) {}

function sendToDaemon() {
    fetch(`${DAEMON_URL}/set-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentTask)
    }).catch(e => {});
}

// BULLETPROOF POLLING:
// Since scripts run in a restricted iframe/sandbox, we can't reliably read the document title.
// However, if a task's timer is running, its `timeSpent` value goes up!
// We can just poll getTasks() and check which task's time is ticking.
setInterval(async () => {
    try {
        const tasks = await PluginAPI.getTasks();
        
        for (let task of tasks) {
            // Check if timeSpent increased since last poll
            if (previousTimeSpent[task.id] !== undefined && task.timeSpent > previousTimeSpent[task.id]) {
                // This task is currently actively ticking!
                currentTask = { 
                    id: task.id, 
                    title: task.title, 
                    timeSpent: task.timeSpent, 
                    timeEstimate: task.timeEstimate 
                };
            } else if (currentTask.id === task.id) {
                // Just keep its time updated if it's already our active task
                currentTask.timeSpent = task.timeSpent;
                currentTask.timeEstimate = task.timeEstimate;
            }
            previousTimeSpent[task.id] = task.timeSpent;
        }
        
        sendToDaemon();
        
    } catch (e) {}
    
    // Poll for actions from Noctalia like start/stop/done
    try {
        const res = await fetch(`${DAEMON_URL}/get-action`);
        const data = await res.json();
        if (data && data.action) {
            if (data.action === 'toggle') {
                PluginAPI.dispatchAction({ type: '[Task] Toggle Start' });
            } else if (data.action === 'done' && currentTask.id) {
                PluginAPI.updateTask(currentTask.id, { isDone: true });
            }
        }
    } catch (e) {}
    
}, 2000);

PluginAPI.showSnack({ msg: "Shell Bridge V6: Timer Tracking Active!", type: "SUCCESS" });
