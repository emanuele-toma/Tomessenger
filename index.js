const express = require('express');
const app = express();
const server = require('http').Server(app);
const { Server } = require('socket.io');
const io = new Server(server);

const bodyParser = require('body-parser');

const stanze = [];

app.use(bodyParser.urlencoded({ extended: false }));

server.listen(80, () => {
    console.log('In ascolto su porta 80');
});

app.use(express.static('./public/'));
app.use(favicon(__dirname + './public/favicon.ico'));

io.on('connection', (socket) => {

    socket.on('crea', (data) => {
        if(stanze.some((stanza) => stanza.nome === data.nome)) {
            io.emit(data.nome, { success: false, message: 'Nome stanza già esistente' });
        } else {
            stanze.push({ nome: data.nome, password: data.password });
            socket.join(data.nome);
            io.emit(data.nome, { success: true });
        }
    });

    socket.on('entra', (data) => {
        if(stanze.some((stanza) => stanza.nome === data.nome)) {
            if(stanze.some((stanza) => stanza.password === '' || stanza.password === data.password)) {
                socket.join(data.nome);
                io.emit(data.nome, { success: true });
            } else {
                io.emit(data.nome, { success: false, message: 'Password errata' });
            }
        } else {
            io.emit(data.nome, { success: false, message: 'Stanza non esistente' });
        }
    });

    socket.on('disconnecting', (reason) => {
        const room = Array.from(socket.rooms)[1];

        if(!room && room !== '') return;

        if(io.sockets.adapter.rooms.get(room).size === 1) {
            stanze.splice(stanze.findIndex((stanza) => stanza.nome === room), 1);
            console.log("Eliminata stanza " + room);
        }

        socket.leaveAll();
    });

    socket.on('messaggio chat', (msg) => {
        const room = Array.from(socket.rooms)[1];
        io.to(room).emit('messaggio chat', msg);
    });
});

