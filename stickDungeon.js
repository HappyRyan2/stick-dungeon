/* IO + constants */
var canvas = document.getElementById("theCanvas");
var c = canvas.getContext("2d");

const FPS = 60;
const FLOOR_WIDTH = 0.1;
const TESTING_MODE = true;
const SHOW_HITBOXES = false;




var utils = {
	initializer: {
		/*
		This object allows you to request for things to be initialized while inside an object declaration.
		*/
		initFuncs: [],
		request: function(func) {
			this.initFuncs.push(func);
			return false;
		},
		initializeEverything: function() {
			return;
			while(this.initFuncs.length > 0) {
				for(var i = 0; i < this.initFuncs.length; i ++) {
					try {
						this.initFuncs[i]();
						this.initFuncs.splice(i, 1);
						i --;
					}
					catch(error) {
						/* This function was initalized in the wrong order, so skip it and come back later when more things have been initialized */
					}
				}
			}
		}
	}
};
var io = {
	keys: [],
	mouse: {
		x: 0,
		y: 0,
		pressed: false,
		cursor: "auto"
	},
	getMousePos: function(event) {
		var canvasRect = canvas.getBoundingClientRect();
		io.mouse.x = (event.clientX - canvasRect.left) / (canvasRect.right - canvasRect.left) * canvas.width;
		io.mouse.y = (event.clientY - canvasRect.top) / (canvasRect.bottom - canvasRect.top) * canvas.height;
	},
	initialized: function() {
		document.body.onkeydown = function() { io.keys[event.which] = true; };
		document.body.onkeyup = function() { io.keys[event.which] = false; };
		document.body.onmousedown = function() { io.mouse.pressed = true; };
		document.body.onmouseup = function() { io.mouse.pressed = false; };
		document.body.onmousemove = function() { io.getMousePos(event); };
		return true;
	} ()
};
var utils = {
	initializer: utils.initializer,

	mouseInRect: function(x, y, w, h) {
		return (collisions.pointIntersectsRectangle(
			{ x: io.mouse.x, y: io.mouse.y },
			{ x: x, y: y, w: w, h: h }
		));
	},
	mouseInCircle: function(x, y, r) {
		return collisions.pointIntersectsCircle(
			{ x: io.mouse.x, y: io.mouse.y },
			{ x: x, y: y, r: r }
		);
	},

	resizeCanvas: function() {
		if(window.innerWidth < window.innerHeight) {
			canvas.style.width = "100%";
			canvas.style.height = "";
		}
		else {
			canvas.style.width = "";
			canvas.style.height = "100%";
		}
		if(canvas.style.width === "100%") {
			/* canvas size is window.innerWidth * window.innerWidth pixels squared */
			canvas.style.top = (window.innerHeight / 2) - (window.innerWidth / 2) + "px";
			canvas.style.left = "0px";
		}
		else {
			canvas.style.left = (window.innerWidth / 2) - (window.innerHeight / 2) + "px";
			canvas.style.top = "0px";
		}
	},

	tempVars: {
		/* Temporary (local) variables, but used between functions go here */
	},
	pastInputs: {
		/* used to remember what inputs were given 1 frame ago */
		keys: [],
		mouse: { x: 0, y: 0, pressed: false },
		update: function() {
			this.keys = io.keys.clone();
			this.mouse = io.mouse.clone();
		}
	},
	frameCount: 0,

	sortAscending: function(a, b) {
		return a - b;
	},
	sortDescending: function(a, b) {
		return b - a;
	},

	geom: {
		Rectangle: function(dimensions) {
			/*
			Rectangles have properties {x, y, width, height}, {x, y, w, h}, and {left, right, top, bottom}. Whenever one property is changed, all the other properties are updated to reflect that change.
			*/
			var x;
			var xGetterSetter = {
				get: function() { return x; },
				set: function(newX) { x = newX; updateBounds(); }
			};
			Object.defineProperty(this, "x", xGetterSetter);
			var y;
			var yGetterSetter = {
				get: function() { return y; },
				set: function(newY) { y = newY; updateBounds(); }
			};
			Object.defineProperty(this, "y", yGetterSetter);
			var width;
			var widthGetterSetter = {
				get: function() { return width; },
				set: function(newWidth) { width = newWidth; updateBounds(); }
			};
			Object.defineProperty(this, "width", widthGetterSetter);
			Object.defineProperty(this, "w", widthGetterSetter);
			var height;
			var heightGetterSetter = {
				get: function() { return height; },
				set: function(newHeight) { height = newHeight; updateBounds(); }
			};
			Object.defineProperty(this, "height", heightGetterSetter);
			Object.defineProperty(this, "h", heightGetterSetter);

			var left;
			var leftGetterSetter = {
				get: function() { return left; },
				set: function(newLeft) { left = newLeft; updateDimensions(); }
			};
			Object.defineProperty(this, "left", leftGetterSetter);
			var right;
			var rightGetterSetter = {
				get: function() { return right; },
				set: function(newRight) { right = newRight; updateDimensions(); }
			};
			Object.defineProperty(this, "right", rightGetterSetter);
			var top;
			var topGetterSetter = {
				get: function() { return top; },
				set: function(newTop) { top = newTop; updateDimensions(); }
			};
			Object.defineProperty(this, "top", topGetterSetter);
			var bottom;
			var bottomGetterSetter = {
				get: function() { return bottom; },
				set: function(newBottom) { bottom = newBottom; updateDimensions(); }
			};
			Object.defineProperty(this, "bottom", bottomGetterSetter);

			function updateDimensions() {
				/* Update x, y, width, and height to be consistent with left, right, top, and bottom. */
				x = left;
				y = top;
				width = right - left;
				height = bottom - top;
			};
			function updateBounds() {
				/* update left, right, top, and bottom to be consistent with x, y, width, and height. */
				left = x;
				right = x + width;
				top = y;
				bottom = y + height;
			};

			for(var i in dimensions) {
				this[i] = dimensions[i];
			}
		}
		.method("translate", function(x, y) {
			return new utils.geom.Rectangle({ x: this.x + x, y: this.y + y, w: this.w, h: this.h });
		})
	}
};
var graphics3D = {
	point3D: function(x, y, z) {
		/*
		Returns the visual position of a point at 'x', 'y', 'z'
		*/
		return Math.scaleAboutPoint(x, y, canvas.width / 2, canvas.height / 2, z);
	},
	cube: function(x, y, w, h, backDepth, frontDepth, frontCol, sideCol, settings) {
		/*
		Draws a rect. prism from ('x', 'y', 'frontDepth') to ('x' + 'w', 'y' + 'h', 'backDepth').
		*/
		frontCol = frontCol || "rgb(110, 110, 110)";
		sideCol = sideCol || "rgb(150, 150, 150)";
		settings = settings || {};
		settings.noFrontExtended = settings.noFrontExtended || false;
		settings.sideColors = settings.sideColors || {left: sideCol, right: sideCol, top: sideCol, bottom: sideCol};
		if(frontDepth < backDepth) {
			throw new Error("frontDepth (" + frontDepth + ") must be greater than backDepth (" + backDepth + ")");
		}
		/* Calculate back face coordinates */
		var topLeftB = graphics3D.point3D(x, y, backDepth);
		var topRightB = graphics3D.point3D(x + w, y, backDepth);
		var bottomLeftB = graphics3D.point3D(x, y + h, backDepth);
		var bottomRightB = graphics3D.point3D(x + w, y + h, backDepth);
		/* Calculate front face coordinates */
		var topLeftF = graphics3D.point3D(x, y, frontDepth);
		var topRightF = graphics3D.point3D(x + w, y, frontDepth);
		var bottomLeftF = graphics3D.point3D(x, y + h, frontDepth);
		var bottomRightF = graphics3D.point3D(x + w, y + h, frontDepth);
		/* Top face */
		game.dungeon[game.theRoom].beginRenderingGroup(); {
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ topLeftF, topRightF, topRightB, topLeftB ],
					settings.sideColors.top,
					backDepth
				)
			);
			/* Bottom face */
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ bottomLeftF, bottomRightF, bottomRightB, bottomLeftB ],
					settings.sideColors.bottom,
					backDepth
				)
			);
			/* Left face */
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ topLeftF, bottomLeftF, bottomLeftB, topLeftB ],
					settings.sideColors.left,
					backDepth
				)
			);
			/* Right face */
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ topRightF, bottomRightF, bottomRightB, topRightB ],
					settings.sideColors.right,
					backDepth
				)
			);
		} game.dungeon[game.theRoom].endRenderingGroup();
		/* Front face */
		if(!settings.noFrontExtended) {
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"rect",
					{
						x: topLeftF.x,
						y: topLeftF.y,
						w: bottomRightF.x - topLeftF.x,
						h: bottomRightF.y - topLeftF.y
					},
					frontCol,
					frontDepth
				)
			);
		}
		else {
			c.fillStyle = frontCol;
			c.fillRect(topLeftF.x, topLeftF.y, bottomRightF.x - topLeftF.x, bottomRightF.y - topLeftF.y);
		}
	},
	plane3D: function(x1, y1, x2, y2, backDepth, frontDepth, col) {
		/*
		Draws a plane extending the line between ('x1', 'y1') and ('x2', 'y2') from 'frontDepth' to 'backDepth' with a color of 'col'.
		*/
		var p1 = graphics3D.point3D(x1, y1, frontDepth);
		var p2 = graphics3D.point3D(x1, y1, backDepth);
		var p3 = graphics3D.point3D(x2, y2, backDepth);
		var p4 = graphics3D.point3D(x2, y2, frontDepth);
		c.fillStyle = col;
		c.fillPoly(p1, p2, p3, p4);
	},
	line3D: function(x1, y1, z1, x2, y2, z2) {
		var point1 = this.point3D(x1, y1, z1);
		var point2 = this.point3D(x2, y2, z2);
		var lineWidth = c.lineWidth;
		var strokeStyle = c.strokeStyle;
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					c.lineWidth = lineWidth;
					c.strokeStyle = strokeStyle;
					c.strokeLine(point1.x, point1.y, point2.x, point2.y);
				},
				Math.min(z1, z2)
			)
		);
	},
	polygon3D: function(frontCol, sideCol, backDepth, frontDepth, points, settings) {
		/*
		Draws a sideways polygonal prism w/ base defined by 'points' array, w/ front color 'frontCol' and side color 'sideCol' going from 'frontDepth' to 'backDepth'.
		*/
		if(frontDepth > backDepth) {
			var start = frontDepth;
			frontDepth = backDepth;
			backDepth = start;
		}
		/* Generate a list of points in 3d */
		var frontVertices = [];
		var backVertices = [];
		for(var i = 0; i < points.length; i ++) {
			var front = graphics3D.point3D(points[i].x, points[i].y, backDepth)
			frontVertices.push(front);
			backVertices.push(graphics3D.point3D(points[i].x, points[i].y, frontDepth));
		}
		/* side faces */
		c.fillStyle = sideCol;
		game.dungeon[game.theRoom].beginRenderingGroup(); {
			for(var i = 0; i < frontVertices.length; i ++) {
				var next = (i === frontVertices.length - 1) ? 0 : i + 1;
				game.dungeon[game.theRoom].render(
					new RenderingOrderShape(
						"polygon",
						[frontVertices[i], frontVertices[next], backVertices[next], backVertices[i]],
						sideCol,
						frontDepth
					)
				);
			}
		} game.dungeon[game.theRoom].endRenderingGroup();
		/* front face */
		game.dungeon[game.theRoom].render(
			new RenderingOrderShape(
				"polygon",
				frontVertices,
				frontCol,
				backDepth,
			)
		);
	},
	polyhedron: function(color, points) {
		/*
		Not really a polyhedron. It just connects the (3d) points in order.
		*/
		var farthestBackPoint = Infinity;
		for(var i = 0; i < points.length; i ++) {
			if(points[i].z < farthestBackPoint) {
				farthestBackPoint = points[i].z;
			}
		}
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					var points3D = [];
					for(var i = 0; i < points.length; i ++) {
						var location = graphics3D.point3D(points[i].x, points[i].y, points[i].z);
						points3D.push(location);
					}
					c.fillStyle = color;
					c.fillPoly(location);
				},
				farthestBackPoint
			)
		);
	},

	cutoutPolygon: function(frontCol, sideCol, backDepth, frontDepth, points) {
		if(frontDepth < backDepth) {
			throw new Error("frontDepth (" + frontDepth + ") must be greater than backDepth (" + backDepth + ")");
		}
		var front = [];
		for(var i = 0; i < points.length; i ++) {
			front.push(graphics3D.point3D(points[i].x, points[i].y, frontDepth));
		}
		var back = [];
		for(var i = 0; i < points.length; i ++) {
			back.push(graphics3D.point3D(points[i].x, points[i].y, backDepth));
		}
		c.save(); {
			game.dungeon[game.theRoom].setRenderingStyle(function() {
				c.beginPath();
				c.polygon(front);
				c.clip();
			});
			game.dungeon[game.theRoom].beginRenderingGroup(); {
				for(var i = 0; i < points.length; i ++) {
					var next = (i === points.length - 1) ? 0 : i + 1;
					game.dungeon[game.theRoom].render(new RenderingOrderShape(
						"polygon",
						[ front[i], front[next], back[next], back[i] ],
						sideCol,
						backDepth
					))
					// c.fillPoly(front[i], front[next], back[next], back[i]);
				}
			} game.dungeon[game.theRoom].endRenderingGroup();
			game.dungeon[game.theRoom].clearRenderingStyle();
		} c.restore();
	},
	cutoutRect: function(x, y, w, h, frontCol, sideCol, backDepth, frontDepth) {
		this.cutoutPolygon(
			frontCol, sideCol, backDepth, frontDepth,
			[
				{ x: x, y: y },
				{ x: x + w, y: y },
				{ x: x + w, y: y + h },
				{ x: x, y: y + h }
			]
		);
	},

	loadBoxFronts: function() {
		for(var i = 0; i < graphics3D.boxFronts.length; i ++) {
			var boxFront = graphics3D.boxFronts[i];
			if(graphics3D.boxFronts[i].type === "boulder void") {
				c.globalAlpha = Math.min(boxFront.opacity, 0);
				c.fillStyle = "rgb(150, 150, 150)";
				c.fillPoly(boxFront.pos1, boxFront.pos2, boxFront.pos3, boxFront.pos4);
				c.globalAlpha = 1;
			}
			if(graphics3D.boxFronts[i].type === "rect") {
				c.fillStyle = boxFront.col;
				c.fillRect(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3]);
			}
			else if(boxFront.type === "polygon") {
				c.fillStyle = boxFront.col;
				c.fillPoly(boxFront.loc);
			}
			else if(boxFront.type === "circle") {
				c.fillStyle = boxFront.col;
				c.fillCircle(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2]);
			}
			else if(graphics3D.boxFronts[i].type === "arc") {
				c.fillStyle = boxFront.col;
				c.strokeStyle = boxFront.col;
				c.fillArc(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3], boxFront.loc[4], true);
				c.strokeArc(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3], boxFront.loc[4]);
			}
		}
		/* extra graphics */
		c.save(); {
			for(var i = 0; i < graphics3D.extraGraphics.length; i ++) {
				if(graphics3D.extraGraphics[i].type === "polygon") {
					c.globalAlpha = 0.5;
					c.fillStyle = graphics3D.extraGraphics[i].col;
					c.fillPoly(graphics3D.extraGraphics[i].loc);
				}
			}
		} c.restore();
	},

	extraGraphics: [],
	boxFronts: []
};
var collisions = {
	solids: {
		rect: function(x, y, w, h, settings) {
			/*
			Adds a CollisionRect object at the parameter's locations.
			*/
			collisions.collisions.push(new CollisionRect(x, y, w, h, settings));
		},
		line: function(x1, y1, x2, y2, settings) {
			/*
			Places a line of CollisionRects between ('x1', 'y1') and ('x2', 'y2').
			*/
			settings = settings || {};
			if(settings.illegalHandling === undefined) {
				if(Math.dist(x1, x2) < Math.dist(y1, y2) || (p.y + 10 > y1 && p.y + 10 > y2)) {
					settings.illegalHandling = "collide";
					if(settings.walls === undefined) {
						settings.walls = [false, true, true, true];
					}
				}
				else {
					settings.illegalHandling = "teleport";
				}
			}
			settings.moving = settings.moving || false;
			settings.extraBouncy = settings.extraBouncy || false;
			/* Generate a list of points to place collisions at */
			var points = Math.findPointsLinear(x1, y1, x2, y2);
			/* Place collisions at all those points */
			for(var i = 0; i < points.length; i ++) {
				collisions.solids.rect(points[i].x, points[i].y, 3, 3, { illegalHandling: settings.illegalHandling, walls: settings.walls, extraBouncy: settings.extraBouncy, moving: settings.moving, onCollision: settings.onCollision, collisionCriteria: settings.collisionCriteria, noPositionLimits: settings.noPositionLimits });
			}
		},
		circle: function(x, y, r) {
			collisions.collisions.push(new CollisionCircle(x, y, r));
		}
	},

	collisions: [],

	pointIntersectsRectangle: Function.overload({
		"object {x, y}, object {x, y, w, h}": function(point, rect) {
			return (point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h);
		},
		"object {x, y}, object {x, y, width, height}": function(point, rect) {
			return (point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height);
		},
		"object {x, y}, object {left, right, top, bottom}": function(point, rect) {
			return (point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom);
		}
	}),
	pointIntersectsCircle: Function.overload({
		"object {x, y}, object {x, y, r}": function(point, circle) {
			return (Math.distSq(point.x, point.y, circle.x, circle.y) <= (circle.r * circle.r));
		},
		"object {x, y}, object {x, y, radius}": function(point, circle) {
			return this.pointIntersectsCircle(point, { x: circle.x, y: circle.y, r: circle.radius });
		},
		"number, number, number, number, number": function(x, y, circleX, circleY, radius) {
			return this.pointIntersectsCircle(
				{ x: x, y: y },
				{ x: circleX, y: circleY, r: radius }
			);
		}
	}),
	rectangleIntersectsRectangle: function(rect1, rect2) {
		function convertToCorrectForm(rect) {
			if(rect.hasOwnProperties("x", "y", "w", "h")) {
				return rect;
			}
			else if(rect.hasOwnProperties("x", "y", "width", "height")) {
				return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
			}
			else if(rect.hasOwnProperties("left", "right", "top", "bottom")) {
				return {
					x: rect.left,
					y: rect.top,
					w: Math.dist(rect.left, rect.right),
					h: Math.dist(rect.top, rect.bottom)
				};
			}
		};
		rect1 = convertToCorrectForm(rect1);
		rect2 = convertToCorrectForm(rect2);
		return (
			rect1.x + rect1.w > rect2.x &&
			rect1.x < rect2.x + rect2.w &&
			rect1.y + rect1.h > rect2.y &&
			rect1.y < rect2.y + rect2.h
		);
	},
	rectangleIntersectsCircle: function(rect, circle) {
		/*
		Rectangle: {x, y, w, h}, {x, y, width, height}, {left, right, top, bottom}
		Circle: {x, y, r} or {x, y, radius}
		*/
		var point = { x: circle.x, y: circle.y };
		if(rect.hasOwnProperties("x", "y", "w", "h")) {
			point = {
				x: Math.constrain(point.x, rect.x, rect.x + rect.w),
				y: Math.constrain(point.y, rect.y, rect.y + rect.h)
			};
		}
		else if(rect.hasOwnProperties("x", "y", "width", "height")) {
			point = {
				x: Math.constrain(point.x, rect.x, rect.x + rect.width),
				y: Math.constrain(point.y, rect.y, rect.y + rect.height)
			};
		}
		else if(rect.hasOwnProperties("left", "right", "top", "bottom")) {
			point = {
				x: Math.constrain(point.x, rect.left, rect.right),
				y: Math.constrain(point.y, rect.top, rect.bottom)
			};
		}
		return collisions.pointIntersectsCircle(point, circle);
	},

	objectIntersectsObject: function(obj1, obj2) {
		if(!(obj1.hitbox instanceof utils.geom.Rectangle && obj2.hitbox instanceof utils.geom.Rectangle)) {
			throw new Error("Objects of type " + obj1.constructor.name + " and " + obj2.constructor.name + " have invalid hitbox properties for collision checking.");
		}
		if(obj1 instanceof Player) {
			return this.collidesWith(obj2, obj1);
		}
		return (
			obj1.x + obj1.hitbox.right > obj2.x + obj2.hitbox.left &&
			obj1.x + obj1.hitbox.left < obj2.x + obj2.hitbox.right &&
			obj1.y + obj1.hitbox.bottom > obj2.y + obj2.hitbox.top &&
			obj1.y + obj1.hitbox.top < obj2.y + obj2.hitbox.bottom
		);
	},
	objectIntersectsPoint: Function.overload({
		"object {hitbox}, object {x, y}": function(obj, point) {
			return this.objectIntersectsPoint(obj, point.x, point.y);
		},
		"object {hitbox}, number, number": function(obj, x, y) {
			return collisions.pointIntersectsRectangle({ x: x, y: y }, obj.hitbox.translate(obj.x, obj.y));
		}
	}),
	objectIntersectsRect: function(obj, rect) {
		return collisions.rectangleIntersectsRectangle(obj.hitbox.translate(obj.x, obj.y), rect);
	},
	objectIntersectsCircle: function(obj, circle) {
		return collisions.rectangleIntersectsCircle(obj.hitbox.translate(obj.x, obj.y), circle);
	}
};
var debugging = {
	/*
	This object provides methods + properties so that you can disable certain aspects of the game for manual testing + debugging.
	*/
	hitboxes: [],
	timeOfLastCall: 0,
	frameOfLastCall: 0,
	fps: 0,

	activateDebuggingSettings: function() {
		game.onScreen = "play";
		/* override randomizer for room generation */
		var includedRooms = ["combat1", "reward2"];
		var allRooms = game.rooms.getAllRooms();
		allRooms.forEach((room) => {
			if(!includedRooms.includes(room.name)) {
				// delete game.rooms[room.name];
			}
		});
		// game.items = [Sword];
		game.enemies = [Dragonling];
		/* load different rooms to override the first room */
		function loadRoom(id) {
			game.dungeon = [];
			if(Object.typeof(game.rooms[id]) !== "object") {
				throw new Error("Could not find room ID of '" + id + "'");
			}
			game.rooms[id].add();
			var room = game.dungeon[0];
			var entranceDoor = room.content.filter((obj) => (obj instanceof Door))[0];
			p.x = entranceDoor.x;
			p.y = entranceDoor.y - p.hitbox.bottom;
			room.colorScheme = ["red", "green", "blue"].randomItem();
			game.dungeon[0].getInstancesOf(Door).forEach(function(obj) { obj.containingRoomID = 0; });
		};
		loadRoom("parkour1");
		/* change doors in first room */
		for(var i = 0; i < game.dungeon[0].content.length; i ++) {
			if(game.dungeon[0].content[i] instanceof Door) {
				// game.dungeon[0].content[i].dest = ["reward"];
			}
		}
		/* give player items */
		p.class = "archer";
		for(var i = 0; i < game.items.length; i ++) {
			// p.addItem(new game.items[i]());
		}
		p.addItem(new WoodBow());
		p.addItem(new MechBow());
		p.addItem(new EnergyStaff());
		p.addItem(new Arrow(Infinity));
	},
	drawPoint: function() {
		/* Puts a point at the location. (Used for visualizing graphic functions) */
		c.save(); {
			c.fillStyle = "rgb(255, 0, 0)";
			var size = Math.sin(utils.frameCount / 10) * 5 + 5;
			if(typeof arguments[0] === "number") {
				c.fillCircle(arguments[0], arguments[1], size);
			}
			else {
				c.fillCircle(arguments[0].x, arguments[0].y, size);
			}
		} c.restore();
	},

	calculateFPS: function() {
		var timeNow = new Date().getTime();
		var timePassed = timeNow - this.timeOfLastCall;
		var framesNow = utils.frameCount;
		var framesPassed = framesNow - this.frameOfLastCall;
		this.fps = Math.round(framesPassed / timePassed * 1000);

		this.timeOfLastCall = timeNow;
		this.frameOfLastCall = framesNow;
	},
	displayFPS: function() {
		c.fillStyle = "rgb(255, 255, 255)";
		c.textAlign = "left";
		c.fillText(this.fps + " fps", 0, 10);
	},

	displayHitboxes: function() {
		var colorIntensity = Math.map(
			Math.sin(utils.frameCount / 30),
			-1, 1,
			225, 255
		);
		const COLORS = {
			"light blue": "rgb(0, " + colorIntensity + ", " + colorIntensity + ")",
			"dark blue": "rgb(0, 0, " + colorIntensity + ")",
			"green": "rgb(0, " + colorIntensity + ", 0)"
		};
		for(var i = 0; i < debugging.hitboxes.length; i ++) {
			var hitbox = debugging.hitboxes[i];
			c.strokeStyle = COLORS[hitbox.color];
			c.lineWidth = 5;
			if(hitbox.hasOwnProperties("x", "y", "r")) {
				c.strokeCircle(hitbox.x + game.camera.getOffsetX(), hitbox.y + game.camera.getOffsetY(), hitbox.r);
			}
			else if(hitbox.hasOwnProperties("x", "y", "w", "h")) {
				c.strokeRect(hitbox.x + game.camera.getOffsetX(), hitbox.y + game.camera.getOffsetY(), hitbox.w, hitbox.h);
			}
		}
	},

	clearSlot: function(id) {
		/* Clears the specified slot of the player's inventory */
		if(Object.typeof(id) !== "number") {
			p.invSlots.forEach((slot) => { slot.content = "empty"; });
		}
		else {
			p.invSlots[id].content = "empty";
		}
	}
};
var game = {
	items: [
		Dagger, Sword, Spear, //melee weapons
		WoodBow, MetalBow, MechBow, LongBow, //ranged weapons
		EnergyStaff, ElementalStaff, ChaosStaff, //magic weapons
		WizardHat, MagicQuiver, Helmet, //equipables
		Barricade, Map, //extras / bonuses
		FireCrystal, WaterCrystal, EarthCrystal, AirCrystal //crystals
	],
	enemies: [
		Spider, Bat,
		SkeletonWarrior, SkeletonArcher,
		Wraith, Dragonling, Troll
	],
	rooms: {
		ambient1: {
			name: "ambient1",
			colorScheme: null,
			difficulty: 0,
			extraDoors: 2,
			add: function() {
				game.dungeon.push(
					new Room(
						"ambient1",
						[
							new Pillar(200, 500, 200),
							new Pillar(400, 500, 200),
							new Pillar(600, 500, 200),
							new Pillar(800, 500, 200),
							new Block(-200, 500, 2000, 2000),//floor
							new Block(-600, -200, 700, 2000), //left wall
							new Block(-400, -1000, 2000, 1300), //ceiling
							new Block(900, -200, 500, 1000), //right wall
							new Door(300,  500, ["ambient", "combat", "parkour", "secret"]),
							new Door(500,  500, ["ambient", "combat", "parkour", "secret"]),
							new Door(700,  500, ["ambient", "combat", "parkour", "secret"])
						],
						"?"
					)
				);
			}
		},
		ambient2: {
			name: "ambient2",
			colorScheme: "all",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(
					new Room(
						"ambient2",
						[
							new Block(-1000, -1000, 1300, 2000), //left wall
							new Block(-100, 500, 1500, 500), //floor
							new Block(-400, -1000, 2000, 1300), //roof
							new Block(1000, -500, 1000, 1100), //right wall
							new Torch(500, 440),
							new Torch(600, 440),
							new Torch(700, 440),
							new Torch(800, 440),
							new Door(400, 500, ["combat", "parkour", "secret"], false, false, "toggle"),
							new Door(900, 500, ["combat", "parkour", "secret"], false, false, "toggle")
						],
						"?"
					)
				);
			}
		},
		ambient3: {
			name: "ambient3",
			colorScheme: "all",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				if(Math.random() < 0.5) {
					game.dungeon.push(
						new Room(
							"ambient3",
							[
								new Block(-4000, 0, 8000, 1000), //floor
								new Stairs(200, 0, 10, "right"),
								new Block(600, -4000, 4000, 4100), //right wall
								new Door(500, 0, ["combat", "parkour", "secret"], true, false, "toggle"),
								new Block(-800, -200, 1001, 1000), //higher floor
								new Door(100, -200, ["combat", "parkour", "secret"]),
								new Block(-1000, -4000, 1000, 8000), //left wall
								new Block(-4000, -1400, 8000, 1000) //roof
							],
							"?"
						)
					);
				}
				else {
					game.dungeon.push(
						new Room(
							"ambient3",
							[
								new Block(-4000, 0, 8000, 1000), //floor
								new Stairs(-200, 0, 10, "left"),
								new Block(-4600, -4000, 4000, 4100), //left wall
								new Door(-500, 0, ["combat", "parkour", "secret"], true, false, "toggle"),
								new Block(-200, -200, 1000, 1000), //higher floor
								new Door(-100, -200, ["combat", "parkour", "secret"]),
								new Block(0, -4000, 1000, 8000), //right wall
								new Block(-4000, -1400, 8000, 1000) //roof
							],
							"?"
						)
					);
				}
			}
		},
		ambient4: {
			name: "ambient4",
			colorScheme: null,
			difficulty: 1,
			add: function() {
				game.dungeon.push(
					new Room(
						"ambient4",
						[
							new Block(-1000, -1000, 1300, 2000), //left wall
							new Block(-100, 500, 600, 1000), //left floor
							new Block(780, 500, 1000, 1000), //right floor
							new Block(-400, -1000, 2000, 1300), //roof
							new Block(980, -500, 1000, 1100), //right wall
							new FallBlock(520, 500),
							new FallBlock(560, 500),
							new FallBlock(600, 500),
							new FallBlock(640, 500),
							new FallBlock(680, 500),
							new FallBlock(720, 500),
							new FallBlock(760, 500),
							new Door(400, 500, ["combat", "parkour", "secret"], false, false, "toggle"),
							new Door(880, 500, ["combat", "parkour", "secret"], false, false, "toggle")
						],
						"?",
						-200
					)
				);
			}
		},
		ambient5: {
			name: "ambient5",
			colorScheme: "blue",
			difficulty: 0,
			add: function() {
				game.dungeon.push(
					new Room(
						"ambient5",
						[
							new Fountain(650, 500),
							new Block(-1000, -1000, 1300, 2000), //left wall
							new Block(-100, 500, 1500, 500), //floor
							new Block(999, -500, 1000, 1100), //right wall
							new Roof(650, 200, 350),
							new Door(400, 500, ["combat", "parkour", "secret"], false, false, "toggle"),
							new Door(900, 500, ["combat", "parkour", "secret"], false, false, "toggle")
						],
						"?",
						undefined,
						"plain"
					)
				);
				game.dungeon[game.dungeon.length - 1].colorScheme = "blue";
			}
		},
		ambient6: {
			name: "ambient6",
			colorScheme: "green",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(
					new Room(
						"secret1",
						[
							new Block(-1000, -1000, 1000, 2000), //left wall
							new Block(-100, 500, 1010, 500), //floor
							new Block(900, -1000, 1000, 2000), //right wall,
							new Door(100, 500, ["ambient", "combat", "parkour"]),
							new Door(800, 500, ["ambient", "combat", "parkour"]),
							new LightRay(200, 500, 500),
							new Tree(450, 500),
							new Block(-300, 0, 500, 100), //left roof,
							new Block(700, 0, 500, 100), //right roof
							new Block(-300, -1300, 500, 1302), //left roof
							new Block(700, -1300, 500, 1302), //right roof
						],
						"?"
					)
				);
				game.dungeon[game.dungeon.length - 1].colorScheme = "green";
			}
		},
		secret1: {
			name: "secret1",
			colorScheme: "all",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				var possibleItems = game.items.clone();
				for(var i = 0; i < possibleItems.length; i ++) {
					if(!(new possibleItems[i]() instanceof Weapon) || new possibleItems[i]() instanceof Arrow || new possibleItems[i]() instanceof Dagger) {
						possibleItems.splice(i, 1);
						i --;
						continue;
					}
					var hasIt = false;
					for(var j = 0; j < p.invSlots.length; j ++) {
						if(p.invSlots[j].content instanceof possibleItems[i]) {
							hasIt = true;
						}
					}
					if(p.hasInInventory(possibleItems[i])) {
						possibleItems.splice(i, 1);
						i --;
						continue;
					}
				}
				if(possibleItems.length === 0) {
					/* default to combat1 if the player has all the weapons in the game */
					if(Object.typeof(game.rooms.combat3) === "object") {
						game.rooms.combat3.add();
					}
					else {
						throw new Error("Player has all items in game and default room was not available");
					}
				}
				game.dungeon.push(
					new Room(
						"secret1",
						[
							new Block(-1000, -1000, 1000, 2000), //left wall
							new Block(-100, 500, 1010, 500), //floor
							new Block(600, -1000, 1000, 2000), //right wall,
							new Roof(300, 200, 300),
							new Decoration(200, 450),
							new Decoration(400, 450),
							new Statue(300, 370, new Sword()),
							new Door(100, 500, ["ambient", "combat", "parkour"]),
							new Door(500, 500, ["ambient", "combat", "parkour"])
						],
						"?"
					)
				);
			},
			getPossibleStatueItems: function() {
				return game.items.clone().filter(function(constructor) {
					var instance = new constructor();
					return instance instanceof Weapon && !(instance instanceof Arrow || instance instanceof Dagger);
				}).filter(function(constructor) {
					return !p.hasInInventory(constructor);
				});
			}
		},
		combat1: {
			name: "combat1",
			colorScheme: "all",
			difficulty: 3,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
					new Room(
						"combat1",
						[
							new Block(-2000, 0, 4000, 1000), //floor
							new Block(-1000, -4000, 500, 8000), //left wall
							new Block(500, -4000, 1000, 8000), //right wall
							new Roof(0, -300, 500),
							new Door(-450, 0, ["ambient"], false),
							new Door(0, 0, ["reward"], true, false, "toggle"),
							new Door(450, 0, ["ambient"], false).beginDebugging(),
							new Decoration(300, -50), new Decoration(-300, -50),
							new Decoration(150, -50), new Decoration(-150, -50),
							new RandomEnemy(0, 0)
						],
						"?"
					)
				);
			}
		},
		combat2: {
			name: "combat2",
			colorScheme: null,
			difficulty: 5,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(
					new Room(
						"combat2",
						[
							new Stairs(200, 0, 10, "right"),
							new Stairs(0, 0, 10, "left"),
							new Block(-4000, 0, 8000, 1000), //floor
							new Block(600, -4000, 4000, 4100), //right wall
							new Block(-1400, -4000, 1000, 8000), //left wall
							new Block(0, -200, 201, 1000), //higher floor
							new Block(-4000, -1400, 8000, 1000), //roof
							new Door(-300, 0, ["reward"], true),
							new Door(500, 0, ["reward"], true),
							new Door(100, -200, ["ambient"], false, false, "toggle"),
							new RandomEnemy(500, 0),
							new RandomEnemy(-300, 0)
						],
						"?"
					)
				);
			}
		},
		combat3: {
			name: "combat3",
			colorScheme: null,
			difficulty: 4,
			extraDoors: 0.5,
			add: function() {
				game.dungeon.push(
					new Room(
						"combat3",
						[
							new Block(-100, 0, 200, 8000), //left floor
							new Block(-4000, -4000, 3900, 8000), //left wall
							new Block(900, 0, 300, 8000), //right floor
							new Block(1100, -4000, 1000, 8000), //right wall
							new Bridge(500, -200),
							new Door(1000, 0, ["reward"]),
							new Door(0, 0, ["reward"]),
							new RandomEnemy(500, -200)
						],
						"?",
						undefined,
						"plain"
					)
				)
			}
		},
		combat4: {
			name: "combat4",
			colorScheme: "all",
			difficulty: 3,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
					new Room(
						"combat4",
						[
							new Block(-300, 0, 600, 1000), //center platform
							new Pillar(-150, 0, 200),
							new Pillar(150, 0, 200),
							new Decoration(0, -200),
							new Pillar(-400, 900, 850),
							new Pillar(400, 900, 850),
							new Block(-1500, 100, 1000, 1000), //left floor
							new Block(500, 100, 1000, 1000), //right floor
							new Block(-1700, -4000, 1000, 8000), //left wall
							new Block(700, -4000, 1000, 8000), //left wall
							new Door(0, 0, ["reward"], true, false, "toggle"),
							new Door(-600, 100, ["ambient", "secret"]),
							new Door(600, 100, ["ambient", "secret"]),
							new RandomEnemy(0, 0)
						],
						"?",
						200
					)
				);
			}
		},
		parkour1: {
			name: "parkour1",
			colorScheme: "all",
			difficulty: 3,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
					new Room(
						"parkour1",
						[
							new Block(-1000, -1000, 1000, 2000), //left wall
							new Block(-1000, 500, 1200, 1000), //left floor
							new Door(100, 500, ["ambient"], false),
							new FallBlock(300, 475),
							new FallBlock(400, 450),
							new FallBlock(500, 425),
							new Block(600, 400, 200, 2000), //middle platform
							new Door(700, 400, ["reward"], true, false, "toggle"),
							new FallBlock(900, 425),
							new FallBlock(1000, 450),
							new FallBlock(1100, 475),
							new Block(1200, 500, 1000, 2000), //right floor
							new Block(1400, -1000, 1000, 2000), //right wall
							new Door(1300, 500, ["ambient"], false),
							new Roof(700, 200, 700),
							new Decoration(600, 350),
							new Decoration(800, 350)
						],
						"?",
						-200
					)
				);
			}
		},
		parkour2: {
			name: "parkour2",
			colorScheme: null,
			difficulty: 2,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
					new Room(
						"parkour2",
						[
							new Block(0, -4000, 1000, 8000), //left wall
							new Block(200, 0, 1000, 4000), //left floor
							new Door(1100, 0, ["ambient"]),
							new Block(1550, 200, 200, 8000), //middle platform
							new Pulley(1300, 150, 1850, 150, 200, 150),
							new Door(1650, 200, ["reward"], true),
							new Block(2100, 0, 1000, 4000), //right floor
							new Block(2300, -4000, 1000, 8000), //right wall
							new Door(2200, 0, ["ambient"])
						],
						"?",
						0
					)
				);
			}
		},
		parkour3: {
			name: "parkour3",
			colorScheme: "all",
			difficulty: 4,
			extraDoors: 0.5,
			add: function() {
				if(Math.random() < 0.5) {
					game.dungeon.push(
						new Room(
							"parkour3",
							[
								new Block(-100, 0, 1000, 1000), //lower floor
								new Block(100, -4000, 1000, 8000), //left wall
								new TiltPlatform(-300, -100),
								new TiltPlatform(-500, -200),
								new Block(-1700, -300, 1000, 1000), //upper floor
								new Block(-1900, -4000, 1000, 8000), //right wall
								new Door(0, 0, ["ambient"]),
								new Door(-800, -300, ["reward"], true),
								new Roof(-400, -500, 500),
								new Decoration(-100, -50),
								new Decoration(-700, -350)
							],
							"?",
							420
						)
					);
				}
				else {
					game.dungeon.push(
						new Room(
							"parkour3",
							[
								new Block(-100, -300, 1000, 1000), //upper floor
								new Block(100, -4000, 1000, 8000), //left wall
								new TiltPlatform(-300, -200),
								new TiltPlatform(-500, -100),
								new Block(-1700, 0, 1000, 1000), //lower floor
								new Block(-1900, -4000, 1000, 8000), //right wall
								new Door(0, -300, ["reward"], true),
								new Door(-800, 0, ["reward"]),
								new Roof(-400, -500, 500),
								new Decoration(-700, -50),
								new Decoration(-100, -350)
							],
							"?",
							420
						)
					);
				}
			}
		},
		parkour4: {
			name: "parkour4",
			colorScheme: "all",
			difficulty: 5,
			extraDoors: 2,
			add: function() {
				game.dungeon.push(
					new Room(
						"parkour4",
						[
							new Decoration(-1200, -140),
							new Decoration(0, -140),
							new Decoration(-1200, -540),
							new Decoration(0, -540),
							new Block(-100, 0, 1000, 4000), //right floor
							new Block(100, -4000, 1000, 8000), //right wall
							new Pulley(-400, 200, -1000, 200, -150, 150),
							new TiltPlatform(-600, -100),
							new Block(-2100, 0, 1000, 1000), //left floor
							new Block(-2300, -4000, 1000, 8000), //left wall
							new Block(-100, -400, 1000, 100), //upper right floor
							new Block(-2100, -400, 1000, 100), //upper left floor
							new Door(-1200, 0, ["ambient"]),
							new Door(0, 0, ["ambient"]),
							new Door(-1200, -400, ["reward"], true, false, "toggle"),
							new Door(0, -400, ["reward"], true, false, "toggle")
						],
						"?",
						300
					)
				);
			}
		},
		reward1: {
			name: "reward1",
			colorScheme: null,
			difficulty: 0,
			extraDoors: 0,
			add: function() {
				game.dungeon.push(
					new Room(
						"reward1",
						[
							new Block(-4000, 0, 8000, 1000), // floor
							new Block(-1500, -4000, 1300, 8000), //left wall
							new Block(200, -4000, 1000, 8000), //right wall
							new Block(-4000, -2000, 8000, 1800), //roof
							new Chest(-100, 0),
							new Chest(100, 0),
							new Door(0, 0, "blah")
						],
						"?"
					)
				)
			}
		},
		reward2: {
			name: "reward2",
			colorScheme: "blue|red",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				var chooser = Math.random();
				var hasAStaff = false;
				magicLoop: for(var i = 0; i < p.invSlots.length; i ++) {
					if(p.invSlots[i].content instanceof MagicWeapon) {
						hasAStaff = true;
						break magicLoop;
					}
				}
				if(!hasAStaff) {
					chooser = 0;
				}
				if(p.healthAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "blue") {
					chooser = 1;
				}
				if(p.manaAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "red") {
					chooser = 0;
				}
				if((p.healthAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "blue") && (p.manaAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "red")) {
					game.dungeon.push(
						new Room(
							"reward",
							[
								new Block(-2000, 500, 4000, 500), //floor
								new Block(-1000, -1000, 800, 2000), //left wall
								new Block(200, -1000, 500, 3000), //right wall
								new Block(-1000, -2000, 2000, 2300), //roof,
								new Door(0, 500, ["things should go here... maybe? i dont think so lol"], false),
								new Chest(-100, 500),
								new Chest(100, 500)
							],
							"?"
						)
					);
				}
				p.healthAltarsFound += (chooser < 0.5) ? 1 : 0;
				p.manaAltarsFound += (chooser > 0.5) ? 1 : 0;
				game.dungeon.push(
					new Room(
						"reward2",
						[
							new Block(0, 0, 4000, 4000), //floor
							new Block(0, -4000, 1000, 5000), //left wall
							new Block(1500, -4000, 1000, 5000), //right wall
							new Block(0, -2000, 8000, 1800), //roof
							new Door(1100, 0, ["combat", "parkour"], false, true),
							new Door(1400, 0, ["combat", "parkour"], false, true),
							new Block(1210, -40, 80, 100),
							new Block(1200, -201, 100, 41),
							new Stairs(1290, 0, 2, "right"),
							new Stairs(1210, 0, 2, "left"),
							new Block(1180, -200, 140, 20),
							new Altar(1250, -100, chooser < 0.5 ? "health" : "mana")
						],
						"?"
					)
				);
				game.dungeon[game.dungeon.length - 1].colorScheme = (chooser < 0.5) ? "red" : "blue";
			}
		},
		reward3: {
			name: "reward3",
			colorScheme: "red",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(new Room(
					"reward3",
					[
						new Block(0, 0, 4000, 4000), //floor
						new Block(0, -4000, 1000, 5000), //left wall
						new Block(1500, -4000, 1000, 5000), //right wall
						new Block(0, -2000, 8000, 1700), //roof
						new Forge(1250, 0),
						new Door(1050, 0, ["combat", "parkour"], false, true),
						new Door(1450, 0, ["combat", "parkour"], false, true)
					],
					"?"
				));
				game.dungeon[game.dungeon.length - 1].colorScheme = "red";
			}
		},
		reward4: {
			name: "reward4",
			colorScheme: "all",
			difficulty: 0,
			extraDoors: 0,
			add: function() {
				if(Math.random() < 0.5) {
					game.dungeon.push(
						new Room(
							"reward4",
							[
								new Block(-4000, 0, 8000, 1000), //floor
								new Stairs(200, 0, 10, "right"),
								new Block(600, -4000, 4000, 4100), //right wall
								new Chest(500, 0),
								new Decoration(500, -100),
								new Block(-800, -200, 1001, 1000), //higher floor
								new Door(100, -200, ["combat", "parkour", "secret"]),
								new Block(-1000, -4000, 1000, 8000), //left wall
								new Block(-4000, -1400, 8000, 1000) //roof
							],
							"?"
						)
					);
				}
				else {
					game.dungeon.push(
						new Room(
							"reward4",
							[
								new Block(-4000, 0, 8000, 1000), //floor
								new Stairs(-200, 0, 10, "left"),
								new Block(-4600, -4000, 4000, 4100), //left wall
								new Chest(-500, 0),
								new Decoration(-500, -100),
								new Block(-200, -200, 1000, 1000), //higher floor
								new Door(-100, -200, ["combat", "parkour", "secret"]),
								new Block(0, -4000, 1000, 8000), //right wall
								new Block(-4000, -1400, 8000, 1000) //roof
							],
							"?"
						)
					);
				}
			}
		},

		getAllRooms: function() {
			var rooms = [];
			for(var i in this) {
				if(this.hasOwnProperty(i) && this.isRoomID(i)) {
					rooms.push(this[i]);
				}
			}
			return rooms;
		},
		isRoomID: function(string) {
			const ROOM_PREFIXES = ["ambient", "secret", "combat", "parkour", "reward"];
			for(var i = 0; i < ROOM_PREFIXES.length; i ++) {
				var prefix = ROOM_PREFIXES[i];
				if(string.startsWith(prefix) && Object.typeof(parseInt(string.substring(prefix.length, string.length))) === "number") {
					return true;
				}
			}
			return false;
		}
	},
	dungeon: [
		/*
		This array represents the rooms in the dungeon that have been generated so far in the game.
		*/
	],
	initializedDungeon: utils.initializer.request(function() {
		game.rooms.ambient1.add();
		game.dungeon.lastItem().content.filter(obj => obj instanceof Door).forEach((door) => {
			door.type = "arch";
		});
		game.initializedDungeon = true;
	}),

	inRoom: 0,
	theRoom: 0,
	numRooms: 0,

	exist: function() {

	},

	generateNewRoom: function(entranceDoor) {
		p.roomsExplored ++;
		p.numHeals ++;
		/* Calculate distance to nearest unexplored door */
		game.calculatePaths();
		p.terminateProb = 0;
		for(var i = 0; i < game.dungeon.length; i ++) {
			for(var j = 0; j < game.dungeon[i].content.length; j ++) {
				if(game.dungeon[i].content[j] instanceof Door && typeof(game.dungeon[i].content[j].dest) === "object" && !game.dungeon[i].content[j].entering) {
					p.terminateProb += (1 / ((game.dungeon[i].pathScore + 1) * (game.dungeon[i].pathScore + 1)));
				}
			}
		}
		/* Create a list of valid rooms to generate */
		if(game.dungeon[game.inRoom].colorScheme !== null) {
			var possibleRooms = game.rooms.getAllRooms().filter(function(room) {
				return (room.colorScheme === "all" || room.colorScheme === null || room.colorScheme.split("|").includes(game.dungeon[game.theRoom].colorScheme));
			});
		}
		else {
			var possibleRooms = game.rooms.getAllRooms();
		}
		possibleRooms = possibleRooms.filter(function(room) {
			for(var j = 0; j < entranceDoor.dest.length; j ++) {
				if(room.name.startsWith(entranceDoor.dest[j])) {
					return true;
				}
			}
			return false;
		});
		possibleRooms = possibleRooms.filter(function(room) {
			return (room.name !== game.dungeon[game.theRoom].type);
		});
		/* Add selected room */
		var roomIndex = possibleRooms.randomIndex();
		possibleRooms[roomIndex].add();
		game.dungeon[game.dungeon.length - 1].id = "?";
		/* Reset transition variables */
		var previousRoom = game.inRoom;
		game.inRoom = game.numRooms;
		p.enteringDoor = false;
		p.exitingDoor = true;
		p.op = 1;
		p.op = 95;
		entranceDoor.dest = game.numRooms;
		/* Give new room an ID */
		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].id === "?") {
				game.dungeon[i].id = game.numRooms;
				game.numRooms ++;
			}
		}
		/* Move player to exit door */
		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].id === game.numRooms - 1) {
				/* Select a door */
				var doorIndexes = [];
				for(var j = 0; j < game.dungeon[i].content.length; j ++) {
					if(game.dungeon[i].content[j] instanceof Door && (!!game.dungeon[i].content[j].noEntry) === (!!entranceDoor.invertEntries) && game.dungeon[i].content[j].noEntry !== "no entries") {
						doorIndexes.push(j);
					}
				}
				if(doorIndexes.length === 0) {
					doorIndexes = game.dungeon[i].content[j].getInstancesOf(Door);
				}
				var theIndex = doorIndexes.randomItem();
				/* update door graphic types inside room */
				if(game.dungeon[i].content[theIndex].type === "toggle") {
					for(var j = 0; j < game.dungeon[i].content.length; j ++) {
						if(game.dungeon[i].content[j] instanceof Door && j !== theIndex) {
							game.dungeon[i].content[j].type = (game.dungeon[i].content[j].type === "same") ? "toggle" : "same";
						}
					}
				}
				game.dungeon[i].content[theIndex].type = p.doorType;
				/* Assign new door to lead to this room */
				game.dungeon[i].content[theIndex].dest = previousRoom;
				/* Assign this door to lead to new door */
				entranceDoor.dest = game.inRoom;
			}
		}
		/* Assign new room's color scheme */
		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].id === game.numRooms - 1 && game.dungeon[i].type !== "ambient5" && game.dungeon[i].type !== "reward2" && game.dungeon[i].type !== "reward3" && game.dungeon[i].type !== "secret1" && game.dungeon[i].type !== "secret3") {
				var hasDecorations = false;
				decorationLoop: for(var j = 0; j < game.dungeon[i].content.length; j ++) {
					if(game.dungeon[i].content[j] instanceof Decoration || game.dungeon[i].content[j] instanceof Torch) {
						hasDecorations = true;
						break decorationLoop;
					}
				}
				if(!hasDecorations) {
					game.dungeon[i].colorScheme = null;
				}
				if(game.dungeon[previousRoom].colorScheme === null && hasDecorations) {
					game.dungeon[i].colorScheme = ["red", "green", "blue"].randomItem();
				}
				if(game.dungeon[previousRoom].colorScheme !== null && hasDecorations) {
					game.dungeon[i].colorScheme = game.dungeon[previousRoom].colorScheme;
				}
			}
		}
	},
	calculatePaths: function() {
		/*
		This function goes through and, for each room, it sets that rooms `pathScore` property to be equal to the minimum number of doors you would need to travel through to get from that room to the currently occupied room. (Basically just the distance between that room and the currently occupied room). Currently occupied room's `pathScore` will be equal to 0.
		*/
		function calculated() {
			for(var i = 0; i < game.dungeon.length; i ++) {
				if(game.dungeon[i].pathScore === null) {
					return false;
				}
			}
			return true;
		};
		for(var i = 0; i < game.dungeon.length; i ++) {
			game.dungeon[i].pathScore = null;
		}
		var timeOut = 0;
		while(!calculated() && timeOut < 20) {
			timeOut ++;
			for(var i = 0; i < game.dungeon.length; i ++) {
				var room = game.dungeon[i];
				if(i === game.inRoom) {
					room.pathScore = 0;
				}
				for(var j = 0; j < room.content.length; j ++) {
					var door = room.content[j];
					if(door instanceof Door && typeof door.dest !== "object" && room.pathScore === null) {
						var destinationRoom = game.dungeon[door.dest];
						if(destinationRoom.pathScore !== null) {
							room.pathScore = destinationRoom.pathScore + 1;
						}
					}
				}
			}
		}
	},

	tutorial: {
		exist: function() {
			p.damOp -= 0.05;
			game.inRoom = 0;
			game.theRoom = 0;
			p.update();
			game.dungeon[0].renderingObjects = [];
			game.dungeon[0].exist(0);
			game.dungeon[0].display();

			c.fillStyle = "rgb(255, 255, 255)";
			c.font = "100 20px Germania One";
			c.textAlign = "center";
			c.globalAlpha = 1;
			if(!game.tutorial.infoText.includes("\n")) {
				c.fillText(game.tutorial.infoText, 400, 600);
			}
			else {
				for(var i = 0; i < game.tutorial.infoText.length; i ++) {
					if(game.tutorial.infoText.substr(i, 1) === "\n") {
						c.fillText(game.tutorial.infoText.substr(0, i), 400, 600);
						c.fillText(game.tutorial.infoText.substr(i + 1, Infinity), 400, 640);
						break;
					}
				}
			}
			if(game.tutorial.infoText === "press A to use the item you are holding") {
				if(p.invSlots[p.activeSlot].content instanceof Sword) {
					c.fillText("(like swinging a sword)", 400, 640);
				}
				else if(p.invSlots[p.activeSlot].content instanceof WoodBow) {
					c.fillText("(like shooting a bow)", 400, 640);
				}
				else  if(p.invSlots[p.activeSlot].content instanceof EnergyStaff) {
					c.fillText("(like using a staff)", 400, 640);
				}
			}

			if(p.x > 350 && game.tutorial.infoText === "arrow keys to move, up to jump") {
				for(var i = 0; i < game.dungeon[0].content.length; i ++) {
					if(game.dungeon[0].content[i] instanceof MovingWall && game.dungeon[0].content[i].x <= 400) {
						game.dungeon[0].content[i].zDir = 0.01;
						break;
					}
				}
				game.tutorial.infoText = "press S to interact with objects\n(for example: opening a chest)";
			}
			if(game.dungeon[0].content[5].r <= -84 && game.tutorial.infoText === "press S to interact with objects\n(for example: opening a chest)") {
				game.tutorial.infoText = "press D to view your items";
			}
			if(io.keys[65] && p.invSlots[p.activeSlot].content !== "empty" && game.tutorial.infoText === "press A to use the item you are holding") {
				game.tutorial.infoText = "press the number keys (1, 2, 3) to switch between items";
			}
			if((io.keys[49] || io.keys[50] || io.keys[51]) && game.tutorial.infoText === "press the number keys (1, 2, 3) to switch between items") {
				game.tutorial.infoText = "you can aim ranged weapons";
				game.tutorial.infoTextTime = 0;
			}
			game.tutorial.infoTextTime ++;
			if(game.tutorial.infoTextTime > 60) {
				if(game.tutorial.infoText === "you can aim ranged weapons" && (p.invSlots[p.activeSlot].content instanceof RangedWeapon || p.invSlots[p.activeSlot].content instanceof MagicWeapon)) {
					game.tutorial.infoText = "hold down the A key";
				}
				else if(game.tutorial.infoText === "and then press up or down to aim" && (io.keys[38] || io.keys[40])) {
					game.tutorial.infoText = "then you can release A to shoot";
				}
				else if(game.tutorial.infoText === "that's all you need to know. good luck!") {
					game.tutorial.infoText = "that's all you need to know. good luck!";
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "home";
				}
			}
			if(io.keys[65] && game.tutorial.infoText === "hold down the A key") {
				game.tutorial.infoText = "and then press up or down to aim";
				game.tutorial.infoTextTime = 0;
			}
			if(!io.keys[65] && game.tutorial.infoText === "then you can release A to shoot") {
				game.tutorial.infoText = "almost done. try fighting this monster for practice";
				game.dungeon[0].content[3].zDir = -0.01;
			}
			if(game.tutorial.infoText !== "almost done. try fighting this monster for practice") {
				for(var i = 0; i < game.dungeon[0].content.length; i ++) {
					if(game.dungeon[0].content[i] instanceof Spider) {
						game.dungeon[0].content[i].x = 1600;
					}
				}
			}
			else {
				var noEnemy = true;
				for(var i = 0; i < game.dungeon[0].content.length; i ++) {
					if(game.dungeon[0].content[i] instanceof Spider) {
						noEnemy = false;
						break;
					}
				}
				if(noEnemy) {
					game.tutorial.infoText = "that's all you need to know. good luck!";
					game.tutorial.infoTextTime = 0;
				}
			}

			game.dungeon[game.inRoom].displayShadowEffect();
			p.x += game.camera.getOffsetX();
			p.y += game.camera.getOffsetY();
			p.display();
			p.x -= game.camera.getOffsetX();
			p.y -= game.camera.getOffsetY();
			p.gui();

			c.fillStyle = "rgb(255, 255, 255)";
			c.font = "100 20px Germania One";
			c.textAlign = "center";
			if(p.guiOpen === "inventory" && game.tutorial.infoText === "press D to view your items") {
				if(p.invSlots[2].content === "empty") {
					c.fillText("click an item to equip / unequip it", 400, 600);
					c.fillText("(try equipping this staff)", 400, 640);
				}
				else {
					c.fillText("now press D again to exit", 400, 600);
				}
			}
			if(p.guiOpen === "none" && p.invSlots[2].content !== "empty" && game.tutorial.infoText === "press D to view your items") {
				game.tutorial.infoText = "press A to use the item you are holding";
			}
		},

		infoText: ""
	},
	transitions: {
		dir: null, // can be "fade-in" or "fade-out"
		opacity: 0,
		color: "rgb(0, 0, 0)",
		nextScreen: null,

		isTransitioning: function() {
			return (this.opacity !== 0 || this.dir !== null);
		},
		onScreenChange: function() {

		},

		display: function() {
			c.save(); {
				c.globalAlpha = Math.constrain(this.opacity, 0, 1);
				c.fillCanvas(this.color);
			} c.restore();
		},
		update: function() {
			if(this.dir === "fade-out") {
				this.opacity += 0.05;
				if(this.opacity >= 1) {
					this.dir = "fade-in";
					if(this.nextScreen !== null) {
						game.onScreen = this.nextScreen;
					}
					if(typeof this.onScreenChange === "function") {
						this.onScreenChange();
					}
					this.onScreenChange = null;
				}
			}
			else if(this.dir === "fade-in") {
				this.opacity -= 0.05;
				if(this.opacity <= 0) {
					this.dir = null;
					if(p.enteringDoor) {
						p.enteringDoor = false;
						p.exitingDoor = true;
					}
				}
			}
			this.opacity = Math.constrain(this.opacity, 0, 1);
		}
	},

	camera: {
		x: 0,
		y: 0,
		getOffsetX: function() {
			return (-this.x + (canvas.width / 2));
		},
		getOffsetY: function() {
			return (-this.y + (canvas.height / 2));
		}
	}
};
var ui = {
	buttons: {
		ArchedDoorButton: function(x, y, w, h, text, onclick, settings) {
			/*
			Creates a arch-shaped button (the ones on the menus.)

			(x, y) is the center of the half-circle for the top of the arch.
			*/
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
			this.text = text;
			this.onclick = onclick;
			this.underlineWidth = 0;
			settings = settings || {};
			this.textY = settings.textY || this.y;
			this.maxUnderlineWidth = settings.maxUnderlineWidth || 50;
		}
		.method("display", function() {
			c.fillStyle = "rgb(20, 20, 20)";
			c.fillCircle(this.x, this.y, this.w / 2);
			c.fillRect(this.x - (this.w / 2), this.y, this.w, this.h);

			c.fillStyle = "rgb(255, 255, 255)";
			c.font = "100 20px Germania One";
			c.textAlign = "center";
			c.fillText(this.text, this.x, this.textY + 5);

			c.strokeStyle = "rgb(255, 255, 255)";
			if(this.underlineWidth > 0) {
				c.strokeLine(
					this.x - this.underlineWidth, this.textY - 20,
					this.x + this.underlineWidth, this.textY - 20
				);
				c.strokeLine(
					this.x - this.underlineWidth, this.textY + 20,
					this.x + this.underlineWidth, this.textY + 20
				);
			}
		})
		.method("update", function() {
			if(
				utils.mouseInCircle(this.x, this.y, this.w / 2) ||
				utils.mouseInRect(this.x - (this.w / 2), this.y, this.w, this.h)
			) {
				io.cursor = "pointer";
				if(this.underlineWidth < this.maxUnderlineWidth) {
					this.underlineWidth += 5;
				}
				if(io.mouse.pressed) {
					this.onclick();
				}
			}
			else if(this.underlineWidth > 0) {
				this.underlineWidth -= 5;
			}
		}),
		RisingPlatformButton: function(x, y, w, h, player, settings) {
			/*
			The buttons on the class select screen (rising platforms with a stick figure on top of them)
			*/
			this.x = x; // middle of platform
			this.y = y; // top of platform
			this.w = w;
			this.h = h;
			this.player = player;
			settings = settings || {};
			this.mouseOverFunction = settings.mouseOverFunction; // a function that returns whether this button is hovered or not
			this.maxHoverY = settings.maxHoverY || -50;
			this.offsetY = 0;
		}
		.method("update", function() {
			if(this.mouseOverFunction()) {
				if(this.offsetY > this.maxHoverY) {
					this.offsetY -= 5;
				}
				if(io.mouse.pressed) {
					var self = this;
					game.transitions.onScreenChange = function() {
						p.class = self.player;
						p.reset();
					};
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "play";
				}
			}
			else if(this.offsetY < 0) {
				this.offsetY += 5;
			}
		})
		.method("display", function() {
			this.displayPlatform();
			this.displayStickFigure();
		})
		.method("displayPlatform", function() {
			new Block(this.x - (this.w / 2), this.y + this.offsetY, this.w, this.h).display();
		})
		.method("displayStickFigure", function() {
			var stickFigure = new Player();
			stickFigure.x = this.x;
			stickFigure.y = this.y + this.offsetY - stickFigure.hitbox.bottom;
			if(this.player === "warrior") {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					function() {
						stickFigure.display(true);
						c.translate(this.x + 15, this.y + this.offsetY - 30);
						c.scale(1, 0.65);
						c.rotate(Math.rad(180));
						new Sword().display("attacking");
					},
					1
				));
			}
			else if(this.player === "archer") {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					function() {
						stickFigure.aiming = true;
						stickFigure.attackingWith = new WoodBow();
						stickFigure.aimRot = 45;
						stickFigure.display();
					},
					1
				));
			}
			else if(this.player === "mage") {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					function() {
						stickFigure.aiming = true;
						stickFigure.attackingWith = new EnergyStaff();
						stickFigure.facing = "left";
						stickFigure.display();
					},
					1
				));
			}
		}),
		TextButton: function(x, y, w, h, text, onclick, settings) {
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
			this.text = text;
			this.onclick = onclick;
			settings = settings || {};
			this.textY = settings.textY || this.y + (this.h / 2);
			this.maxUnderlineWidth = settings.maxUnderlineWidth || 50;
			this.underlineWidth = 0;
		}
		.method("display", function() {
			c.fillStyle = "rgb(255, 255, 255)";
			c.textAlign = "center";
			c.font = "100 20px Germania One";
			c.fillText(this.text, this.x, this.textY + 5);

			c.strokeStyle = "rgb(255, 255, 255)";
			if(this.underlineWidth > 0) {
				c.strokeLine(
					this.x - this.underlineWidth, this.textY - 20,
					this.x + this.underlineWidth, this.textY - 20
				);
				c.strokeLine(
					this.x - this.underlineWidth, this.textY + 20,
					this.x + this.underlineWidth, this.textY + 20
				);
			}
		})
		.method("update", function() {
			if(utils.mouseInRect(this.x - (this.w / 2), this.y - (this.h / 2), this.w, this.h)) {
				io.cursor = "pointer";
				if(this.underlineWidth < this.maxUnderlineWidth) {
					this.underlineWidth += 5;
				}
				if(io.mouse.pressed) {
					this.onclick();
				}
			}
			else if(this.underlineWidth > 0) {
				this.underlineWidth -= 5;
			}
		})
	},

	homeScreen: {
		display: function() {
			graphics3D.boxFronts = [];
			game.camera.x = 0;
			game.camera.y = 0;
			game.inRoom = 0;
			game.dungeon = [new Room(null, [])];
			new Block(-100, 600, 1000, 200).display();
			game.dungeon[0].display();
			/* title */
			c.fillStyle = "rgb(0, 0, 0)";
			c.font = "80px Cursive";
			c.textAlign = "center";
			c.fillText("stick", 400, 100);
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "bolder 80px Arial black";
			c.fillText("DUNGEON", 400, 200);
			/* buttons */
			this.howButton.display();
			this.playButton.display();
			this.scoresButton.display();

			graphics3D.loadBoxFronts();
		},
		update: function() {
			this.howButton.update();
			this.playButton.update();
			this.scoresButton.update();
		},

		initializedButtons: utils.initializer.request(function() {
			ui.homeScreen.howButton = new ui.buttons.ArchedDoorButton(
				125, 440, 170, 140,
				"H o w",
				function() {
					game.transitions.onScreenChange = function() {
						p.reset();
						p.clearInventory();
						game.dungeon = [new Room(
							"tutorial",
							[
								new Block(-4000, 400, 8000, 1000), /* floor */
								new Block(-4000, -4000, 4400, 8000), /* left wall */
								new MovingWall(400, -4000, 300, 4400),
								new MovingWall(1100, -4000, 300, 4300, 1.1),
								new Block(700, 300, 1000, 1000), /* higher floor */
								new Chest(900, 300),
								new Spider(1600, 200),
								new Block(1700, -4000, 1000, 8000) /* far right wall */
							],
							"?"
						)];
						game.tutorial.infoText = "arrow keys to move, up to jump";
						game.inRoom = 0, game.theRoom = 0;
						p.addItem(new Sword());
						p.invSlots[3].content = new EnergyStaff();
						p.invSlots[17].content = new Arrow(Infinity);
					};
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "how";
				},
				{
					textY: 490,
					maxUnderlineWidth: 50
				}
			);
			ui.homeScreen.playButton = new ui.buttons.ArchedDoorButton(
				400, 380, 160, 200,
				"P l a y",
				function() {
					game.inRoom = 0;
					game.theRoom = 0;
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "class-select";
				},
				{
					textY: 450,
					maxUnderlineWidth: 50
				}
			);
			ui.homeScreen.scoresButton = new ui.buttons.ArchedDoorButton(
				670, 440, 170, 140,
				"S c o r e s",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "scores";
				},
				{
					textY: 490,
					maxUnderlineWidth: 40
				}
			);
			ui.homeScreen.initializedButtons = true;
		})
	},
	classSelectScreen: {
		display: function() {
			io.keys = [];
			graphics3D.boxFronts = [];
			game.inRoom = 0;
			game.dungeon = [new Room(null, [])];
			game.dungeon[game.inRoom].renderingObjects = [];
			new Block(-100, 600, 1000, 200).display();
			/* buttons */
			this.warriorButton.displayPlatform();
			this.archerButton.displayPlatform();
			this.mageButton.displayPlatform();
			this.warriorButton.displayStickFigure();
			this.archerButton.displayStickFigure();
			this.mageButton.displayStickFigure();
			game.dungeon[game.inRoom].display();


			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "bolder 40px Arial black";
			c.textAlign = "center";
			c.fillText("Warrior", 175, 200);
			c.fillText("Archer", 400, 200);
			c.fillText("Mage", 625, 200);
			c.font = "20px monospace";
			c.textAlign = "left";
			c.fillText("+1 melee damage", 100, 250);
			c.fillText("+Start with sword", 100, 290);
			c.fillText("+Start with helmet", 100, 330);
			c.fillText("+1 ranged damage", 325, 250);
			c.fillText("+Start with bow", 325, 290);
			c.fillText("+Start with dagger", 325, 330);
			c.fillText("+1 magic damage", 550, 250);
			c.fillText("+Start with staff", 550, 290);
			c.fillText("+Start with dagger", 550, 330);
			graphics3D.loadBoxFronts();
		},
		update: function() {
			this.warriorButton.update();
			this.archerButton.update();
			this.mageButton.update();
		},

		initializedButtons: utils.initializer.request(function() {
			ui.classSelectScreen.warriorButton = new ui.buttons.RisingPlatformButton(
				175, 550, 150, 100000, "warrior",
				{
					mouseOverFunction: function() { return io.mouse.x < 300; },
					maxHoverY: -50
				}
			);
			ui.classSelectScreen.archerButton = new ui.buttons.RisingPlatformButton(
				400, 550, 150, 100000, "archer",
				{
					mouseOverFunction: function() { return io.mouse.x > 300 && io.mouse.x < 500; },
					maxHoverY: -50
				}
			);
			ui.classSelectScreen.mageButton = new ui.buttons.RisingPlatformButton(
				625, 550, 150, 100000, "mage",
				{
					mouseOverFunction: function() { return io.mouse.x > 500; },
					maxHoverY: -50
				}
			);
			ui.classSelectScreen.initializedButtons = true;
		})
	},
	deathScreen: {
		display: function() {
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "bolder 80px Arial black";
			c.textAlign = "center";
			c.fillText("GAME OVER", 400, 200);
			c.font = "20px Cursive";
			c.fillStyle = "rgb(0, 0, 0)";
			c.fillText("You collected " + p.gold + " coins.", 400, 300);
			c.fillText("You explored " + p.roomsExplored + " rooms.", 400, 340);
			c.fillText("You defeated " + p.enemiesKilled + " monsters.", 400, 380);
			c.fillText("You were killed by " + p.deathCause, 400, 420);
			game.camera.x = 0;
			game.camera.y = 0;
			game.dungeon = [new Room()];
			game.theRoom = 0;
			game.inRoom = 0;
			new Block(-100, 700, 1000, 200).display();
			game.dungeon[0].display();

			this.homeButton.display();
			this.retryButton.display();
		},
		update: function() {
			this.homeButton.update();
			this.retryButton.update();
		},

		initializedButtons: utils.initializer.request(function() {
			ui.deathScreen.homeButton = new ui.buttons.ArchedDoorButton(
				175, 570, 150, 100, "H o m e",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "home";
				},
				{
					textY: 617.5,
					maxUnderlineWidth: 50
				}
			);
			ui.deathScreen.retryButton = new ui.buttons.ArchedDoorButton(
				625, 570, 150, 100, "R e t r y",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "class-select";
				},
				{
					textY: 617.5,
					maxUnderlineWidth: 50
				}
			);
			ui.deathScreen.initializedButtons = true;
		})
	},
	highscoresScreen: {
		display: function() {
			/* title */
			c.textAlign = "center";
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "100 40px Germania One";
			c.fillText("Your Best Games", 400, 130);
			/* content */
			p.scores.sort( function(a, b) { return a.coins - b.coins; } );
			for(var i = 0; i < Math.min(p.scores.length, 3); i ++) {
				var y = (i * 150 + 200);
				c.fillStyle = "rgb(110, 110, 110)";
				c.fillRect(200, y, 400, 100);
				c.fillStyle = "rgb(150, 150, 150)";
				c.font = "bolder 40px Arial Black";
				c.textAlign = "center";
				c.fillText((i + 1) + "", 230, y + 67);
				c.font = "20px monospace";
				c.textAlign = "left";
				c.fillText("Coins: " + p.scores[i].coins, 270, y + 25);
				c.fillText("Monsters Killed: " + p.scores[i].kills, 270, y + 55);
				c.fillText("Rooms Explored: " + p.scores[i].rooms, 270, y + 85);
				if(p.scores[i].class === "warrior") {
					c.save(); {
						c.translate(550, y + 50);
						new Sword().display("item");
					} c.restore();
				}
				else if(p.scores[i].class === "archer") {
					c.save(); {
						c.translate(550, y + 50);
						new WoodBow().display("item");
					} c.restore();
				}
				else if(p.scores[i].class === "mage") {
					c.save(); {
						c.translate(550, y + 50);
						new EnergyStaff().display("item");
					} c.restore();
				}
			}
			if(p.scores.length === 0) {
				c.fillStyle = "rgb(150, 150, 150)";
				c.font = "bolder 80px monospace";
				c.fillText("-", 400, 400);
				c.font = "20px monospace";
				c.fillText("no games played yet", 400, 450);
			}
			/* home button */
			this.homeButton.display();
			return;
		},
		update: function() {
			this.homeButton.update();
		},

		initializedButtons: utils.initializer.request(function() {
			ui.highscoresScreen.homeButton = new ui.buttons.TextButton(
				70, 60, 80, 40,
				"H o m e",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "home";
				},
				{
					textY: 60,
					maxUnderlineWidth: 40
				}
			);
		})
	},

	infoBar: {
		/*
		Top row:
		 - Click to equip / unequip
		 - A to use item
		 - S to interact with object
		 - Up + Down to aim
		Bottom row:
		 - Arrow keys to move
		 - Up to jump
		 - D to view items
		 - 1 / 2 / 3 to switch items
		*/
		y: 20,
		destY: 20,
		upButton: {
			y: 0,
			destY: 0
		},
		downButton: {
			y: 0,
			destY: 0
		},
		rowHeight: 20,
		actions: {
			click: null,
			upDown: null,
			a: null,
			s: null,

			arrows: "move",
			up: "jump",
			d: "view items"
		},
		display: function() {
			c.font = "bold 13.33px monospace";
			c.lineWidth = 2;

			var pressingUpButton = utils.mouseInRect(770, 800 - this.y - this.upButton.y, 20, 20) && this.destY < 40;
			c.fillStyle = pressingUpButton ? "rgb(59, 67, 70)" : "rgb(200, 200, 200)";
			c.strokeStyle = "rgb(59, 67, 70)";
			c.fillRect(770, 800 - this.y - this.upButton.y, 20, 20);
			c.strokeRect(770, 800 - this.y - this.upButton.y, 20, 20);
			displayButtonIcon(770, 800 - this.y - this.upButton.y, "arrow-up", null, pressingUpButton);

			var pressingDownButton = utils.mouseInRect(740, 800 - this.y - this.downButton.y, 20, 20) && this.destY > 0;
			c.fillStyle = pressingDownButton ? "rgb(59, 67, 70)" : "rgb(200, 200, 200)";
			c.strokeStyle = "rgb(59, 67, 70)";
			c.fillRect(740, 800 - this.y - this.downButton.y, 20, 20);
			c.strokeRect(740, 800 - this.y - this.downButton.y, 20, 20);
			displayButtonIcon(740, 800 - this.y - this.downButton.y, "arrow-down", null, pressingDownButton);

			c.lineWidth = 5;
			c.fillStyle = "rgb(200, 200, 200)";
			c.strokeStyle = "rgb(59, 67, 70)";
			c.strokeRect(0, 800 - this.y, 800, this.y);
			c.fillRect(0, 800 - this.y, 800, this.y);

			function displayButtonIcon(x, y, icon, align, invertColors) {
				if(icon.substr(0, 5) === "arrow") {
					c.strokeStyle = "rgb(59, 67, 70)";
					if(invertColors) {
						c.strokeStyle = "rgb(200, 200, 200)";
						c.fillStyle = "rgb(59, 67, 70)";
					}
					c.save(); {
						c.translate(x + 10, y + ((icon === "arrow-up") ? 12 : 8));
						c.scale(1, (icon === "arrow-down") ? -1 : 1);
						c.strokePoly(
							-5, 0,
							0, -5,
							5, 0
						);
					} c.restore();
					return;
				}
				c.textAlign = "center";
				var boxHeight = ui.infoBar.rowHeight - 5;
				c.lineWidth = 2;
				c.fillStyle = "rgb(200, 200, 200)";
				c.strokeStyle = "rgb(59, 67, 70)";
				if(icon !== "left-click") {
					c.fillRect(x, y, boxHeight, boxHeight);
					c.strokeRect(x, y, boxHeight, boxHeight);
				}
				c.fillStyle = "rgb(59, 67, 70)";
				if(icon.length === 1) {
					c.fillText(icon, x + boxHeight / 2, y + (boxHeight / 2) + 4);
				}
				else if(icon.substring(0, 8) === "triangle") {
					/* filled-in triangle */
					c.save(); {
						c.translate(x + (boxHeight / 2), y + (boxHeight / 2));
						if(icon === "triangle-left") {
							c.rotate(Math.rad(-90));
						}
						else if(icon === "triangle-down") {
							c.rotate(Math.rad(-180));
						}
						else if(icon === "triangle-right") {
							c.rotate(Math.rad(-270));
						}
						c.fillPoly(
							-5, 5,
							5, 5,
							0, -5
						);
					} c.restore();
				}
				else if(icon === "left-click") {
					c.save(); {
						c.translate(x + (boxHeight / 2), y + (boxHeight / 2));
						c.scale(1, 1.2);

						c.strokeCircle(0, 0, 5);

						c.fillStyle = "rgb(59, 67, 70)";
						c.fillArc(0, 0, 5, Math.rad(180), Math.rad(270), true);

						c.strokeLine(-5, 0, 5, 0);
					} c.restore();
				}
			};
			function displayAction(x, y, icon, action, align) {
				align = align || "left";
				if(action === null || action === undefined) {
					return x;
				}
				if(align === "left") {
					var boxHeight = ui.infoBar.rowHeight - 5;
					if(icon === "triangle-left-right") {
						displayButtonIcon(x, y, "triangle-left");
						displayButtonIcon(x + boxHeight + 2.5, y, "triangle-right");
						c.fillStyle = "rgb(59, 67, 70)";
						c.textAlign = "left";
						c.fillText(action, x + (boxHeight * 2) + 7.5, y + (boxHeight / 2) + 4);
						return (x + (boxHeight * 2)) + c.measureText(action).width + 25;
					}
					else {
						displayButtonIcon(x, y, icon);
						c.fillStyle = "rgb(59, 67, 70)";
						c.textAlign = "left";
						c.fillText(action, x + boxHeight + 5, y + (boxHeight / 2) + 4);
					}
					/* Return the x-coordinate at which to draw the next icon */
					return (x + boxHeight + 5) + c.measureText(action).width + 25;
				}
				else {
					var boxHeight = ui.infoBar.rowHeight - 5;
					c.textAlign = "right";
					c.fillStyle = "rgb(59, 67, 70)";
					c.fillText(action, x, y + (boxHeight / 2) + 4);
					var textWidth = c.measureText(action).width;
					if(icon === "triangle-up-down") {
						displayButtonIcon(x - textWidth - boxHeight - 5, y, "triangle-down");
						displayButtonIcon(x - textWidth - (boxHeight * 2) - 7.5, y, "triangle-up");
						return x - textWidth - (boxHeight * 2) - 10 - 25;
					}
					else {
						displayButtonIcon(x - textWidth - boxHeight - 2.5, y, icon);
						return x - textWidth - boxHeight - 25;
					}
				}
			};
			var x1 = displayAction(2.5, 800 - this.y + 2.5, "A", this.actions.a);
			var x2 = displayAction(x1, 800 - this.y + 2.5, "S", this.actions.s);

			var x3 = displayAction(800 - 5, 800 - this.y + 2.5, "triangle-up-down", this.actions.upDown, "right");
			var x4 = displayAction(x3, 800 - this.y + 2.5, "left-click", this.actions.click, "right");

			var x5 = displayAction(2.5, 800 - this.y + 22.5, "triangle-left-right", this.actions.arrows);
			var x6 = displayAction(x5, 800 - this.y + 22.5, "triangle-up", this.actions.up);

			var x7 = displayAction(800 - 5, 800 - this.y + 22.5, "D", this.actions.d, "right");

			if(io.mouse.y > 800 - 100) {
				if(this.destY === 0) {
					this.upButton.destY = 20;
					this.downButton.destY = 5;
				}
				else if(this.destY === 20) {
					this.upButton.destY = 20;
					this.downButton.destY = 20;
				}
				else if(this.destY === 40) {
					this.upButton.destY = 5;
					this.downButton.destY = 20;
				}
			}
			else {
				this.upButton.destY = 5;
				this.downButton.destY = 5;
			}
			if(pressingUpButton && io.mouse.pressed && this.y === this.destY && this.destY < 40) {
				this.destY += 20;
			}
			if(pressingDownButton && io.mouse.pressed && this.y === this.destY && this.destY > 0) {
				this.destY -= 20;
			}
			this.upButton.y += (this.upButton.y < this.upButton.destY) ? 2 : 0;
			this.upButton.y -= (this.upButton.y > this.upButton.destY) ? 2 : 0;
			this.downButton.y += (this.downButton.y < this.downButton.destY) ? 2 : 0;
			this.downButton.y -= (this.downButton.y > this.downButton.destY) ? 2 : 0;
			this.y += (this.y < this.destY) ? 1 : 0;
			this.y -= (this.y > this.destY) ? 1 : 0;
			this.y = Math.max(this.y, 0);
			this.y = Math.min(this.y, 40);
			this.y = Math.round(this.y);
		},
		resetActions: function() {
			this.actions = {
				click: null,
				a: null,
				s: null,
				upDown: null,

				arrows: null,
				up: null,
				d: null
			};
		},
		calculateActions: function() {
			/*
			Some of the buttons' text are calculated in other places
			*/
			var item = p.invSlots[p.activeSlot].content;
			if(p.guiOpen === "none") {
				if((item instanceof RangedWeapon && !(item instanceof Arrow) && p.hasInInventory(Arrow))) {
					this.actions.a = "shoot bow";
				}
				if(item instanceof MagicWeapon && p.mana > item.manaCost) {
					this.actions.a = "use magic";
				}
				if(item instanceof MeleeWeapon) {
					this.actions.a = "attack";
				}
				if(item instanceof Crystal) {
					if(p.guiOpen === "crystal-infusion") {
						this.actions.a = "cancel";
					}
					else {
						this.actions.a = "infuse item";
					}
				}
				if(item instanceof Equipable) {
					this.actions.a = "put on " + item.name;
				}
				if(item instanceof Barricade) {
					var doorNearby = false;
					for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
						var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x, game.dungeon[game.inRoom].content[i].y, 0.9);
						if(game.dungeon[game.inRoom].content[i] instanceof Door && Math.dist(loc.x, loc.y, 400, 400) <= 100 && !game.dungeon[game.inRoom].content[i].barricaded) {
							doorNearby = true;
							break;
						}
					}
					if(doorNearby) {
						this.actions.a = "barricade door";
					}
				}
				if(p.aiming) {
					this.actions.upDown = "aim";
					if(item instanceof MagicWeapon) {
						var containsCharge = false;
						for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
							if(game.dungeon[game.inRoom].content[i] instanceof MagicCharge && game.dungeon[game.inRoom].content[i].beingAimed) {
								containsCharge = true;
								break;
							}
						}
						if(!containsCharge) {
							this.actions.upDown = null;
						}
					}
					if(item instanceof RangedWeapon && !p.hasInInventory(Arrow)) {
						this.actions.upDown = null;
					}
				}
				this.actions.arrows = "move";
				if(p.canJump && this.actions.upDown === null) {
					this.actions.up = "jump";
				}
				this.actions.d = "view items";
			}
		}
	}
};

