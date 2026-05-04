"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const PORT = 30142; // arbitrary local port
let server = null;
let currentTaskId = null;
console.log('Shell Bridge Plugin initializing...');
PluginAPI.registerHook('action', (action) => {
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
            }
            catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: e.toString() }));
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
            PluginAPI.dispatchAction({ type: '[Task] Update Task', payload: { task: { id: currentTaskId, changes: { isDone: true } } } });
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
}
catch (err) {
    console.error("Shell Bridge failed to start server", err);
}
