
const Matter = require('matter-js');
const path = require('path');
const fs = require('fs/promises');

const express = require('express');
const WebSocket = require('ws');
const http = require('http'); // Required to create a server

const app = express();
const port = 8080;



// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create an HTTP server
const server = http.createServer(app);


// Serve static files (HTML, JS, images, etc.)
//pp.use(express.static(path.join(__dirname, 'public')));

//app.listen(port, () => {
  //  console.log(`Server running at http://port-8082-nodejs-green-insect-davidwj.preview.codeanywhere.com/:${port}`);
//});


// **Start the server last**
server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Attach WebSocket to the HTTP server (Fixes the error)
const wss = new WebSocket.Server({ server });


async function getMapData() {
    const jsonString = await fs.readFile('tank-test/public/maps/tank_test_level.json', 'utf8'); // `await` needs `async`
    return JSON.parse(jsonString); // Return the parsed JSON
}


// Create a Matter.js engine
const engine = Matter.Engine.create();
const world = engine.world;

// Usage
getMapData().then(mapData => {
    let offset = 16;
   // console.log(mapData.layers[1].data)
    for (var i = 0; i <mapData.layers[1].data.length; i++)
    {
        if (mapData.layers[1].data[i] !== 0)
        {
            
           let y = Math.floor(i / 63) 
           // console.log(Y)
           let x = i % 63

           let xPos = x * 16;
           let yPos = y * 16;
            //console.log(X*16,Y*16)
            
            let newObject = Matter.Bodies.rectangle(xPos+8,yPos+8,16,16, { isStatic: true });
            
            Matter.World.add(world, newObject);


        }

    }
});

const MESSAGE_TYPES = {
    NEW_PLAYER: 1,
    EXISTING_PLAYERS: 2,
    PLAYER_UPDATE: 3,
    PLAYER_DISCONNECT: 4,

};
// Function to broadcast data to all clients
function broadcast(buffer) {
    Object.values(sockets).forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(buffer);
        }
    });
}

