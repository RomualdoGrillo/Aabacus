#!/usr/bin/env python3
"""Dev helper: control panel on :5501 toggles the static app server on :5500."""

from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

APP_PORT = 5500
CONTROL_PORT = 5501
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

server_proc: subprocess.Popen | None = None


def is_running() -> bool:
    return server_proc is not None and server_proc.poll() is None


def start_app_server() -> None:
    global server_proc
    if is_running():
        return
    server_proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(APP_PORT), "--bind", "127.0.0.1"],
        cwd=REPO_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def stop_app_server() -> None:
    global server_proc
    if not is_running():
        return
    server_proc.send_signal(signal.SIGTERM)
    try:
        server_proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server_proc.kill()
        server_proc.wait(timeout=5)
    server_proc = None


def toggle_app_server() -> bool:
    if is_running():
        stop_app_server()
    else:
        start_app_server()
    return is_running()


CONTROL_HTML = f"""<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Aabacus dev server</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, sans-serif;
      background: #f4f6fb;
      color: #1f2937;
    }}
    main {{
      max-width: 720px;
      margin: 48px auto;
      padding: 0 24px;
    }}
    h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem; }}
    p {{ line-height: 1.5; }}
    .card {{
      margin-top: 24px;
      padding: 20px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }}
    .status {{
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
    }}
    .status.on {{ background: #dcfce7; color: #166534; }}
    .status.off {{ background: #fee2e2; color: #991b1b; }}
    a.app-link {{ color: #2563eb; }}
    #devServerFab {{
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      font-family: system-ui, sans-serif;
    }}
    #devServerFab button {{
      border: none;
      border-radius: 999px;
      padding: 12px 18px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
    }}
    #devServerFab button.live {{
      background: #16a34a;
      color: white;
    }}
    #devServerFab button.stop {{
      background: #dc2626;
      color: white;
    }}
    #devServerFab button:disabled {{
      opacity: 0.7;
      cursor: wait;
    }}
    #devServerFab .hint {{
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #dbeafe;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 0.82rem;
      max-width: 260px;
      text-align: right;
    }}
  </style>
</head>
<body>
  <main>
    <h1>Aabacus dev server</h1>
    <p>Pannello di controllo locale per avviare o fermare il web server statico dell'app.</p>
    <div class="card">
      <p>Stato: <span id="statusBadge" class="status off">fermo</span></p>
      <p>App: <a id="appLink" class="app-link" href="http://127.0.0.1:{APP_PORT}/index.html" target="_blank" rel="noopener">http://127.0.0.1:{APP_PORT}/index.html</a></p>
      <p>Esempio Hanoi: <a class="app-link" href="http://127.0.0.1:{APP_PORT}/index.html?preloadPath=./Data/exercises/hanoi4.mmls" target="_blank" rel="noopener">apri hanoi4</a></p>
      <p>Usa il pulsante in basso a destra, come il vecchio <em>Go Live</em> di Live Server in VS Code.</p>
    </div>
  </main>

  <div id="devServerFab">
    <div id="fabHint" class="hint">Porta {APP_PORT} ferma. Clicca per avviare.</div>
    <button id="fabButton" class="live" type="button">Go Live :{APP_PORT}</button>
  </div>

  <script>
    const fabButton = document.getElementById("fabButton");
    const fabHint = document.getElementById("fabHint");
    const statusBadge = document.getElementById("statusBadge");

    async function refreshStatus() {{
      const res = await fetch("/api/status");
      const data = await res.json();
      updateUi(data.running);
    }}

    function updateUi(running) {{
      statusBadge.textContent = running ? "in esecuzione" : "fermo";
      statusBadge.className = "status " + (running ? "on" : "off");
      fabButton.disabled = false;
      if (running) {{
        fabButton.textContent = "Stop :{APP_PORT}";
        fabButton.className = "stop";
        fabHint.textContent = "Server attivo. Clicca per fermarlo.";
      }} else {{
        fabButton.textContent = "Go Live :{APP_PORT}";
        fabButton.className = "live";
        fabHint.textContent = "Porta {APP_PORT} ferma. Clicca per avviare.";
      }}
    }}

    fabButton.addEventListener("click", async () => {{
      fabButton.disabled = true;
      try {{
        const res = await fetch("/api/toggle", {{ method: "POST" }});
        const data = await res.json();
        updateUi(data.running);
      }} finally {{
        fabButton.disabled = false;
      }}
    }});

    refreshStatus();
    setInterval(refreshStatus, 3000);
  </script>
</body>
</html>
"""


class ControlHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        return

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_html(self, html: str, status: int = 200) -> None:
        body = html.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/status":
            self.send_json({"running": is_running(), "appPort": APP_PORT})
            return
        if path in ("/", "/index.html"):
            self.send_html(CONTROL_HTML)
            return
        self.send_json({"error": "not found"}, status=404)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/start":
            start_app_server()
            self.send_json({"running": is_running()})
            return
        if path == "/api/stop":
            stop_app_server()
            self.send_json({"running": is_running()})
            return
        if path == "/api/toggle":
            running = toggle_app_server()
            self.send_json({"running": running})
            return
        self.send_json({"error": "not found"}, status=404)


def main() -> None:
    os.chdir(REPO_ROOT)
    start_app_server()
    httpd = ThreadingHTTPServer(("127.0.0.1", CONTROL_PORT), ControlHandler)
    print(f"Aabacus dev control: http://127.0.0.1:{CONTROL_PORT}/")
    print(f"App server target port: {APP_PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        stop_app_server()
        httpd.server_close()


if __name__ == "__main__":
    main()
