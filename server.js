const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', socket=>
{
    socket.on('chatMessage', (msg)=>
    {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    socket.on('joinRoom', ({username, room})=>
    {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage('Admin',`Hello, ${username} !`));
        socket.broadcast.to(user.room).emit('message', formatMessage('Admin',`${user.username} joined the chat`));

        io.to(user.room).emit('roomUsers',
        {
            room: user.room,
            users : getRoomUsers(user.room)
        })
    });

    socket.on('disconnect', ()=>
    {
        const user = userLeave(socket.id);
        if(user)
        {
            io.to(user.room)
            .emit('message', formatMessage('Admin',`${user.username} left the chat`));
            
            io.to(user.room).emit('roomUsers',
            {
                room: user.room,
                users : getRoomUsers(user.room)
            })
        }
        
    });
})

const PORT = 3000;
app.use(express.static(path.join(__dirname, 'public')));
server.listen(PORT, ()=>{console.log('listening on port 3000 ');});

// socket.emit will send back message to sender only,
// io.emit will send message to all the client including sender
// if you want to send message to all but not back to sender then socket.broadcast.emit