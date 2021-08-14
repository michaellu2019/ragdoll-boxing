/**
 * Game object class to update and render the player's fists
 */ 

/**
 * fist game object
 * @class Fist
 * @constructor
 * @param {Player} player, the player object to whom the fists belong
 * @param {Number} x, x position of the fist
 * @param {Number} y, y position of the fist
 * @param {Number} z, z position of the fist
 * @param {Number} px, px position of the player's body
 * @param {Number} py, py position of the player's body
 * @param {Number} pz, pz position of the player's body
 * @param {Number} radius, radius of the fist
 * @param {Number} orientation, either 1 or -1 representing whether the fist is a right fist or left fist
 * @param {Number} mass, mass of the fist
 * @param {String} color, String representation of the punching bag color
 */
function Fist(player, x, y, z, px, py, pz, radius, orientation, mass, color) { 
  this.restPosition = new CANNON.Vec3(x, y, z);
  this.playerPosition = new CANNON.Vec3(px, py, pz);
  const positionDiff = this.restPosition.vsub(this.playerPosition);
  this.relativePosition = new CANNON.Vec3(positionDiff.x, positionDiff.y, positionDiff.z);
  this.transformedRelativePosition = new CANNON.Vec3(this.relativePosition.x, this.relativePosition.y, this.relativePosition.z);
  this.punchState = "REST";
  this.currentPunch = "NONE";
  this.reach = sizeScale * 2.1;
  this.reachPosition = ZERO_VEC;
  this.punchTimeout = Date.now();
  this.punchDuration = 1500;
  this.weaveQuaternion = new CANNON.Quaternion(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z, ZERO_VEC.z);
  this.weaveBodyPosition = ZERO_VEC;
  this.weaveHeadPosition = ZERO_VEC;
  this.weaveFistPosition = ZERO_VEC;
  this.t = 0;
  this.orientation = orientation;
  this.sphere = new Sphere(x, y, z, radius, mass, color);
  this.player = player;
  
  // handles collisions between fists and other bodies
  const that = this;
  this.sphere.body.addEventListener("collide", function(e) {
    // update collision physics only if the body the fist collides with belongs to another player
    const unaffectedBodyIds = [that.player.head.body.id, that.player.body.body.id, 
                               that.player.leftFist.sphere.body.id, that.player.rightFist.sphere.body.id];
    if (unaffectedBodyIds.indexOf(e.body.id) < 0) {
      // opponent's fists should not be affected
      if (mode != "TRAINING") {
        unaffectedBodyIds.push(that.player.opponent.leftFist.sphere.body.id);
        unaffectedBodyIds.push(that.player.opponent.rightFist.sphere.body.id);
      }

      const thisBodyVelocity = that.sphere.body.velocity.x * that.sphere.body.velocity.x + that.sphere.body.velocity.y * that.sphere.body.velocity.y + that.sphere.body.velocity.z * that.sphere.body.velocity.z;
      const otherBodyVelocity = e.body.velocity.x * e.body.velocity.x + e.body.velocity.y * e.body.velocity.y + e.body.velocity.z * e.body.velocity.z
      if (thisBodyVelocity > otherBodyVelocity) {
        that.punchState = "RETURN";
        that.sphere.body.velocity.set(-that.sphere.body.velocity.x, -that.sphere.body.velocity.y, -that.sphere.body.velocity.z);
      }
      
      // if the body is safe to collide with, accelearte it and add a point bonus to the player
      if (unaffectedBodyIds.indexOf(e.body.id) < 0) {
        let impactVelocity = that.sphere.body.velocity;
        impactVelocity = impactVelocity.scale(30/e.body.mass);
        e.body.velocity.set(-impactVelocity.x, -impactVelocity.y, -impactVelocity.z);
        playRandom(punchSounds);

        if (that.player.moveSet != null) {
          that.player.moveSet.points++;
        }
      }
    }
  });
}

/**
 * Transform the fist's position based on the rotation of the player's body
 * @method transform
 * @param {Quaternion} quaternion, the quaternion representing the rotation of the player's body
 */
