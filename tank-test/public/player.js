class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, id, width, height, angle) {
  
        super(scene, x, y,'tank');
        scene.add.existing(this);
        this.setSize(width,height)
        this.playerId=id;
        this.angle=angle;
        this.name='Player '+id
        

    }


}

class PlayerTurret extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, id, width, height, angle) {
  
        super(scene, x, y,'tank_turret');
        scene.add.existing(this);
        this.setSize(width,height)
        this.turretId=id;
        this.angle=angle;
        this.setOrigin(0.25,0.5);
              
    }


}