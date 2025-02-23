// Add a constraint to attach the turret to the tank
const turretPivot = Matter.Constraint.create({
    bodyA: tank,                // Attach to the tank
    bodyB: turret,              // Attach to the turret
    pointA: { x: 0, y: 0 },     // Center of the tank
    pointB: { x: 0, y: 0 },    // Offset from turret's center (pivot point)
    stiffness: 1,               // Keep the turret attached rigidly
    length: 0,                  // No slack in the constraint
});
Matter.World.add(world, turretPivot);

const playersBuffer = Buffer.alloc(1 + existingPlayers.length * 17); // Adjust size dynamically based on player count
playersBuffer.writeUInt8(MESSAGE_TYPES.EXISTING_PLAYERS, 0);
existingPlayers.forEach((player, index) => {
    const offset = 1 + index * 17;
    playersBuffer.writeUInt8(player.id, offset);
    playersBuffer.writeUInt16LE(player.tank.x, offset + 1);
    playersBuffer.writeUInt16LE(player.tank.y, offset + 3);
    playersBuffer.writeUInt8(23, offset + 5); // Tank width
    playersBuffer.writeUInt8(14, offset + 6); // Tank height
    playersBuffer.writeUInt16LE(player.turret.x, offset + 7);
    playersBuffer.writeUInt16LE(player.turret.y, offset + 9);
    playersBuffer.writeUInt8(24, offset + 11); // Turret width
    playersBuffer.writeUInt8(12, offset + 12); // Turret height
});

socket.send(playersBuffer);


for (const [id, tank] of Object.entries(players)) {
    let pivotX = tank.position.x; // Tank's position (center of rotation)
    let pivotY = tank.position.y;
    let tankId = id;
    let turretPivotOffset = { x: 0, y: 0 }; // Offset relative to the tank's center

    for (const [turretId, turret] of Object.entries(turrets)) {
        if (tankId === turretId) {
            // Increment the turret's independent rotation angle
            //turret.angle = (turret.angle || 0) + 0.001;

            // Rotate the turret's offset based on the tank's angle
            const rotatedOffsetX =
                turretPivotOffset.x * Math.cos(tank.angle) - turretPivotOffset.y * Math.sin(tank.angle);
            const rotatedOffsetY =
                turretPivotOffset.x * Math.sin(tank.angle) + turretPivotOffset.y * Math.cos(tank.angle);

            // Calculate the turret's position relative to the tank
            const turretX = pivotX + rotatedOffsetX;
            const turretY = pivotY + rotatedOffsetY;

            // The turret's final angle is the tank's angle + the turret's independent rotation
            const finalTurretAngle = turret.angle;

            // Update the turret's position and angle
            Matter.Body.setPosition(turret, { x: turretX, y: turretY });
            Matter.Body.setAngle(turret, finalTurretAngle); // Combined rotation
        }
    }
}

async function loadMapData() {
    try {
        const jsonString = await fs.readFile('tank-test/public/maps/tank_test_level.json', 'utf8');
        return JSON.parse(jsonString); // Return the parsed JSON data
    } catch (err) {
        console.error('Error reading or parsing file:', err);
        throw err; // Re-throw the error so the caller knows something went wrong
    }
}

// Usage
(async () => {
    try {
        this.mapData = await loadMapData(); // Wait for the data to be loaded
        console.log('Loaded map data:', mapData);
    } catch (err) {
        console.error('Failed to load map data:', err);
    }
});

// Calculate turret's position relative to the tank
      //     const rotatedOffsetX = 
        //       Math.cos(tank.angle) * turretOffsetFromTank.x - Math.sin(tank.angle) * turretOffsetFromTank.y;
        //   const rotatedOffsetY = 
         //      Math.sin(tank.angle) * turretOffsetFromTank.x + Math.cos(tank.angle) * turretOffsetFromTank.y;
       
           //const turretX = tank.position.x + rotatedOffsetX;
           //const turretY = tank.position.y + rotatedOffsetY;
       
           // Update turret's position and rotation
          // Matter.Body.setPosition(turret, { x: turretX, y: turretY });
          /// Matter.Body.setAngle(turret, newTurretAngle);
            //Matter.Body.setAngularVelocity(turret, 0.001)