Fist.prototype.transform = function(quaternion) {
  // code from https://gamedev.stackexchange.com/questions/28395/rotating-vector3-by-a-quaternion
  let q = quaternion;
  q.normalize();
  const w = q.w;

  const u = new CANNON.Vec3(q.x, q.y, q.z);
  const v = new CANNON.Vec3(this.relativePosition.x, this.relativePosition.y, this.relativePosition.z);

  const dotUV = u.dot(v);
  const uProd = u.scale(2.0 * dotUV);
  
  const dotUU = u.dot(u);
  const vProd = v.scale(w * w - dotUU);

  const crossUV = u.cross(v);
  const uvProd = crossUV.scale(2.0 * w);

  const vp = uvProd.vadd(uProd.vadd(vProd));

  this.transformedRelativePosition.x = vp.x;
  this.transformedRelativePosition.y = vp.y;
  this.transformedRelativePosition.z = vp.z;
}

/**
 * Reset the fist and player's position, rotation, velocity, and angular velocity
 * @method restore
 */
Fist.prototype.restore = function() {
  const position = this.playerPosition.vadd(this.transformedRelativePosition);
  
  this.sphere.body.position.set(position.x, position.y, position.z);
  this.sphere.body.velocity.set(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z);
  this.sphere.body.quaternion.setFromEuler(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z, "XYZ");
  this.sphere.body.angularVelocity.set(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z);
  this.t = 0;
  
  this.player.body.body.angularVelocity.set(this.player.body.body.angularVelocity.x, 0, this.player.body.body.angularVelocity.z);
}

/**
 * Return whether the given punch move is for the left fist or right fist
 * @method orient
 * @param {String} punchMove, the ID of the given punch move
 * @return {String}, the string to indicate whether the given punch move is for the left fist or right fist
 */
Fist.prototype.orient = function(punchMove) {
  return punchMove.charAt(0) == "L" ? "LEFT" : "RIGHT";
}

/**
 * Classify the given punch move as a punch, hook, block, weave, or neither
 * @method orient
 * @param {String} punchMove, the ID of the given punch move
 * @return {String}, the string to indicate the type of punch
 */
Fist.prototype.classify = function(punchMove) {
  return punchMove.charAt(1) == "P" ? "PUNCH" : 
         punchMove.charAt(1) == "H" ? "HOOK" :
         punchMove.charAt(1) == "B" ? "BLOCK" :
         punchMove.charAt(1) == "W" ? "WEAVE" :
         "NONE";
}

/**
 * Perform the given punch move with the given acceleration values in the given direction
 * @method orient
 * @param {String} punchMove, the ID of the given punch move
 * @param {Array} accs, the xyz components of an acceleration vector for the punch
 * @param {Number} direction, a number either 1 or -1 indicating what direction along the z-axis to direct the punch
 */
Fist.prototype.punch = function(punchMove, accs, direction) {
  // if no punch is being thrown, then return, unless the player was blocking, then reset the punch state
  if (this.classify(punchMove) == "NONE") {
    if (this.classify(this.currentPunch) == "BLOCK") {
      this.punchState = "RETURN";
    } else {
      return;
    }
  }

  // apply a some recoil to the player for throwing a punch
  const punchRecoilMag = 100;
  const punchRecoil = new CANNON.Vec3((this.orient(punchMove) == "LEFT" ? 1 : -1) * punchRecoilMag, 0, direction * punchRecoilMag);
  this.player.body.body.applyLocalForce(punchRecoil, ZERO_VEC);

  if (this.punchState == "REST") {
    if (this.classify(punchMove) == "HOOK" || this.classify(punchMove) == "PUNCH") {
      // apply a force to move the fist in the indicated direction to start the punch
      const accMag = Math.sqrt(accs[0] * accs[0] + accs[1] * accs[1] + accs[2] * accs[2]);
      const forceMag = (3000 + accMag * 300) * direction;
      const force = new CANNON.Vec3(0, 0, forceMag);
      this.sphere.body.applyLocalForce(force, ZERO_VEC);

      playRandom(wooshSounds);
      this.punchTimeout = Date.now();
    } else if (this.classify(punchMove) == "BLOCK") {
      // apply a smaller force to move the fists up for a block
      const forceMag = 1000 * direction;
      const force = new CANNON.Vec3(0, -forceMag, 0);
      this.sphere.body.applyLocalForce(force, ZERO_VEC);
    }

    this.currentPunch = punchMove;
    this.punchState = "PUNCH";
  }
}