// Broadcast function to send a message to all except the given socket
function broadcastToOthers(message, excludedSocket) {
    wss.clients.forEach((client) => {
        if (client !== excludedSocket && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

}

// Define a 3000 x 3000 world
const worldSize = 1008;

// Create static boundaries for the world
const boundaries = [
    Matter.Bodies.rectangle(worldSize / 2, -25, worldSize, 50, { isStatic: true }), // Top wall
    Matter.Bodies.rectangle(worldSize / 2, worldSize + 25, worldSize, 50, { isStatic: true }), // Bottom wall
    Matter.Bodies.rectangle(-25, worldSize / 2, 50, worldSize, { isStatic: true }), // Left wall
    Matter.Bodies.rectangle(worldSize + 25, worldSize / 2, 50, worldSize, { isStatic: true }), // Right wall
];

// Add boundaries to the world
Matter.World.add(world, boundaries);



engine.world.gravity.x = 0; // Disable horizontal gravity
engine.world.gravity.y = 0; // Disable vertical gravity

// Store player tanks and sockets
const players = {};
const sockets = {};
const turrets = {};
let idcounter = 1;
// WebSocket server setup
//const server = new WebSocket.Server({ serverhttp });

wss.on('connection', (socket) => {
    const id = idcounter; // Unique player ID
    console.log(id);
    idcounter++;
    
    const randomNumberX = Math.round(Math.random() * 1000);
    const randomNumberY = Math.round(Math.random() * 1000);
    
   // Create the tank body
// Define a collision group
const noCollisionGroup = -1; // Negative values mean bodies in the same group don't collide

// Create the tank body
const tank = Matter.Bodies.rectangle(randomNumberX, randomNumberY, 23, 14, {
    collisionFilter: {
        group: noCollisionGroup, // Assign the tank to the no-collision group
    },
});
Matter.World.add(world, tank);



// Turret's independent angle 
let turretAngle = 0;

// Create the turret body
const turret = Matter.Bodies.rectangle(randomNumberX, randomNumberY, 24, 12, {
   // isStatic: true, // Mark the turret as a static body
    collisionFilter: {
        group: noCollisionGroup, // Assign the turret to the same no-collision group
    },
    inertia: Infinity, // Prevent turret from rotating freely
});


const turretOffset = Matter.Vector.create (-6,0 ); 

//console.log(turretOffset)

Matter.Body.setCentre(turret, turretOffset, true);

Matter.World.add(world, turret);


// Move center to left edge

// Add a constraint to attach the turret to the tank
const turretPivot = Matter.Constraint.create({
    bodyA: tank,                // Attach to the tank
    bodyB: turret,              // Attach to the turret
    pointA: { x: 0
        , y: 0 },     // Center of the tank
    pointB: { x: 0, y: 0 },    // Offset from turret's center (pivot point)
    stiffness: 1,               // Keep the turret attached rigidly
    length: 0,                  // No slack in the constraint
});

Matter.World.add(world, turretPivot);



 
    //send player data
    const buffer = Buffer.alloc(17)
    messageType=MESSAGE_TYPES.NEW_PLAYER;
    buffer.writeUInt8(messageType, 0);
    buffer.writeUInt8(id, 1);
    
    buffer.writeUInt16LE(tank.position.x, 2);
    buffer.writeUInt16LE(tank.position.y, 4);
    buffer.writeUInt8(tank.angle, 6);
    buffer.writeUInt8(23, 7);
    buffer.writeUInt8(14, 8);

    buffer.writeUInt8(id, 9);
  
    buffer.writeUInt16LE(turret.position.x, 10);
    buffer.writeUInt16LE(turret.position.y, 12);
   
    buffer.writeUInt8(turret.angle, 14);
    buffer.writeUInt8(24, 15);
    buffer.writeUInt8(12, 16);

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(buffer);
    }

    const existingPlayers = Object.keys(players).map((existingId) => ({
        id: parseInt(existingId),
        tank: players[existingId].position,
        turret: turrets[existingId].position,
    }));

    console.log(existingPlayers)
    const playersBuffer = Buffer.alloc(1 + existingPlayers.length * 16); // Adjust size dynamically based on player count
    playersBuffer.writeUInt8(MESSAGE_TYPES.EXISTING_PLAYERS, 0);
    existingPlayers.forEach((player, index) => {
        const offset = 1 + index * 16;
        console.log(player)
        playersBuffer.writeUInt8(player.id, offset);
        playersBuffer.writeUInt16LE(player.tank.x, offset + 1);
        console.log(player.tank.y)
        playersBuffer.writeUInt16LE(player.tank.y, offset + 3);
        playersBuffer.writeUInt8(player.tank.angle, offset + 5);
        playersBuffer.writeUInt8(23, offset + 6); // Tank width
        playersBuffer.writeUInt8(14, offset + 7); // Tank height
        playersBuffer.writeUInt16LE(player.turret.x, offset + 8);
        playersBuffer.writeUInt16LE(player.turret.y, offset + 10);
        playersBuffer.writeUInt8(player.turret.angle, offset + 12);
        playersBuffer.writeUInt8(24, offset + 13); // Turret width
        playersBuffer.writeUInt8(12, offset + 14); // Turret height
    });
    console.log(playersBuffer.toJSON());
    socket.send(playersBuffer);

    players[id] = tank;
    turrets[id] = turret;
    sockets[id] = socket;


    //Send new player to other players
    const newPlayerBuffer = Buffer.alloc(17);
    newPlayerBuffer.writeUInt8(5, 0);
    newPlayerBuffer.writeUInt8(id, 1);
   // console.log(tank);
    newPlayerBuffer.writeUInt16LE(tank.position.x, 2);
    newPlayerBuffer.writeUInt16LE(tank.position.y, 4);
    newPlayerBuffer.writeUInt8(tank.angle, 6);
    newPlayerBuffer.writeUInt8(23, 7);
    newPlayerBuffer.writeUInt8(14, 8);

    newPlayerBuffer.writeUInt8(id, 9);
    newPlayerBuffer.writeUInt16LE(turret.position.x, 10);
    newPlayerBuffer.writeUInt16LE(turret.position.y, 12);
    newPlayerBuffer.writeUInt8(turret.angle, 14);
    newPlayerBuffer.writeUInt8(24, 15);
    newPlayerBuffer.writeUInt8(12, 16);

    broadcastToOthers(newPlayerBuffer, socket);
    // Send EXISTING_PLAYERS message to the new player

    socket.on('message', (data) => {
        console.log('data')
        const rotationSpeed = 0.05; // Define rotation speed (radians per update)
        const turretRotationSpeed = 0.02;
        const moveSpeed = 2; // Speed for forward/backward movement
        const damping = 0.1; // Deceleration factor (value between 0 and 1)
        
        const buffer = Buffer.from(data); // Convert incoming data to a Node.js Buffer
        const type = buffer.readUInt8(0); // First byte: message type
        
        if (type === 1) {
            console.log('message 1');
            const targetSpeed = 5; // Target speed (desired velocity)
            const accelerationRate = 0.1; // Acceleration rate per update
            const maxVelocity = 1 // Maximum velocity (cap the speed)
            
            // Read the actions from the input (e.g., movement keys and rotation)
            const actions = buffer.readUInt8(1); // Actions as bitmask
            const player = players[id]; // Get the player's Matter.js body
            
            if (!player) {
                console.warn(`Player with ID ${id} not found.`);
                return;
            }
            
            let velocityX = player.velocity.x; // Preserve current velocity
            let velocityY = player.velocity.y; // Preserve current velocity
            let angularVelocity = 0; // Reset rotational velocity each frame
            let turretAngularVelocity = 0;
            
            // Apply acceleration based on input actions (forward/backward)
            if (actions & (1 << 0)) { // Move forward
                
                // Accelerate towards target speed in the direction of the player's angle
                velocityX += accelerationRate * Math.cos(player.angle);
                velocityY += accelerationRate * Math.sin(player.angle);
            }
            
            if (actions & (1 << 1)) { // Move backward
                // Accelerate in the opposite direction
                velocityX -= accelerationRate * Math.cos(player.angle);
                velocityY -= accelerationRate * Math.sin(player.angle);
            }
            
            // Apply rotational input (left or right)
            if (actions & (1 << 2)) { // Rotate left
                angularVelocity = -rotationSpeed; // Rotate counterclockwise
            }
            
            if (actions & (1 << 3)) { // Rotate right
                angularVelocity = rotationSpeed; // Rotate clockwise
            }

            if (actions & (1 << 4)) { // Rotate right
                turretAngularVelocity = -turretRotationSpeed; // Rotate clockwise
            }

            if (actions & (1 << 5)) { // Rotate right
                turretAngularVelocity = turretRotationSpeed; // Rotate clockwise
            }

            
            // Apply damping if no movement is input (gradual slowdown)
            if (!(actions & (1 << 0)) && !(actions & (1 << 1))) {
                // Slow down (damping) when no movement is input
                velocityX *= damping;
                velocityY *= damping;
            }
            
            // Ensure the velocity doesn't exceed the max speed
            const currentSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            if (currentSpeed > maxVelocity) {
                const scale = maxVelocity / currentSpeed; // Calculate scale factor
                velocityX *= scale;
                velocityY *= scale; // Apply the scale factor to limit the velocity
            }

            const mouseX = buffer.readUInt16LE(2); // Read mouseX
            const mouseY = buffer.readUInt16LE(4); // Read mouseY
         
            Matter.Body.setAngularVelocity(turret,turretAngularVelocity);
           
            Matter.Body.setVelocity(player, { x: velocityX, y: velocityY });
            Matter.Body.setAngularVelocity(player, angularVelocity);
            
            
        }

    });
    

    // Remove player on disconnect
    socket.on('close', () => {
        Matter.World.remove(world, players[id]);
        delete players[id];
        delete sockets[id];
    });
});



// Game loop to update physics and broadcast state
setInterval(() => {
  
    
    Matter.Engine.update(engine, 1000 / 60);
    messageType = MESSAGE_TYPES.PLAYER_UPDATE;
    //console.log('loop')
    // Create a binary state update message
    const playerCount = Object.keys(players).length;
    const buffer = Buffer.alloc(4 + playerCount * 28); // Header + player states
    buffer.writeUInt8(messageType, 0); // First byte: message type
    buffer.writeUInt16LE(playerCount, 1); // Next 2 bytes: number of players
  

let offset = 4; // Start writing player data after message type and player count

for (const [id, tank] of Object.entries(players)) {
    //console.log(offset)
    const turret = turrets[id]; // Assuming turrets share the same keys as players
    //console.log(id)
    buffer.writeUInt32LE(Number(id), offset);       // Player ID
    buffer.writeFloatLE(tank.position.x, offset + 4);  // Tank X position
    buffer.writeFloatLE(tank.position.y, offset + 8);  // Tank Y position
    buffer.writeFloatLE(tank.angle, offset + 12);      // Tank Angle

    if (turret) { // Ensure turret exists before writing
        buffer.writeFloatLE(turret.position.x, offset + 16); // Turret X position
        buffer.writeFloatLE(turret.position.y, offset + 20); // Turret Y position
        buffer.writeFloatLE(turret.angle, offset + 24);      // Turret Angle
    }

    offset += 28; // Move to the next player entry
}
// Move to the next player entry

    // Send state to all connected clients
    Object.values(sockets).forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(buffer);
        }
    });
}, 1000 / 60);
