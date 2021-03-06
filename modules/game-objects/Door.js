function Door(x, y, dest, noEntry, invertEntries, type) {
	this.x = x;
	this.y = y;
	this.dest = dest;
	this.noEntry = noEntry || false;
	this.invertEntries = invertEntries || false;
	this.type = type || "same";
	this.onPath = false;

	if(window["game"] === undefined) {
		/* the game is being initialized -> this must in the first room (room #0) */
		this.containingRoomID = 0;
	}
	else {
		this.containingRoomID = game.dungeon.length;
	}
};
Door.method("display", function() {
	/* Graphics */
	var self = this;
	var topLeft = graphics3D.point3D(this.x - 30, this.y - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + 30, this.y, 0.9);
	var middle = graphics3D.point3D(this.x, this.y, 0.9);
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				if(self.type === "arch") {
					c.fillStyle = "rgb(20, 20, 20)";
					c.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
					c.fillCircle(middle.x, topLeft.y, 27);
				}
				else if(self.type === "lintel") {
					c.fillStyle = "rgb(20, 20, 20)";
					c.fillRect(topLeft.x, topLeft.y - (30 * 0.9), bottomRight.x - topLeft.x, (bottomRight.y - topLeft.y) + (30 * 0.9));
				}

				/* display fading-back effect with floor behind door */
				c.save(); {
					c.beginPath();
					if(self.type === "arch") {
						c.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
						c.circle(middle.x, topLeft.y, 27);
					}
					else if(self.type === "lintel") {
						c.rect(topLeft.x, topLeft.y - (30 * 0.9), bottomRight.x - topLeft.x, (bottomRight.y - topLeft.y) + (30 * 0.9));
					}
					c.clip();

					c.fillStyle = "rgb(150, 150, 150)";
					var backLeft = graphics3D.point3D(self.x - 30, self.y, 0.75);
					var backRight = graphics3D.point3D(self.x + 30, self.y, 0.75);
					c.fillPoly(
						{ x: topLeft.x - 1, y: bottomRight.y + 1 },
						backLeft,
						backRight,
						{ x: bottomRight.x + 1, y: bottomRight.y + 1 }
					);
					var gradient = c.createLinearGradient(middle.x, middle.y, middle.x, graphics3D.point3D(self.x, self.y, 0.75).y);
					gradient.addColorStop(0, "rgba(20, 20, 20, 0)");
					gradient.addColorStop(0.5, "rgba(20, 20, 20, 0.6)");
					gradient.addColorStop(0.7, "rgba(20, 20, 20, 0.8)");
					gradient.addColorStop(1, "rgb(20, 20, 20)");
					c.fillStyle = gradient;
					c.fillRect(topLeft.x, topLeft.y - 30, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y + 30);
				} c.restore();

				if(self.barricaded) {
					c.save(); {
						c.lineWidth = 2;
						function displayWoodenBoard() {
							c.fillStyle = "rgb(139, 69, 19)";
							c.fillRect(-40, -10, 80, 20);
							function displayScrew(x, y) {
								c.fillStyle = "rgb(200, 200, 200)";
								c.strokeStyle = "rgb(255, 255, 255)";
								c.fillCircle(x, y, 5);
								c.strokeLine(x - 5, y, x + 5, y);
								c.strokeLine(x, y - 5, x, y + 5);
							};
							displayScrew(-30, 0);
							displayScrew(30, 0);
						};
						var doorWidth = (bottomRight.x - topLeft.x) / 2;
						for(var y = -20; y >= -60; y -= 20) {
							c.save(); {
								c.translate(middle.x, bottomRight.y + y);
								c.rotate((y === -40) ? Math.rad(-22) : Math.rad(22));
								displayWoodenBoard();
							} c.restore();
						}
					} c.restore();
				}
			},
			0.9,
			-1
		)
	);
	if(this.type === "lintel") {
		graphics3D.cube(this.x - 45, this.y - 110, 90, 20, 0.9, 0.91, "rgb(110, 110, 110)", "rgb(150, 150, 150)");
	}
});
Door.method("update", function() {
	/* Resolve type (arched top vs. lintel) */
	if(this.type === "same" || this.type === "toggle") {
		if(this.type === "same") {
			this.type = p.doorType;
		}
		else {
			this.type = (p.doorType === "arch") ? "lintel" : "arch";
		}
	}
	/* Room Transition */
	var topLeft = graphics3D.point3D(this.x - 30, this.y - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + 30, this.y, 0.9);
	if(collisions.objectIntersectsRect(p, { x: this.x - 30, y: this.y - 60, w: 60, h: 60}) && p.canJump && !p.enteringDoor && !p.exitingDoor && p.guiOpen === "none" && !this.barricaded) {
		if(io.keys.KeyS) {
			p.enteringDoor = true;
			this.entering = true;
		}
		ui.infoBar.actions.s = "enter door";
	}
	if(game.transitions.opacity > 0.95 && this.entering && !this.barricaded && !p.exitingDoor) {
		game.dungeon[game.inRoom].content.forEach(object => {
			if(typeof object.onRoomExit === "function") {
				object.onRoomExit();
			}
		});
		p.doorType = this.type;
		if(typeof this.dest !== "number") {
			game.generateNewRoom(this);
		}
		this.enter(p);
		this.entering = false;
	}
});
Door.method("isEnemyNear", function(enemy) {
	return collisions.objectIntersectsRect(enemy, { left: this.x - 30, right: this.x + 30, top: this.y - 60, bottom: this.y + 3});
});
Door.method("enter", function(obj) {
	if(obj instanceof Player) {
		if(Object.typeof(this.dest) === "array") {
			game.generateNewRoom(this);
		}
		var destinationDoor = this.getDestinationDoor();
		game.inRoom = this.dest;
		p.x = destinationDoor.x;
		p.y = destinationDoor.y - p.hitbox.bottom;
		p.enteringDoor = false;
		p.exitingDoor = true;
	}
	else if(obj instanceof Enemy) {
		var destinationRoom = this.getDestinationRoom();
		var destinationDoor = this.getDestinationDoor();
		var enemy = obj.clone();
		obj.toBeRemoved = true;
		enemy.x = destinationDoor.x;
		enemy.y = destinationDoor.y - enemy.hitbox.bottom;
		enemy.velocity = { x: 0, y: 0 };
		enemy.seesPlayer = false;
		enemy.opacity = 0;
		enemy.fadingIn = true;
		if(typeof enemy.onDoorEntry === "function") {
			enemy.onDoorEntry();
		}
		destinationRoom.content.push(enemy);
	}
	else {
		throw new Error("Only enemies and players can enter doors");
	}
});
Door.method("getDestinationRoom", function() {
	if(Object.typeof(this.dest) === "array") {
		return null; // no destination room if the door hasn't generated yet
	}
	return game.dungeon[this.dest];
});
Door.method("getDestinationDoor", function() {
	var destinationRoom = this.getDestinationRoom();
	return destinationRoom.content.filter(obj => obj instanceof Door && obj.dest === this.containingRoomID).onlyItem();
});