/**
 * Perform a straight punch
 * @method straightPunch
 */
Fist.prototype.straightPunch = function() {
  // move the fist along a 3D line
  this.t += Math.PI * 0.005 * this.sphere.body.velocity.z;
  const x = this.sphere.body.position.x + this.player.orientation * this.orientation * this.t * 0.2;
  const y = this.sphere.body.position.y - this.player.orientation * this.t * 0.5;
  const z = this.sphere.body.position.z + this.t;

  this.sphere.body.position.set(x, y, z);
}

/**
 * Perform a hook
 * @method hook
 */
Fist.prototype.hook = function() {
  // move the fist along a slanted elliptical curve
  this.t += -Math.PI * 0.05  * this.sphere.body.velocity.z;
  const x = this.restPosition.x - this.orientation * this.reach * 0.5 * Math.cos(this.player.orientation * this.t + Math.PI/2);
  const y = this.restPosition.y - this.player.orientation * this.t * 0.05;
  const z = this.restPosition.z - this.player.orientation * this.reach * 0.5 + this.reach * 0.6 * Math.sin(this.t + this.player.orientation * Math.PI/2);

  this.sphere.body.position.set(x, y, z);
}

/**
 * Perform a block
 * @method block
 */
Fist.prototype.block = function() {
  // move the fist along a 3D line oriented more upward
  this.t += Math.PI * 0.005 * this.sphere.body.velocity.y;
  const x = this.sphere.body.position.x - this.orientation * 0.075 * Math.log(this.t + 1);
  const y = this.sphere.body.position.y + 0.001 * Math.log(this.t + 1);
  const z = this.sphere.body.position.z - this.player.orientation * 0.15 * Math.log(this.t + 1);

  this.sphere.body.position.set(x, y, z);
}

/**
 * Perform a weave
 * @method weave
 * @param {Number} direction, a number either 1 or -1 indicating what direction along the x-axis to lean towards
 */
Fist.prototype.weave = function(direction) {
  // rotate the player's body in the indicated direction
  this.t += this.player.orientation * Math.PI * 0.01;
  const u = new CANNON.Vec3(0, 1, 0);
  
  const v = new CANNON.Vec3(direction * this.t, 1, 0);
  u.normalize();
  v.normalize();
  this.player.body.body.quaternion.setFromVectors(u, v);
  
  this.player.body.body.position.set(this.player.restPosition.x - (u.x - v.x), this.player.body.body.position.y - (u.y - v.y) * 0.005, this.player.body.body.position.z);
  this.player.head.body.position.set(this.player.restPosition.x - (u.x - v.x) * 2, this.player.head.body.position.y + (u.y - v.y) * 0.5, this.player.head.body.position.z);
  this.sphere.body.velocity.set(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z);
}

/**
 * Update the fist and its components
 * @method update
 */
