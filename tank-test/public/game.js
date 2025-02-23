let socket;
let tanks = {};
let turrets = {};

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 300,
    zoom: 2,
    pixelArt:true,
    scene: {
        preload,
        create,
        update,
    },
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('tank', '/images/player_tank.png'); // Replace with your tank sprite
    this.load.image('tank_turret', '/images/player_tank_turret.png'); // Replace with your tank sprite
    this.load.image("tiles", "images/tileset_tank_battle.png");
  this.load.tilemapTiledJSON("map", 'maps/tank_test_level.json');
}

function create() {
   // const rect = this.add.rectangle(128, 640, 16, 16, 0x4c7df3);
   const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.hostname; // Gets only the domain (no port)
const wsPort = '8080'; // Specify your WebSocket port
const wsPath = '/'; // Adjust if needed (e.g., '/ws' or '/socket')

socket = new WebSocket(`${wsProtocol}//${wsHost}:${wsPort}`);
   //socket = new WebSocket('wss://port-8080-tank-battler-davidwj.preview.codeanywhere.com/');
   console.log(socket)
    socket.binaryType = 'arraybuffer';
    this.players=this.add.group();
    this.turrets=this.add.group();

    this.mouse = this.input.mousePointer;
    this.input.mouse.disableContextMenu();

    this.input.setDefaultCursor('url(images/crosshair.png),pointer');

    this.cameras.main.setBounds(0, 0, 1000, 1000);
  this.cameras.main.setRoundPixels(true);
  this.cameras.main.setDeadzone(200, 150)

  
   this.map = this.make.tilemap({
    key: "map"
  });
  const tileset = this.map.addTilesetImage("tank_battle_tiles", "tiles", 16, 16);
  const worldLayer = this.map.createLayer("Tile Layer 1", tileset, 0, 0);
  const collisionLayer = this.map.createLayer("Collisions", tileset, 0, 0);


    // Handle incoming state updates
    socket.onmessage = (event) => {
        const buffer = new DataView(event.data);
        const messageType = buffer.getUint8(0,true);
        tanks = {};
        socket.send('Hello from client!');
        if (messageType === 1)
        {
            console.log("1")
            id = buffer.getUint8(1)
            x = buffer.getUint16(2);
            y = buffer.getUint16(4);
            angle = buffer.getUint8(6);
            width = buffer.getUint8(7);
            height = buffer.getUint8(8);
            //create player
            //this.add.Sprite(x,y,tank).setSize(width,height)
           
            let newPlayerLocal = new Player(this,x,y,id,width,height,angle);
            this.localPlayer = newPlayerLocal;
            this.cameras.main.startFollow(this.localPlayer, true);
            this.players.add(newPlayerLocal);
            console.log(this)
          ///  console.log(newPlayer)
            turretId=buffer.getUint8(9);
           // console.log(buffer.getUint8(9));
            turretX=buffer.getUint16(10,true);
           
            turretY=buffer.getUint16(12,true);
            //console.log(buffer.getUint16(10));
         
            turretAngle=buffer.getUint8(14);
            turretWidth=buffer.getUint8(15);
            turretHeight=buffer.getUint8(16)
            let newTurretLocal = new PlayerTurret(this,turretX,turretY,turretId,turretWidth,turretHeight,turretAngle);
            this.localTurret=newTurretLocal
          
            this.turrets.add(newTurretLocal);

        }

        if (messageType === 5)
        {
            console.log('5')
            id = buffer.getUint8(1)
            x = buffer.getUint16(2,true);
            y = buffer.getUint16(4,true);
            angle = buffer.getUint8(6);
            width = buffer.getUint8(7);
            height = buffer.getUint8(8);
            //create player
            //this.add.Sprite(x,y,tank).setSize(width,height)
            console.log(id,x,y,angle,width,height)
            newPlayer = new Player(this,x,y,id,width,height,angle);
          
            this.players.add(newPlayer);
            console.log(newPlayer);

            turretId=buffer.getUint8(9);
          
            turretX=buffer.getUint16(10,true);
            
            turretY=buffer.getUint16(12,true);
        
            turretAngle=buffer.getUint8(14);
            turretWidth=buffer.getUint8(15);
            turretHeight=buffer.getUint8(16)
            newTurret = new PlayerTurret(this,turretX,turretY,turretId,turretWidth,turretHeight,turretAngle);
            
          
            this.turrets.add(newTurret);
            console.log(newTurret)

        }

        if (messageType === 2)
        {
            console.log("Processing existing players...");
            let offset = 1;
            const playerCount = (buffer.byteLength - 1) / 16; // Calculate number of players
            console.log("Buffer length:", buffer.byteLength);
            console.log(new Uint8Array(buffer.buffer));
            for (let i = 0; i < playerCount; i++) {
                if (offset + 2 > buffer.byteLength) {
                    console.error(`Cannot read Uint16 at offset + 1 (${offset + 1}). Buffer length: ${buffer.byteLength}`);
                    return; // Exit or handle the issue
                }
                const id = buffer.getUint8(offset);
                const x = buffer.getUint16(offset + 1, true);
                const y = buffer.getUint16(offset + 3, true);
               const angle = buffer.getUint8(offset + 5);
                const width = buffer.getUint8(offset + 6)
                const height = buffer.getUint8(offset + 7);
        
                const turretX = buffer.getUint16(offset + 8, true);
                const turretY = buffer.getUint16(offset + 10, true);
                const turretAngle = buffer.getUint8(offset + 12);
                const turretWidth = buffer.getUint8(offset + 13);
                const turretHeight = buffer.getUint8(offset + 14);
               // playersBuffer.writeUInt8(player.tank.angle, offset + 5);
                // Check if player already exists
                let existingPlayer = this.players.getChildren().find((p) => p.id === id);
                if (!existingPlayer) {
                    console.log(`Adding existing player: ID=${id}`);
                    console.log(this)
                    console.log(this, x, y, id, width, height);
                    let newPlayer = new Player(this, x, y, id, width, height, angle);
                    console.log(`Turret created at position: (${newPlayer.x}, ${newPlayer.y})`);
                    this.players.add(newPlayer);
                    console.log(this.players);
                    
                    console.log(turretX, turretY, id, turretWidth, turretHeight, turretAngle)
                    let newTurret = new PlayerTurret(this, turretX, turretY, id, turretWidth, turretHeight, turretAngle);

                    this.turrets.add(newTurret);
                    console.log(newTurret)
                } else {
                    console.log(`Player ID=${id} already exists.`);
                }
        
                offset += 16; // Move to the next player's data
            }

        }

        
        if (messageType === 3)
        {

            const parsedData = []    
        const numPlayers = buffer.getUint16(1, true); // First 2 bytes: number of players
        console.log(numPlayers)

        let offset = 4;
        for (let i = 0; i < numPlayers; i++) {
            console.log(buffer.getUint32(offset, true));
            const id = buffer.getUint32(offset, true); // 4 bytes for player ID
            const x = buffer.getFloat32(offset + 4, true); // 4 bytes for X position
            const y = buffer.getFloat32(offset + 8, true); // 4 bytes for Y position
            const angle = buffer.getFloat32(offset + 12, true);

             // turret
            const turretX = buffer.getFloat32(offset + 16, true); // X position
            const turretY =buffer.getFloat32(offset + 20, true); // Y position
            const turretAngle = buffer.getFloat32(offset + 24, true);

            parsedData.push({
                id,
                tank: { x, y, angle },
                turret: { x: turretX, y: turretY, angle: turretAngle },
            });

            console.log(JSON.stringify(parsedData, null, 2)); // Pretty print the parsed data
           
            //tanks[id] = { x, y };
            this.players.getChildren().forEach(player => {
                if (id === player.playerId)
                {
                   console.log(id, player.x,player.y)
                    player.x = x;
                    player.y = y;
                    //player.angle=angle
                    player.setRotation(angle)

                }
              });

              this.turrets.getChildren().forEach(turret => {
                  if (id === turret.turretId)
                  {
                    turret.x=turretX;
                    turret.y=turretY;
                    //turret.angle=turretAngle
                    turret.setRotation(turretAngle)


                  }
              });
           
            offset += 28;
        }

    }
    };



}

