# app.py
from flask import Flask, render_template
import socketio
import eventlet

sio = socketio.Server(cors_allowed_origins='*')
app = Flask(__name__)
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

# Хранилище данных (как в твоем server.py)
users = {}
games = {}

@app.route('/')
def index():
    return render_template('index.html')

@sio.event
def connect(sid, environ):
    print(f'Client connected: {sid}')

@sio.event
def login(sid, nickname):
    users[sid] = {'name': nickname, 'status': 'free'}
    broadcast_user_list()

@sio.event
def disconnect(sid):
    if sid in users:
        del users[sid]
        broadcast_user_list()

def broadcast_user_list():
    user_list = [{'sid': k, 'name': v['name']} for k, v in users.items() if v['status'] == 'free']
    sio.emit('update_users', user_list)

# Простой эхо-сервер для ходов (упрощено для примера)
@sio.event
def make_move(sid, data):
    # data = {'game': 'chess', 'move': ...}
    sio.emit('receive_move', data, skip_sid=sid)

if __name__ == '__main__':
    print("Сервер запущен: http://127.0.0.1:5000")
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)