Fist.prototype.update = function() {
  if (this.punchState == "PUNCH") {
    // perform the current punch
    if (this.classify(this.currentPunch) == "PUNCH") {
      this.straightPunch();
    } else if (this.classify(this.currentPunch) == "HOOK") {
      this.hook();
    } else if (this.classify(this.currentPunch) == "BLOCK") {
      this.block();
    } else if (this.classify(this.currentPunch) == "WEAVE") {
      this.weave(this.orient(this.currentPunch) == "LEFT" ? -1 : 1);
    }

    // update the punch state once the punch has moved far enough (or when the player has leaned far enough for weaves)
    if (this.classify(this.currentPunch) == "WEAVE") {
      let eulerRotation = new CANNON.Vec3(0, 0, 0);
      this.player.body.body.quaternion.toEuler(eulerRotation, "YZX");
      
      // if the player has tilted far enough for the weave, update the punch state so the player can reset themself
      if (Math.abs(eulerRotation.z) >= Math.PI * 0.15) {
        this.punchState = "RETURN";

        this.weaveQuaternion = new CANNON.Quaternion(this.player.body.body.quaternion.x, this.player.body.body.quaternion.y, this.player.body.body.quaternion.z, this.player.body.body.quaternion.w);
        this.weaveBodyPosition = new CANNON.Vec3(this.player.body.body.position.x, this.player.body.body.position.y, this.player.body.body.position.z);
        this.weaveHeadPosition = new CANNON.Vec3(this.player.head.body.position.x, this.player.head.body.position.y, this.player.head.body.position.z);
      }
    } else if (this.classify(this.currentPunch) == "HOOK" || this.classify(this.currentPunch) == "PUNCH") {
      // if the fist has traveled beyond the specified punch reach of the player, update the punch state so the fist returns
      if (this.sphere.body.position.distanceTo(this.restPosition) >= this.reach) {
        this.punchState = "RETURN";
      }
    } else if (this.classify(this.currentPunch) == "BLOCK") {
      // if the fist has traveled beyond the block punch reach, hold the punch at that location
      if (this.sphere.body.position.distanceTo(this.restPosition) >= this.reach * 0.4) {
        this.punchState = "HOLD";
        this.reachPosition = new CANNON.Vec3(this.sphere.body.position.x, this.sphere.body.position.y, this.sphere.body.position.z);
      }
    }
  } else if (this.punchState == "HOLD") {
    if (this.classify(this.currentPunch) == "BLOCK") {
      // hold the fist at the blocking position
      this.sphere.body.position.set(this.reachPosition.x, this.reachPosition.y, this.reachPosition.z);
      this.player.body.body.quaternion.setFromEuler(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z, "XYZ");
      this.player.body.body.position.set(this.player.restPosition.x, this.player.restPosition.y, this.player.restPosition.z);
    }
  } else if (this.punchState == "RETURN") {
    // restore the fists and player to their original positions
    if (this.classify(this.currentPunch) == "WEAVE") {
      // rotate the player back to their original orientation to point straight up
      let eulerRotation = new CANNON.Vec3(0, 0, 0);
      this.player.body.body.quaternion.toEuler(eulerRotation, "YZX");
      this.sphere.body.velocity.set(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z);

      // when the player is nearly pointing straight up, reset their orientation
      if (Math.abs(eulerRotation.z) <= Math.PI * 0.05) {
        this.punchState = "REST";
        this.currentPunch = "NONE";

        this.player.body.body.angularVelocity.set(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z);
        this.player.body.body.quaternion.setFromEuler(0, 0, 0, "XYZ");
        this.player.body.body.velocity.set(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z);

        this.player.head.body.velocity.set(ZERO_VEC.x, ZERO_VEC.y, ZERO_VEC.z);
      }
    } else if (this.classify(this.currentPunch) == "HOOK" || this.classify(this.currentPunch) == "PUNCH" || this.classify(this.currentPunch) == "BLOCK") {
      // give the fist a velocity to move it towards its original position
      let restoringVelocity = this.restPosition.vsub(this.sphere.body.position);
      restoringVelocity.normalize();
      const restoringScale = this.classify(this.currentPunch) == "HOOK" || this.classify(this.currentPunch) == "PUNCH" ? 10 : 3;
      restoringVelocity = restoringVelocity.scale(sizeScale * restoringScale);
      this.sphere.body.velocity.set(restoringVelocity.x, restoringVelocity.y, restoringVelocity.z);

      // when the fist is nearly at its original position, reset it
      const restoringDistance = this.classify(this.currentPunch) == "HOOK" || this.classify(this.currentPunch) == "PUNCH" ? sizeScale : sizeScale * 0.1;
      if (this.sphere.body.position.distanceTo(this.restPosition) <= restoringDistance) {
        this.punchState = "REST";
        this.currentPunch = "NONE";
      }
    }
  } else {
    this.restore();
  }

  // if the fist has gone too far away from the player, reset its position
  if (this.sphere.body.position.distanceTo(this.player.body.body.position) >= this.reach * 2) {
    this.punchState = "REST";
    this.restore();
  }

	this.sphere.update();
}