utils.initializer.initializeEverything();

var p = new Player();
p.loadScores();

if(TESTING_MODE) {
	debugging.activateDebuggingSettings();
}

/** FRAMES **/
function timer() {
	if(TESTING_MODE) {
		p.health = p.maxHealth;
		p.mana = p.maxMana;
	}
	c.globalAlpha = 1;
	io.cursor = "auto";
	utils.frameCount ++;
	utils.resizeCanvas();
	c.fillStyle = "rgb(100, 100, 100)";
	c.fillCanvas();

	if(game.onScreen === "play") {
		game.dungeon[game.theRoom].renderingObjects = [];
		/* load enemies in other rooms */
		var unseenEnemy = false;
		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].content.containsInstanceOf(Enemy) && i !== game.inRoom) {
				unseenEnemy = true;
				break;
			}
		}
		p.update();

		game.dungeon[game.inRoom].displayBackground();

		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].id === "?") {
				game.dungeon[i].id = game.numRooms;
				game.numRooms ++;
			}
			if(game.inRoom === game.dungeon[i].id && (!unseenEnemy || true)) {
				game.theRoom = i;
				game.dungeon[i].exist(i);
			}
		}

		/* move player into lower room when falling */
		if(p.y + p.hitbox.bottom > 900 && !game.transitions.isTransitioning()) {
			game.transitions.dir = "fade-out";
			game.transitions.color = "rgb(0, 0, 0)";
			game.transitions.onScreenChange = function() {
				p.roomsExplored ++;
				game.inRoom = game.numRooms;
				game.camera.x = 0;
				game.camera.y = 0;
				p.x = 500;
				p.y = -100;
				p.velocity.y = 2;
				p.fallDmg = Math.round(Math.randomInRange(40, 50));
				game.dungeon.push(
					new Room(
						"ambient1",
						[
							new Pillar(200, 500, Math.randomInRange(200, 300)),
							new Pillar(400, 500, Math.randomInRange(200, 300)),
							new Pillar(600, 500, Math.randomInRange(200, 300)),
							new Pillar(800, 500, Math.randomInRange(200, 300)),
							new Block(-200, 500, 2000, 600),//floor
							new Block(-600, -1200, 700, 3000), //left wall
							new Block(900, -1200, 500, 3000), //right wall
							new Door(300,  500, ["ambient", "combat", "parkour", "secret"]),
							new Door(500,  500, ["ambient", "combat", "parkour", "secret"]),
							new Door(700,  500, ["ambient", "combat", "parkour", "secret"])
						],
						"?"
					)
				);
			};
		}

		game.dungeon[game.inRoom].display();
		game.dungeon[game.inRoom].displayShadowEffect();

		var locationBeforeOffset = { x: p.x, y: p.y };
		p.x += game.camera.getOffsetX();
		p.y += game.camera.getOffsetY();
		p.display();
		p.x = locationBeforeOffset.x;
		p.y = locationBeforeOffset.y;
		debugging.displayHitboxes();

		p.gui();
		ui.infoBar.calculateActions();
		ui.infoBar.display();
		ui.infoBar.resetActions();
	}
	else if(game.onScreen === "home") {
		ui.homeScreen.update();
		ui.homeScreen.display();
	}
	else if(game.onScreen === "class-select") {
		ui.classSelectScreen.update();
		ui.classSelectScreen.display();
	}
	else if(game.onScreen === "dead") {
		ui.deathScreen.update();
		ui.deathScreen.display();
	}
	else if(game.onScreen === "how") {
		game.tutorial.exist();
	}
	else if(game.onScreen === "scores") {
		ui.highscoresScreen.update();
		ui.highscoresScreen.display();
	}

	game.transitions.update();
	game.transitions.display();

	if(game.onScreen !== "play" && game.onScreen !== "how") {
		(new Room()).displayShadowEffect();
	}

	if(TESTING_MODE) {
		debugging.displayFPS();
		if(utils.frameCount % 10 === 0) {
			debugging.calculateFPS();
		}
	}
	utils.pastInputs.update();
	document.body.style.cursor = io.cursor;
	window.setTimeout(timer, 1000 / FPS);
};
window.setTimeout(timer, 1000 / FPS);