let lastActions = 0; // Keeps track of the last sent input state
const pressedKeys = new Set(); // Tracks currently pressed keys

const sendInput = (x,y) => {
    let actions = 0;

   // Encode input state as a bitmask
if (pressedKeys.has('ArrowUp')) actions |= 1 << 0; // Move forward
if (pressedKeys.has('ArrowDown')) actions |= 1 << 1; // Move backward
if (pressedKeys.has('ArrowLeft')) actions |= 1 << 2; // Rotate left
if (pressedKeys.has('ArrowRight')) actions |= 1 << 3; // Rotate right
if (pressedKeys.has('a')) actions |= 1 << 4; // New action for 'A' key
if (pressedKeys.has('d')) actions |= 1 << 5; // New action for 'D' key

// Send only if the input state has changed
// if (actions !== lastActions) {
const buffer = new Uint8Array(6); // 1 byte for actions, 2 bytes each for x and y positions
buffer[0] = 1; // Message type (1 = move)
buffer[1] = actions; // Current input bitmask

let mouseX = Math.round(x);
let mouseY = Math.round(y);

// Encode mouse x and y positions as 16-bit integers
buffer[2] = mouseX & 0xff; // Lower byte of mouseX
buffer[3] = (mouseX >> 8) & 0xff; // Upper byte of mouseX
buffer[4] = mouseY & 0xff; // Lower byte of mouseY
buffer[5] = (mouseY >> 8) & 0xff; // Upper byte of mouseY

if (socket.readyState === WebSocket.OPEN) {
    console.log(buffer);
    socket.send(buffer);
}

lastActions = actions; // Update last sent state
};

// Update pressed keys on keydown/keyup
document.addEventListener('keydown', (event) => {
    if (!pressedKeys.has(event.key)) { // Add only if not already pressed
        pressedKeys.add(event.key);
        //sendInput(); // Update input immediately
    }
});

document.addEventListener('keyup', (event) => {
    if (pressedKeys.has(event.key)) { // Remove only if it exists
        pressedKeys.delete(event.key);
        //sendInput(); // Update input immediately
    }
});
function update() {
    let pointerX = this.input.activePointer.x + this.cameras.main.scrollX
    let pointerY = this.input.activePointer.y + this.cameras.main.scrollY
   sendInput(pointerX,pointerY);
  //  this.players.getChildren().forEach(player =>{
    //    player.setRotation(player.angle)
   // });
   // this.turrets.getChildren().forEach(turret => {
     //   console.log(turret.angle)
     //   turret.setRotation(turret.angle)
     // });
  


}
