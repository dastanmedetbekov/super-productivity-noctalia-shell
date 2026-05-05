import http.server
import socketserver
import json
import logging

PORT = 30142
logging.basicConfig(level=logging.INFO)

state = {
    "task": {"title": "SuperProductivity (Waiting...)"},
    "pending_action": None
}

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        if self.path == '/current-task':
            self.wfile.write(json.dumps(state['task']).encode())
        elif self.path == '/get-action':
            action = state['pending_action']
            state['pending_action'] = None
            self.wfile.write(json.dumps({"action": action}).encode())
        else:
            self.wfile.write(b'{}')

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            post_data = self.rfile.read(content_length)
        else:
            post_data = b'{}'
            
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/set-task':
            try:
                state['task'] = json.loads(post_data)
            except Exception as e:
                pass
        elif self.path == '/debug':
            with open('/tmp/sp-debug.log', 'a') as f:
                f.write(post_data.decode() + '\n')
        elif self.path == '/toggle-timer':
            state['pending_action'] = 'toggle'
        elif self.path == '/mark-done':
            state['pending_action'] = 'done'
            
        self.wfile.write(b'{"status":"ok"}')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    # Disable spamming logs completely now that it's working
    def log_message(self, format, *args):
        pass

print(f"Noctalia <-> SuperProductivity bridge starting on port {PORT}...")

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
