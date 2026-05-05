console.log('Shell Bridge Plugin initializing...');

const DAEMON_URL = "http://127.0.0.1:30142";

// 1. Log ALL internal actions so you can see them in DevTools if you want.
PluginAPI.registerHook('action', (action) => {
    if (action && action.type) {
        console.log("SP_ACTION_FIRED:", action.type, action.payload);
    }
});

// 2. BULLETPROOF FALLBACK: SuperProductivity updates the window document title to the active task!
// Example: "▶ 00:05:12 My Task Name - Super Productivity"
setInterval(() => {
    try {
        if (typeof document !== 'undefined' && document.title) {
            let title = document.title;
            // Clean up the window title to show just the task name
            title = title.replace(" - Super Productivity", "");
            
            fetch(`${DAEMON_URL}/set-task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: "fallback", title: title })
            }).catch(e=>e);
        }
    } catch(e) {}
    
    // Also poll for actions from Noctalia like start/stop/done
    fetch(`${DAEMON_URL}/get-action`)
        .then(res => res.json())
        .then(data => {
            if (data && data.action) {
                if (data.action === 'toggle') {
                    PluginAPI.dispatchAction({ type: '[Task] Toggle Start' });
                }
            }
        }).catch(e=>e);
}, 2000);

PluginAPI.showSnack({ msg: "Shell Bridge Plugin initialized (V5)!", type: "SUCCESS" });
