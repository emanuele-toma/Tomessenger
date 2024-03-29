# Progetto Chat Server Tomessenger
Il progetto consiste in un semplice server di chat utilizzando Socket.IO e Node.JS che permette agli utenti di creare e unirsi a stanze di chat.
Inoltre tutti i messaggi che vengono inviati tramite chat protette da password vengono cifrati attraverso AES-256, tutti i messaggi durante l'invio e la ricezione sono compressi in modo da poter risparmiare risorse.

## Strumenti utilizzati ##
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)

## Prerequisiti
* Node.js
* NPM

## Installazione
1. Clona il repository o scarica i file.
2. Apri un terminale e spostati nella directory del progetto.
3. Esegui il comando **`npm install`** per installare tutte le dipendenze del progetto.

## Avvio
1. Apri un terminale e spostati nella directory del progetto.
2. Esegui il comando **`node index.js`** per avviare il server.
3. Apri l'indirizzo **`http://localhost`** nel browser per iniziare a utilizzare la chat

## Immagini
<details>
<summary>Clicca per espandere</summary>

![Screenshot 1](https://i.imgur.com/JCECM81.png)
![Screenshot 2](https://i.imgur.com/YNpBJ9r.png)
    
</details>

## Spiegazione codice server
<details>
<summary>Clicca per espandere</summary>

### Dipendenze e avvio server HTTP
```js
// index.js

const express = require('express'); // Modulo per server HTTP
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
```

Questo codice importa i moduli **`express`** e **`socket.io`** per creare un server HTTP e un server Socket. Viene creato un array **`stanze`** che conterrà i nomi delle stanze di chat create. Infine, il server HTTP viene messo in ascolto sulla porta 80.

### Creazione di una stanza di chat

```js
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
```

Il codice sopra fornisce i file nella cartella **`public`** in modo statico e ascolta gli eventi di connessione dei client. Quando un utente emette un evento **`crea`**, il codice verifica se esiste già una stanza con il nome specificato. Se esiste già, viene inviato un messaggio di errore al client. Altrimenti, viene creata una nuova stanza con il nome e la password specificati e il client viene fatto entrare nella stanza appena creata.

### Entrata in una stanza di chat

```js
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
```

Quando un utente emette un evento **`entra`**, il codice verifica se la stanza esiste e se la password inserita dal client è corretta. Se la stanza esiste e la password è corretta o non esiste, il client viene fatto entrare nella stanza. Altrimenti, viene inviato un messaggio di errore al client.

### Uscita da stanza di chat

```js
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
```

Quando un utente si disconnette dalla stanza, il codice recupera il nome della stanza in cui si trova il client. Se il client non è in una stanza, non viene fatto nulla. Altrimenti, se il client è l'ultimo utente nella stanza, viene eliminata la stanza. Infine, il client viene fatto uscire da tutte le stanze.

### Inviare un messaggio

```js
// Quando un utente invia un messaggio...
    socket.on('messaggio', (data) => {
        // se il client si trova in una stanza
        if(Object.keys(socket.rooms).length > 1) {
            // invia il messaggio a tutti gli utenti della stanza, tranne al mittente
            socket.to(socket.rooms[1]).emit('messaggio', data);
        }
    });
});
```
Quando un utente emette un evento **`messaggio`**, il codice verifica se il client si trova in una stanza. Se si trova in una stanza, il messaggio viene inviato a tutti gli utenti della stanza, tranne al mittente.
</details>

## Spiegazione codice client

<details>
<summary>Clicca per espandere</summary>

### Inizializzazione

```js
// index.html

const socket = io();

const btnCrea = document.getElementById('btn-crea');
const btnEntra = document.getElementById('btn-entra');

var nome = "";
var username = "";
var password = "";
```
In questa sezione viene inizializzata la connessione socket e vengono recuperati i pulsanti per creare e entrare in una stanza di chat. Inoltre, vengono inizializzate le variabili per memorizzare il nome della stanza, lo username e la password.

### Creazione di una stanza di chat

```js
btnCrea.addEventListener('click', (e) =>
{
    // Prendi valori dal form
    nome = document.getElementById('nome').value;
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;

    // Crea hash della password usando SHA256
    var hash = CryptoJS.SHA256(password).toString();

    // Se la password è vuota non usare hash
    if(password == '')
        hash = password;

    // Invia evento di creazione stanza
    socket.emit('crea', {nome, username, password:hash});

    // Il server risponde con il nome della stanza
    socket.on(nome, (data) =>
    {
        // Se non ci sono errori mostra chat
        if (data.success == true)
        {
            switchToChat();
        }

        // Altrimenti mostra errore
        if (data.success == false)
        {
            M.toast({html: "Attenzione: " + data.message})
        }

        // Termina connessione socket
        socket.off(nome);
    });
});
```

Quando viene cliccato il pulsante **`btnCrea`**, il codice prende i valori inseriti nei campi del form e crea un hash della password usando l'algoritmo SHA256. L'hash della password viene inviato al server insieme ai dati del form, tramite un evento **`crea`**. Se il server risponde con un messaggio di successo, viene mostrata la chat. Altrimenti, viene mostrato un messaggio di errore.

### Entrare in una stanza di chat

```js
btnEntra.addEventListener('click', (e) =>
{
    // Prendi valori dal form
    nome = document.getElementById('nome').value;
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;

    // Crea hash dalla password
    var hash = CryptoJS.SHA256(password).toString();

    // Se password vuota non usare hash
    if(password == '')
        hash = password;

    // Invia evento per entrare nella stanza
    socket.emit('entra', {nome: nome, username, password:hash });
    socket.on(nome, (data) =>
    {
        // Se non ci sono errori mostra chat
        if (data.success == true)
        {
            switchToChat();
        }

        // Altrimenti mostra errori
        if (data.success == false)
        {
            M.toast({html: "Attenzione: " + data.message})
        }

        socket.off(nome);
    });
});
```

Quando viene cliccato il pulsante **`btnEntra`**, il codice prende i valori inseriti nei campi del form e crea un hash della password usando l'algoritmo SHA256. L'hash della password viene inviato al server insieme ai dati del form, tramite un evento **`entra`**. Se il server risponde con un messaggio di successo, viene mostrata la chat. Altrimenti, viene mostrato un messaggio di errore.

### Funzione per passare alla chat

```js
function switchToChat()
{
    // Alterna visualizzazione
    document.querySelector('#chat-join').style.display = 'none';
    document.querySelector('#chat').style.display = 'block';

    // Quando arriva un messaggio...
    socket.on('messaggio chat', (msg) =>
    {
        // Scrivilo in console
        console.log(msg);
        // Scrivilo in chat
        writeMessage(msg);
    });
    
    const btnSend = document.getElementById('btn-send')
    btnSend.addEventListener('click', (e) =>
    {
        // Invia il messaggio
        const message = document.getElementById('message').value;
        sendMessage(username, Date.now(), message, password);
                
        // Ripulisci input
        document.getElementById('message').value = '';
     });
}
```

La funzione **`switchToChat`** viene chiamata quando si vuole passare alla chat. La funzione nasconde il form di accesso alla chat e mostra la chat vera e propria. Inoltre, aggiunge un event listener per i messaggi in arrivo dalla chat. Quando viene ricevuto un messaggio, viene scritto sia nella console che nella chat stessa.

### Inviare un messaggio cifrato

```js
function sendMessage(author, timestamp, message, password)
{
    // Invia messaggio al server
    socket.emit('messaggio chat', {author, timestamp, message:cifraMessaggio(message, password)});
}
```

La funzione **`sendMessage`** viene chiamata per inviare un messaggio al server. Quando viene chiamata, la funzione prende come argomenti l'autore del messaggio, il timestamp del messaggio, il messaggio stesso e la password dell'utente. La funzione quindi invia un evento 'messaggio chat' al server con questi valori (linea 3), utilizzando la funzione **`cifraMessaggio`** per cifrare il messaggio prima dell'invio. Questo garantisce che i messaggi siano inviati in modo sicuro e protetto.

### Scrivere un messaggio in chat

```js
function writeMessage(author, timestamp, message, side, password) {
    // Decifra messaggio
    message = decifraMessaggio(message, password);

    // Se il messaggio è vuoto ignoralo
    if (message.length < 1) return;

    // Imposta data del messaggio
    const data = new Date(timestamp);

    const chat = document.querySelector('#messaggi');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('row');

    const messageCard = document.createElement('div');
    messageCard.classList.add('col', 's8');

    // Se il messaggio è proprio va a destra
    if (side == 'right') messageCard.classList.add('offset-s4');

    // codice rimosso per fini di spiegazione    

    // Scorri in fondo alla pagina
    window.scrollTo(0, document.body.scrollHeight);
}
```
La funzione **`writeMessage`** viene chiamata per visualizzare un messaggio nella chat. Quando viene chiamata, la funzione prende come argomenti l'autore del messaggio, il timestamp del messaggio, il messaggio stesso, il lato della chat in cui deve essere visualizzato e la password dell'utente. La funzione quindi decifra il messaggio usando la funzione **`decifraMessaggio`** e, se il messaggio non è vuoto, viene visualizzato nella chat. Infine, la finestra della chat viene fatta scorrere in fondo per mostrare il nuovo messaggio.

### Formattazione della data del messaggio

```js
function formatDate(timestamp)
{
    const data = new Date(timestamp);
    const ora = data.getHours() < 10 ? '0' + data.getHours() : data.getHours();
    const minuti = data.getMinutes() < 10 ? '0' + data.getMinutes() : data.getMinutes();
    const giorno = data.getDate() < 10 ? '0' + data.getDate() : data.getDate();
    const mese = data.getMonth() < 10 ? '0' + data.getMonth() : data.getMonth();
    const anno = data.getFullYear();
    return `${ora}:${minuti} del ${giorno}/${mese}/${anno}`;
}
```

La funzione **`formatDate`** viene chiamata per formattare la data del messaggio. Quando viene chiamata, la funzione prende come argomento il timestamp del messaggio. La funzione quindi crea un oggetto **`Date`** dal timestamp e ottiene l'ora, i minuti, il giorno e l'anno.

### Comprimi e cifra il messaggio

```js
function cifraMessaggio(messaggio, chiave)
{
    messaggio = LZString.compress(messaggio);
    var encrypted = CryptoJS.AES.encrypt(messaggio, chiave);
    return encrypted.toString();
}
```

La funzione **`cifraMessaggio`** viene chiamata per comprimere e cifrare un messaggio. Quando viene chiamata, la funzione prende come argomenti il messaggio e la chiave da usare per cifrarlo. La funzione quindi usa la libreria **`LZString`** per comprimere il messaggio, quindi usa la libreria **`CryptoJS`** per cifrarlo con la chiave specificata. Infine, la funzione restituisce il messaggio cifrato in formato stringa.

### Decomprimi e decifra il messaggio

```js
function decifraMessaggio(messaggio, chiave)
{
    var decrypted = CryptoJS.AES.decrypt(messaggio, chiave);
    return LZString.decompress(decrypted.toString(CryptoJS.enc.Utf8));
}
```

La funzione **`decifraMessaggio`** viene chiamata per decomprimere e decifrare un messaggio. Quando viene chiamata, la funzione prende come argomenti il messaggio cifrato e la chiave da usare per decifrarlo. La funzione quindi usa la libreria CryptoJS per decifrare il messaggio con la chiave specificata. Successivamente, usa la libreria **`LZString`** per decomprimere il messaggio decifrato. Infine, la funzione restituisce il messaggio decompresso in formato stringa.

</details>

## Demo

Versione demo [Qui](https://tomessenger.glitch.me)

## Licenza
Questo programma è sottoposto alla [Licenza GPL 3.0](https://github.com/Illumina/licenses/blob/master/gpl-3.0.txt)
