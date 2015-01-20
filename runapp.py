import os

from paste.deploy import loadapp
from paste.httpserver import serve

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app = loadapp('config:configs/production.ini', relative_to='.')
    serve(app, host='0.0.0.0', port=port, use_threadpool=True, threadpool_workers=10, socket_timeout=70)