const express = require('express'); // Modulo per server HTTP
const favicon = require('express-favicon');
const app = express();
const server = require('http').Server(app); // Server HTTP
const { Server } = require('socket.io'); // Server Socket
const io = new Server(server);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// Crea array che contiene stanze
const stanze = [];

// Metti in ascolto il server HTTP sulla porta 80
server.listen(80, () => {
    console.log('In ascolto su porta 80');
});

// Fornisci i file nella cartella public in modo statico
app.use(express.static('./public/'));
app.use(favicon(__dirname + './public/favicon.ico'));

// Quando un utente si connette...
io.on('connection', (socket) => {
    
    // Quando un utente crea una stanza...
    socket.on('crea', (data) => {
        // se già esiste una stanza con il nome specificato, invia un messaggio di errore al client
        if(stanze.some((stanza) => stanza.nome === data.nome)) {
            io.emit(data.nome, { success: false, message: 'Nome stanza già esistente' });
        } else {
            // altrimenti, crea una nuova stanza con il nome e la password specificati
            stanze.push({ nome: data.nome, password: data.password });
            // e fa entrare il client nella stanza appena creata
            socket.join(data.nome);
            io.emit(data.nome, { success: true });
        }
    });

    // Quando un utente entra in una stanza...
    socket.on('entra', (data) => {
        // se la stanza esiste
        if(stanze.some((stanza) => stanza.nome === data.nome)) {
            // se la stanza non ha una password o se la password inserita dal client è corretta
            if(stanze.some((stanza) => stanza.password === '' || stanza.password === data.password)) {
                // fa entrare il client nella stanza
                socket.join(data.nome);
                io.emit(data.nome, { success: true });
            } else {
                // altrimenti, invia un messaggio di errore al client
                io.emit(data.nome, { success: false, message: 'Password errata' });
            }
        } else {
            // se la stanza non esiste, invia un messaggio di errore al client
            io.emit(data.nome, { success: false, message: 'Stanza non esistente' });
        }
    });

    // Quando un utente si disconnette dalla stanza...
    socket.on('disconnecting', (reason) => {
        // recupera il nome della stanza in cui si trova il client
        const room = Array.from(socket.rooms)[1];

        // se il client non è in una stanza, non fa nulla
        if(!room && room !== '') return;

        // se il client è l'ultimo utente nella stanza, elimina la stanza
        if(io.sockets.adapter.rooms.get(room).size === 1) {
            stanze.splice(stanze.findIndex((stanza) => stanza.nome === room), 1);
            console.log("Eliminata stanza " + room);
        }

        // fa uscire il client da tutte le stanze
        socket.leaveAll();
    });

    // Quando un utente invia un messaggio...
    socket.on('messaggio chat', (msg) => {
        // recupera il nome della stanza in cui si trova il client
        const room = Array.from(socket.rooms)[1];
        // invia il messaggio a tutti i client nella stanza
        io.to(room).emit('messaggio chat', msg);
    });

});

