import type { PluginAPI as IPluginAPI, Task } from '@super-productivity/plugin-api';

declare var PluginAPI: IPluginAPI;

import * as http from 'http';

const PORT = 30142; // arbitrary local port

let server: http.Server | null = null;
let currentTaskId: string | null = null;

console.log('Shell Bridge Plugin initializing...');

PluginAPI.registerHook('action' as any, (action: any) => {
  if (action?.type === '[Task] SetCurrentTask') {
    currentTaskId = action.payload;
  }
});

try {
  server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/current-task') {
      try {
        const tasks = await PluginAPI.getTasks();
        const activeTask = tasks.find(t => t.id === currentTaskId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(activeTask || { id: null, title: 'No active task' }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: (e as any).toString() }));
      }
      return;
    }
    
    if (req.url === '/toggle-timer' && req.method === 'POST') {
      PluginAPI.dispatchAction({ type: '[Task] Toggle Start' });
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.url === '/mark-done' && req.method === 'POST' && currentTaskId) {
      PluginAPI.dispatchAction({ type: '[Task] Update Task', payload: { task: { id: currentTaskId, changes: { isDone: true } } }});
      PluginAPI.dispatchAction({ type: '[Task] SetCurrentTask', payload: null });
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Shell Bridge running on http://127.0.0.1:${PORT}`);
    PluginAPI.showSnack({ msg: `Shell Bridge listening on ${PORT}`, type: 'SUCCESS' });
  });

} catch (err: any) {
  console.error("Shell Bridge failed to start server", err);
}
