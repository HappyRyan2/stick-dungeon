/* IO + constants */
var canvas = document.getElementById("theCanvas");
var c = canvas.getContext("2d");

const FPS = 60;
const FLOOR_WIDTH = 0.1;




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
		document.body.onkeydown = function() {
			io.keys[event.code] = true;
			if(event.code === "Tab") {
				event.preventDefault();
			}
		};
		document.body.onkeyup = function() { io.keys[event.code] = false; };
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
				if(dimensions.hasOwnProperty(i)) {
					this[i] = dimensions[i];
				}
			}
		}
		.method("translate", function(x, y) {
			return new utils.geom.Rectangle({ x: this.x + x, y: this.y + y, w: this.w, h: this.h });
		})
		.method("clone", function() {
			return new utils.geom.Rectangle({ x: this.x, y: this.y, w: this.w, h: this.h });
		})
	},
	color: {
		mix: function(color1RGB, color2RGB, percentage) {
			var EXTRACT_NUMBERS = /(\d|\.)+/g;
			/*
			Returns the color that is 'percentage' between the two other colors. ('percentage' isn't really a percentage; its value must be between 0 and 1. 0 = entirely color1, 1 = entirely color2).
			*/
			if(typeof percentage !== "number") {
				percentage = 0.5;
			}
			var color1 = color1RGB.match(EXTRACT_NUMBERS);
			var color2 = color2RGB.match(EXTRACT_NUMBERS);
			if(color1.length !== 3 || color2.length !== 3) {
				throw new Error("Invalid rgb color code: must contain exactly 3 numbers");
			}
			var result = [];
			for(var i = 0; i < color1.length; i ++) {
				result.push(Math.map(
					percentage,
					0, 1,
					parseFloat(color1[i]), parseFloat(color2[i])
				))
			}
			return "rgb(" + result[0] + ", " + result[1] + ", " + result[2] + ")";
		},
		hslToRGB: Function.overload({
			"number, number, number": function(h, s, l) {
			    var r, g, b;

			    if(s == 0){
			        r = g = b = l; // achromatic
			    }
				else {
			        var hue2rgb = function (p, q, t) {
			            if(t < 0) { t += 1; }
			            if(t > 1) { t -= 1; }
			            if(t < 1/6) {
							return p + (q - p) * 6 * t;
						}
			            if(t < 1/2) {
							return q;
						}
			            if(t < 2/3) {
							return p + (q - p) * (2/3 - t) * 6
						};
			            return p;
			        }

			        var q = (l < 0.5) ? (l * (1 + s)) : (l + s - l * s);
			        var p = 2 * (l - q);
			        r = hue2rgb(p, q, h + 1/3);
			        g = hue2rgb(p, q, h);
			        b = hue2rgb(p, q, h - 1/3);
			    }

			    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
			},
			"string": function(string) {
				var hsl = utils.color.parseHSL(string);
				return utils.color.hslToRGB(
					Math.map(hsl.hue, 0, 360, 0, 1),
					Math.map(hsl.saturation, 0, 100, 0, 1),
					Math.map(hsl.brightness, 0, 100, 0, 1)
				);
			}
		}),
		PARSE_HSL: /^hsl\(([\d.]+), ([\d.]+)%, ([\d.]+)%\)$/g,
		parseHSL: function(string) {
			this.PARSE_HSL.lastIndex = 0;
			if(this.PARSE_HSL.test(string)) {
				this.PARSE_HSL.lastIndex = 0;
				var numbers = this.PARSE_HSL.exec(string);
				var hue = numbers[1], saturation = numbers[2], brightness = numbers[3];
				return {
					hue: parseFloat(hue),
					saturation: parseFloat(saturation),
					brightness: parseFloat(brightness)
				};
			}
			else {
				throw new Error("Invalid HSL string; did not match HSL syntax.");
			}
		},
		PARSE_RGB: /^rgb\(([\d.]+), ([\d.]+), ([\d.]+)\)$/g,
		parseRGB: function(string) {
			this.PARSE_RGB.lastIndex = 0;
			if(this.PARSE_RGB.test(string)) {
				this.PARSE_RGB.lastIndex = 0;
				var numbers = this.PARSE_RGB.exec(string);
				var red = numbers[1], green = numbers[2], blue = numbers[3];
				return {
					red: parseFloat(red),
					green: parseFloat(green),
					blue: parseFloat(blue)
				};
			}
			else {
				throw new Error("Invalid RGB string; did not match RGB syntax.");
			}
		}
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
		settings.obscuresLight = settings.obscuresLight || false;
		settings.lightBlockingEdges = settings.lightBlockingEdges || ["left", "right", "top", "bottom"];
		settings.rayVertices = settings.rayVertices || ["top-left", "top-right", "bottom-left", "bottom-right"];
		settings.obscurity = (typeof settings.obscurity === "number") ? settings.obscurity : 1;
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
					frontDepth,
					null,
					{
						obscuresLight: settings.obscuresLight,
						lightBlockingEdges: settings.lightBlockingEdges,
						rayVertices: settings.rayVertices,
						obscurity: settings.obscurity,
						isBeingDebugged: settings.isBeingDebugged
					}
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
		settings = settings || {};
		settings.obscuresLight = (typeof settings.obscuresLight === "boolean") ? settings.obscuresLight : false;
		/*
		Draws a sideways polygonal prism w/ base defined by 'points' array, w/ front color 'frontCol' and side color 'sideCol' going from 'frontDepth' to 'backDepth'.
		*/
		/* Generate a list of points in 3d */
		var frontVertices = points.map(point => graphics3D.point3D(point.x, point.y, frontDepth));
		var backVertices = points.map(point => graphics3D.point3D(point.x, point.y, backDepth));
		/* side faces */
		c.fillStyle = sideCol;
		game.dungeon[game.theRoom].beginRenderingGroup(); {
			for(var i = 0; i < frontVertices.length; i ++) {
				var next = (i + 1) % frontVertices.length;
				game.dungeon[game.theRoom].render(
					new RenderingOrderShape(
						"polygon",
						[frontVertices[i], frontVertices[next], backVertices[next], backVertices[i]],
						sideCol,
						backDepth
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
				frontDepth,
				0,
				{
					obscuresLight: settings.obscuresLight
				}
			)
		);
	},
	polyhedron: function(color, points) {
		/*
		Not really a polyhedron. It just connects the (3d) points in order.
		*/
		var farthestBackPoint = points.min(point => point.z).z;
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
		var front = points.map(point => graphics3D.point3D(point.x, point.y, frontDepth));
		var back = points.map(point => graphics3D.point3D(point.x, point.y, backDepth));
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
		graphics3D.boxFronts.forEach(boxFront => {
			if(boxFront.type === "boulder void") {
				c.globalAlpha = Math.min(boxFront.opacity, 0);
				c.fillStyle = "rgb(150, 150, 150)";
				c.fillPoly(boxFront.pos1, boxFront.pos2, boxFront.pos3, boxFront.pos4);
				c.globalAlpha = 1;
			}
			if(boxFront.type === "rect") {
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
			else if(boxFront.type === "arc") {
				c.fillStyle = boxFront.col;
				c.strokeStyle = boxFront.col;
				c.fillArc(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3], boxFront.loc[4], true);
				c.strokeArc(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3], boxFront.loc[4]);
			}
		});
	},

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
			points.forEach(point => {
				collisions.solids.rect(point.x, point.y, 3, 3, { illegalHandling: settings.illegalHandling, walls: settings.walls, extraBouncy: settings.extraBouncy, moving: settings.moving, onCollision: settings.onCollision, collisionCriteria: settings.collisionCriteria, noPositionLimits: settings.noPositionLimits });
			});
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
	lineIntersectsLine: function(line1A, line1B, line2A, line2B) {
		/*
		Finds the intersection of two lines (infinitely long), one going through the points line1A and line1B, and another going through the points line2A and line2B.
		*/

		/* special cases for vertical lines */
		if(line1B.x === line1A.x || line2B.x === line2A.x) {
			if(line1B.x === line1A.x && line2B.y === line2A.y) {
				/* line 1 is vertical and line 2 is horizontal */
				return { x: line1A.x, y: line2B.y };
			}
			if(line2B.x === line2A.x && line1B.y === line1A.y) {
				/* line 2 is vertical and line 1 is horizontal */
				return { x: line2A.x, y: line1B.y };
			}
			/* a line is vertical (undefined slope). switch x and y values (making it horizontal), calculate, and then switch x and y again to cancel out. */
			[line1A.x, line1A.y] = [line1A.y, line1A.x];
			[line1B.x, line1B.y] = [line1B.y, line1B.x];
			[line2A.x, line2A.y] = [line2A.y, line2A.x];
			[line2B.x, line2B.y] = [line2B.y, line2B.x];
			var result = this.lineIntersectsLine(line1A, line1B, line2A, line2B);
			if(result === null) { return result; }
			[result.x, result.y] = [result.y, result.x];
			return result;
		}

		/* convert to slope-intercept form to make calculations easier */
		var slope1 = (line1B.y - line1A.y) / (line1B.x - line1A.x);
		var slope2 = (line2B.y - line2A.y) / (line2B.x - line2A.x);
		if(slope1 === slope2) {
			return null; // lines are paralell - no intersection
		}
		var intercept1 = line1A.y - (slope1 * line1A.x);
		var intercept2 = line2A.y - (slope2 * line2A.x);

		/* solve equations */
		var xValue = (intercept2 - intercept1) / (slope1 - slope2)
		return {
			x: xValue,
			y: (slope1 * xValue) + intercept1
		};
	},
	rayIntersectsRectangle: function(rayOrigin, rayDirection, rect, sides) {
		sides = sides || ["left", "right", "top", "bottom"];
		var intersections = [
			(sides.includes("left")
				? this.rayIntersectsSegment(
					rayOrigin, rayDirection,
					{ x: rect.x, y: rect.y },
					{ x: rect.x, y: rect.y + rect.h }
				)
				: null
			),
			(sides.includes("right")
				? this.rayIntersectsSegment(
					rayOrigin, rayDirection,
					{ x: rect.x + rect.w, y: rect.y },
					{ x: rect.x + rect.w, y: rect.y + rect.h }
				)
				: null
			),
			(sides.includes("top")
				? this.rayIntersectsSegment(
					rayOrigin, rayDirection,
					{ x: rect.x, y: rect.y },
					{ x: rect.x + rect.w, y: rect.y }
				)
				: null
			),
			(sides.includes("bottom")
				? this.rayIntersectsSegment(
					rayOrigin, rayDirection,
					{ x: rect.x, y: rect.y + rect.h },
					{ x: rect.x + rect.w, y: rect.y + rect.h }
				)
				: null
			),
		].filter(intersection => intersection !== null);
		if(intersections.length === 0) { return null; }
		return intersections.min(intersection => Math.distSq(intersection.x, intersection.y, rayOrigin.x, rayOrigin.y));
	},
	rayIntersectsSegment: function(rayOrigin, rayDirection, endPoint1, endPoint2) {
		var pointOnRay = {
			x: rayOrigin.x + rayDirection.x,
			y: rayOrigin.y + rayDirection.y
		};

		// RAY in parametric: Point + Delta*T1
		var r_px = rayOrigin.x;
		var r_py = rayOrigin.y;
		var r_dx = pointOnRay.x-rayOrigin.x;
		var r_dy = pointOnRay.y-rayOrigin.y;

		// SEGMENT in parametric: Point + Delta*T2
		var s_px = endPoint1.x;
		var s_py = endPoint1.y;
		var s_dx = endPoint2.x-endPoint1.x;
		var s_dy = endPoint2.y-endPoint1.y;

		// Are they parallel? If so, no intersect
		var r_mag = Math.sqrt(r_dx*r_dx+r_dy*r_dy);
		var s_mag = Math.sqrt(s_dx*s_dx+s_dy*s_dy);
		if(r_dx/r_mag==s_dx/s_mag && r_dy/r_mag==s_dy/s_mag){
			// Unit vectors are the same.
			return null;
		}

		// SOLVE FOR t1 & t2
		// r_px+r_dx*t1 = s_px+s_dx*t2 && r_py+r_dy*t1 = s_py+s_dy*t2
		// ==> t1 = (s_px+s_dx*t2-r_px)/r_dx = (s_py+s_dy*t2-r_py)/r_dy
		// ==> s_px*r_dy + s_dx*t2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*t2*r_dx - r_py*r_dx
		// ==> t2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
		var t2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
		var t1 = (s_px+s_dx*t2-r_px)/r_dx;

		if(t1<0) return null;
		if(t2<0 || t2>1) return null;

		// Return the POINT OF INTERSECTION
		return {
			x: r_px+r_dx*t1,
			y: r_py+r_dy*t1,
			param: t1
		};
	},
	segmentIntersectsSegment: function(line1A, line1B, line2A, line2B) {
		var intersection = this.lineIntersectsLine(line1A.clone(), line1B.clone(), line2A.clone(), line2B.clone());
		if(
			!intersection.x.isApproxBetween(line1A.x, line1B.x) ||
			!intersection.y.isApproxBetween(line1A.y, line1B.y) ||
			!intersection.x.isApproxBetween(line2A.x, line2B.x) ||
			!intersection.y.isApproxBetween(line2A.y, line2B.y)
		) {
			return null;
		}
		return intersection;
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
	},

	initializedCollisionTests: function() {
		testing.addTest({
			run: function() {
				var result1 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: 0, y: 0 },
					{ x: 1, y: 1 },
					/* line 2 */
					{ x: 0, y: 0 },
					{ x: -1, y: 1 }
				);
				testing.assert(result1.x === 0 && result1.y === 0);
				var result2 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: 0, y: 0 },
					{ x: 10, y: 10 },
					/* line 2 */
					{ x: 0, y: 10 },
					{ x: 10, y: 0 }
				);
				testing.assert(result2.x === 5 && result2.y === 5);
				var result3 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: -5, y: 0 },
					{ x: -4, y: 2 },
					/* line 2 */
					{ x: 5, y: 0 },
					{ x: 4, y: 2 }
				);
				testing.assert(result3.x === 0 && result3.y === 10);
			},
			unit: "collisions.lineIntersectsLine()",
			name: "basic functionality"
		});
		testing.addTest({
			run: function() {
				var result1 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: 0, y: 0 },
					{ x: 1, y: 1 },
					/* line 2 */
					{ x: 0, y: 0 },
					{ x: -1, y: -1 }
				);
				testing.assert(result1 === null);
				var result2 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: 0, y: 0 },
					{ x: 1, y: 1 },
					/* line 2 */
					{ x: 10, y: 10 },
					{ x: 11, y: 11 }
				);
				testing.assert(result2 === null);
			},
			unit: "collisions.lineIntersectsLine()",
			name: "return null for paralell lines"
		});
		testing.addTest({
			run: function() {
				var result1 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: 7, y: -100 },
					{ x: 7, y: 100 },
					/* line 2 */
					{ x: 0, y: 0 },
					{ x: 1, y: 1 }
				);
				testing.assert(result1.x === 7 && result1.y === 7);
				var result2 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: 7, y: -100 },
					{ x: 7, y: 100 },
					/* line 2 */
					{ x: 5, y: -100 },
					{ x: 5, y: 100 }
				);
				testing.assert(result2 === null);
				var result3 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: 7, y: -100 },
					{ x: 7, y: 100 },
					/* line 2 */
					{ x: -100, y: 4 },
					{ x: 100, y: 4 }
				);
				testing.assert(result3.x === 7 && result3.y === 4);
				var result4 = collisions.lineIntersectsLine(
					/* line 1 */
					{ x: -100, y: 4 },
					{ x: 100, y: 4 },
					/* line 2 */
					{ x: 7, y: -100 },
					{ x: 7, y: 100 }
				);
				testing.assert(result4.x === 7 && result4.y === 4);
			},
			unit: "collisions.lineIntersectsLine()",
			name: "correctly handle vertical lines"
		});

		testing.addTest({
			run: function() {
				var intersection = collisions.rayIntersectsSegment(
					{ x: 0, y: 0 },
					{ x: 1, y: 1 },
					{ x: 0, y: 10 },
					{ x: 10, y: 0 }
				);
				testing.assert(intersection.x === 5 && intersection.y === 5);
			},
			unit: "collisions.rayIntersectsSegment()",
			name: "works correctly for points on ray and line"
		});
		testing.addTest({
			run: function() {
				var intersection = collisions.rayIntersectsSegment(
					{ x: 0, y: 0 },
					{ x: 1, y: 1 },
					{ x: -10, y: 0 },
					{ x: 0, y: -10 }
				);
				testing.assert(intersection === null);
			},
			unit: "collisions.rayIntersectsSegment()",
			name: "works correctly for points on line but not on ray"
		});
		return true;
	} ()
};
var game = {
	initializedTests: function() {
		testing.addTest({
			run: function() {
				testing.resetter.resetGameState();
				game.onScreen = "nonexistent-screen-id"; // this is so it runs as little code as possible. NOT meant to throw an error.
				timer();
			},
			unit: "game",
			name: "timer() function runs without errors"
		});

		return true;
	} (),

	onScreen: "home",

	items: [
		Dagger, Sword, Spear, //melee weapons
		WoodBow, MetalBow, MechBow, LongBow, //ranged weapons
		EnergyStaff, ElementalStaff, ChaosStaff, //magic weapons
		WizardHat, MagicQuiver, Helmet, //equipables
		Barricade, Map, //extras / bonuses
		FireCrystal, WaterCrystal, EarthCrystal, AirCrystal //crystals
	],
	initializedItemTests: utils.initializer.request(function() {
		game.items.forEach(itemConstructor => {
			/* verify that either `use` or `attack` is called when the user presses the 'use item' key */
			if(typeof itemConstructor.prototype.use === "function") {
				testing.addTest({
					run: function() {
						testing.resetter.resetGameState();

						var functionWasRun = false;
						var item = new itemConstructor();
						item.use = item.use.insertCodeBefore(function() {
							functionWasRun = true;
						});

						p.invSlots[0].content = item;
						p.activeSlot = 0;
						io.keys.KeyA = true;
						testing.runFrames(2);
						testing.assert(functionWasRun);
					},
					unit: itemConstructor.name,
					name: "use() method is run on correct user input"
				});
			}
			else if(typeof itemConstructor.prototype.attack === "function") {
				testing.addTest({
					run: function() {
						testing.resetter.resetGameState();

						var functionWasRun = false;
						var item = new itemConstructor();
						item.attack = item.attack.insertCodeBefore(function() {
							functionWasRun = true;
						});

						p.invSlots[0].content = item;
						p.activeSlot = 0;
						io.keys.KeyA = true;
						testing.runFrames(2);
						testing.assert(functionWasRun);
					},
					unit: itemConstructor.name,
					name: "attack() method is run on correct user input"
				});
			}

			/*
			For equipables (items that can be put into "equipable" slots):
			- Test that they can be put on
			- Test that they can be taken off
			- Test that they can be unequipped
			For non-equipables:
			- Test that they can be equipped
			- Test that they can be unequipped
			*/
			function testItemMovement(itemConstructor, initialSlot, destinationSlot) {
				p.guiOpen = "inventory";

				initialSlot.content = new itemConstructor();
				io.mouse.x = initialSlot.x + 5;
				io.mouse.y = initialSlot.y + 5;
				io.mouse.pressed = true;
				testing.runFrames(2);

				testing.assert(destinationSlot.content instanceof itemConstructor);
				testing.assert(initialSlot.content === "empty");
			};
			if(itemConstructor.extends(Equipable)) {
				testing.addTest({
					run: function() {
						testing.resetter.resetGameState();
						testItemMovement(
							itemConstructor,
							p.invSlots.find(slot => slot.type === "storage"),
							p.invSlots.find(slot => slot.type === "equip")
						);
					},
					unit: itemConstructor.name,
					name: "itemConstructor can be put on"
				});
				testing.addTest({
					run: function() {
						testing.resetter.resetGameState();
						testItemMovement(
							itemConstructor,
							p.invSlots.find(slot => slot.type === "equip"),
							p.invSlots.find(slot => slot.type === "storage")
						);
					},
					unit: itemConstructor.name,
					name: "item can be taken off"
				});
			}
			else {
				testing.addTest({
					run: function() {
						testing.resetter.resetGameState();
						testItemMovement(
							itemConstructor,
							p.invSlots.find(slot => slot.type === "storage"),
							p.invSlots.find(slot => slot.type === "holding")
						);
					},
					unit: itemConstructor.name,
					name: "item can be equipped"
				});
			}
			testing.addTest({
				run: function() {
					testing.resetter.resetGameState();
					testItemMovement(
						itemConstructor,
						p.invSlots.find(slot => slot.type === "holding"),
						p.invSlots.find(slot => slot.type === "storage")
					);
				},
				unit: itemConstructor.name,
				name: "item can be unequipped"
			});
		});
		game.initializedItemTests = true;
	}),
	enemies: [
		Spider, Bat,
		SkeletonWarrior, SkeletonArcher,
		Wraith, Dragonling, Troll
	],
	initializedEnemyTests: utils.initializer.request(function() {
		game.enemies.forEach(enemyConstructor => {
			testing.addTest({
				run: function() {
					testing.resetter.resetGameState();
					game.dungeon = [testing.utils.emptyRoom()];
					game.dungeon.onlyItem().content.push(new enemyConstructor(0, 0));
					testing.runFrames(2);
				},
				unit: enemyConstructor.name,
				name: "enemy can exist"
			});
		});
	}),
	rooms: {
		ambient1: {
			name: "ambient1",
			colorScheme: null,
			difficulty: 0,
			extraDoors: 2,
			add: function() {
				game.addRoom(
					new Room(
						"ambient1",
						[
							new Border("floor", { y: 0 }),
							new Border("ceiling", { y: -200 }),
							new Border("wall-to-left", { x: -400 }),
							new Border("wall-to-right", { x: 400 }),

							new Door(-200, 0, ["ambient", "combat", "parkour", "secret"]),
							new Door(0, 0, ["ambient", "combat", "parkour", "secret"]),
							new Door(200, 0, ["ambient", "combat", "parkour", "secret"]),

							new Pillar(-300, 0, 200),
							new Pillar(-100, 0, 200),
							new Pillar(100, 0, 200),
							new Pillar(300, 0, 200)
						],
						"simple-bricks"
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
				game.addRoom(
					new Room(
						"ambient2",
						[
							new Border("wall-to-left", { x: -350 }),
							new Border("wall-to-right", { x: 350 }),
							new Border("floor", { y: 0 }),
							new Border("ceiling", { y: -200 }),

							new Door(-250, 0, ["combat", "parkour", "secret"]),
							new Door(250, 0, ["combat", "parkour", "secret"]),

							new Torch(-150, -60),
							new Torch(-50, -60),
							new Torch(50, -60),
							new Torch(150, -60),
						],
						"simple-bricks"
					)
				);
			}
		},
		ambient3: {
			name: "ambient3",
			colorScheme: null,
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.addRoom(
					new Room(
						"ambient3",
						[
							new Border("floor", { y: 0 }),
							new Border("ceiling", { y: -400 }),
							new Border("wall-to-right", { x: 600 }),
							new Border("wall-to-left", { x: 0 }),

							new Door(500, 0, ["combat", "parkour", "secret"], true, false, "toggle"),
							new Door(100, -200, ["combat", "parkour", "secret"]),

							new Border("floor-to-left", { x: 200, y: -200 }),
							new Stairs(200, 0, 10, "right"),
						],
						"detailed-bricks"
					)
				);
			}
		},
		ambient4: {
			name: "ambient4",
			colorScheme: null,
			difficulty: 1,
			add: function() {
				game.addRoom(
					new Room(
						"ambient4",
						[
							new Border("wall-to-left", { x: -340 }),
							new Border("wall-to-right", { x: 340 }),
							new Border("floor-to-left", { x: -140, y: 0 }),
							new Border("floor-to-right", { x: 140, y: 0 }),
							new Border("ceiling", { y: -200 }),

							new Door(-240, 0, ["combat", "parkour", "secret"]),
							new Door(240, 0, ["combat", "parkour", "secret"]),

							new FallBlock(-120, 0),
							new FallBlock(-80, 0),
							new FallBlock(-40, 0),
							new FallBlock(0, 0),
							new FallBlock(40, 0),
							new FallBlock(80, 0),
							new FallBlock(120, 0),
						],
						"simple-bricks"
					)
				);
			}
		},
		ambient5: {
			name: "ambient5",
			colorScheme: "all",
			difficulty: 0,
			add: function() {
				game.addRoom(
					new Room(
						"ambient5",
						[
							new Border("wall-to-left", { x: -350 }),
							new Border("wall-to-right", { x: 350 }),
							new Border("floor", { y: 0 }),
							new Roof(0, -300, 350),

							new Door(-250, 0, ["combat", "parkour", "secret"]),
							new Door(250, 0, ["combat", "parkour", "secret"]),

							new Fountain(0, 0)
						],
						"detailed-bricks"
					)
				);
			}
		},
		ambient6: {
			name: "ambient6",
			colorScheme: "green",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.addRoom(
					new Room(
						"ambient6",
						[
							new Border("wall-to-left", { x: -350 }),
							new Border("wall-to-right", { x: 350 }),
							new Border("floor", { y: 0 }),
							new Border("ceiling-to-left", { x: -150, y: -400 }),
							new Border("ceiling-to-right", { x: 150, y: -400 }),

							new Door(-250, 0, ["ambient", "combat", "parkour"]),
							new Door(250, 0, ["ambient", "combat", "parkour"]),

							new LightRay(-150, 300, 0),
							new Tree(0, 0,
								{
									maxDepth: 3,
									branchLengths: [40, 30, 20, 10],
									branchAngles: function() {
										var angles = [];
										for(var i = 0; i < 3; i ++) {
											const MIN_ANGLE = 15;
											const MAX_ANGLE = 75;
											var angleSet = [];
											if(Math.random() < 0.5) {
												angleSet = [Math.randomInRange(MIN_ANGLE, MAX_ANGLE)];
											}
											else {
												while(angleSet.length === 0 || Math.dist(angleSet[0], angleSet[1]) < 25) {
													angleSet = [Math.randomInRange(MIN_ANGLE, MAX_ANGLE), Math.randomInRange(MIN_ANGLE, MAX_ANGLE)];
												}
											}
											angleSet = angleSet.concat(angleSet.map(angle => -angle));
											if(Math.random() < 0.5 || i === 0) {
												angleSet.push(0);
											}
											angles.push(angleSet);
										}
										return angles;
									} (),
									trunkHeight: Math.randomInRange(45, 75) * 0 + 75
								}
							)
						],
						"simple-bricks"
					)
				);
			}
		},
		secret1: {
			name: "secret1",
			colorScheme: "all",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				var possibleItems = this.getPossibleStatueItems();
				if(possibleItems.length === 0) {
					/* default to combat1 if the player has all the weapons in the game */
					if(Object.typeof(game.rooms.combat3) === "object") {
						game.rooms.combat3.add();
						return;
					}
					else {
						throw new Error("Player has all items in game and default room was not available");
					}
				}
				game.addRoom(
					new Room(
						"secret1",
						[
							new Border("wall-to-left", { x: -300 }),
							new Border("wall-to-right", { x: 300 }),
							new Border("floor", { y: 0 }),
							new Roof(0, -300, 300),

							new Door(-200, 0, ["ambient", "combat", "parkour"]),
							new Door(200, 0, ["ambient", "combat", "parkour"]),

							new Statue(0, -130),
							new Decoration(-100, -50),
							new Decoration(100, -50)
						],
						"detailed-bricks"
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
				game.addRoom(
					new Room(
						"combat1",
						[
							new Border("floor", { y: 0 }),
							new Border("wall-to-left", { x: -500 }),
							new Border("wall-to-right", { x: 500 }),
							new Roof(0, -300, 500),

							new Door(-450, 0, ["ambient"], false),
							new Door(0, 0, ["reward"], true, false, "toggle"),
							new Door(450, 0, ["ambient"], false),

							new RandomEnemy(0, 0),
							new Decoration(300, -50), new Decoration(-300, -50),
							new Decoration(150, -50), new Decoration(-150, -50)
						],
						"detailed-bricks"
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
				game.addRoom(
					new Room(
						"combat2",
						[
							new Border("wall-to-left", { x: -500 }),
							new Border("wall-to-right", { x: 500 }),
							new Border("floor", { y: 0 }),
							new Border("ceiling", { y: -400 }),

							new Door(-400, 0, ["reward"]),
							new Door(0, -200, ["ambient"]),
							new Door(400, 0, ["reward"]),

							new Stairs(-100, 0, 10, "left"),
							new Block(-100, -200, 200, 200),
							new Stairs(100, 0, 10, "right"),
							new RandomEnemy(-400, 0),
							new RandomEnemy(400, 0)
						],
						"detailed-bricks"
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
				game.addRoom(
					new Room(
						"combat3",
						[
							new Border("wall-to-left", { x: -600 }),
							new Border("wall-to-right", { x: 600 }),
							new Border("floor-to-left", { x: -400, y: 0 }),
							new Border("floor-to-right", { x: 400, y: 0 }),

							new Door(-500, 0, ["reward"]),
							new Door(500, 0, ["reward"]),

							new Bridge(0, -200),
							new RandomEnemy(0, -200)
						],
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
				game.addRoom(
					new Room(
						"combat4",
						[
							new Border("floor-to-left", { x: -500, y: 100 }),
							new Border("floor-to-right", { x: 500, y: 100 }),
							new Border("wall-to-left", { x: -700 }),
							new Border("wall-to-right", { x: 700 }),

							new Door(0, 0, ["reward"], true, false, "toggle"),
							new Door(-600, 100, ["ambient", "secret"]),
							new Door(600, 100, ["ambient", "secret"]),

							new Block(-300, 0, 600, Border.LARGE_NUMBER),
							new Decoration(0, -200),
							new RandomEnemy(0, 0),
							new Pillar(-400, Border.LARGE_NUMBER, Border.LARGE_NUMBER - 50),
							new Pillar(-150, 0, 200),
							new Pillar(150, 0, 200),
							new Pillar(400, Border.LARGE_NUMBER, Border.LARGE_NUMBER - 50)
						],
						"detailed-bricks"
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
				game.addRoom(
					new Room(
						"parkour1",
						[
							new Border("wall-to-left", { x: -700 }),
							new Border("wall-to-right", { x: 700 }),
							new Border("floor-to-left", { x: -500, y: 0 }),
							new Border("floor-to-right", { x: 500, y: 0 }),

							new Door(-600, 0, ["ambient"]),
							new Door(0, -100, ["reward"], true, false, "toggle"),
							new Door(600, 0, ["ambient"]),

							new Block(-100, -100, 200, Border.LARGE_NUMBER),
							new Decoration(-100, -150),
							new Decoration(100, -150),
							new FallBlock(-400, -25),
							new FallBlock(-300, -50),
							new FallBlock(-200, -75),
							new FallBlock(200, -75),
							new FallBlock(300, -50),
							new FallBlock(400, -25),
							new Roof(0, -300, 700)
						],
						"detailed-bricks"
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
				game.addRoom(
					new Room(
						"parkour2",
						[
							new Border("wall-to-left", { x: -650 }),
							new Border("wall-to-right", { x: 650 }),
							new Border("floor-to-left", { x: -450, y: 0 }),
							new Border("floor-to-right", { x: 450, y: 0 }),

							new Door(-550, 0, ["ambient"]),
							new Door(0, 200, ["reward"]),
							new Door(550, 0, ["ambient"]),

							new Block(-100, 200, 200, Border.LARGE_NUMBER),
							new Pulley(-350, 150, 200, 150, 200, 150),
						],
						"detailed-bricks"
					)
				);
			}
		},
		parkour3: {
			name: "parkour3",
			colorScheme: null,
			difficulty: 4,
			extraDoors: 0.5,
			add: function() {
				game.addRoom(
					new Room(
						"parkour3",
						[
							new Border("wall-to-left", { x: 0 }),
							new Border("wall-to-right", { x: 1000 }),
							new Border("floor-to-left", { x: 200, y: -300 }),
							new Border("floor-to-right", { x: 800, y: 0 }),

							new Door(100, -300, ["reward"]),
							new Door(900, 0, ["ambient"]),

							new TiltPlatform(400, -200),
							new TiltPlatform(600, -100),
							new Roof(500, -500, 500)
						],
						"detailed-bricks"
					)
				);
			}
		},
		parkour4: {
			name: "parkour4",
			colorScheme: "all",
			difficulty: 5,
			extraDoors: 2,
			add: function() {
				game.addRoom(
					new Room(
						"parkour4",
						[
							new Border("wall-to-left", { x: -700 }),
							new Border("wall-to-right", { x: 700 }),
							new Border("floor-to-left", { x: -500, y: 0 }),
							new Border("floor-to-right", { x: 500, y: 0 }),

							new Door(-600, 0, ["ambient"]),
							new Door(600, 0, ["ambient"]),
							new Door(-600, -400, ["reward", true, false, "toggle"]),
							new Door(600, -400, ["reward", true, false, "toggle"]),

							new Block(-700, -400, 200, 100),
							new Block(500, -400, 200, 100),
							new Pulley(-400, 200, 200, 200, -150, 150),
							new TiltPlatform(0, -100)
						],
						"detailed-bricks"
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
				game.addRoom(
					new Room(
						"reward1",
						[
							new Border("floor", { y: 0 }),
							new Border("wall-to-left", { x: -200 }),
							new Border("wall-to-right", { x: 200 }),
							new Border("ceiling", { y: -200 }),
							new Chest(-100, 0),
							new Chest(100, 0),
							new Door(0, 0, "")
						],
						"simple-bricks"
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
				if(!p.hasInInventory(MagicWeapon)) {
					chooser = 0;
				}
				if(p.healthAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "blue") {
					chooser = 1;
				}
				if(p.manaAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "red") {
					chooser = 0;
				}
				if((p.healthAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "blue") && (p.manaAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "red")) {
					game.rooms.reward1.add();
				}
				p.healthAltarsFound += (chooser < 0.5) ? 1 : 0;
				p.manaAltarsFound += (chooser > 0.5) ? 1 : 0;
				game.addRoom(
					new Room(
						"reward2",
						[
							new Border("floor", { y: 0 }),
							new Border("ceiling", { y: -200 }),
							new Border("wall-to-left", { x: -250 }),
							new Border("wall-to-right", { x: 250 }),

							new Door(-150, 0, ["combat", "parkour"], false, true),
							new Door(150, 0, ["combat", "parkour"], false, true),

							new Block(-40, -40, 80, 40, { lightBlockingEdges: ["top"], rayVertices: [] }),
							new Stairs(-40, 0, 2, "left"),
							new Stairs(40, 0, 2, "right"),

							new Block(-60, -180, 120, 20),
							new Block(-80, -200, 160, 20),

							new Altar(0, -100, chooser < 0.5 ? "health" : "mana")
						],
						"simple-bricks"
					)
				);
				game.dungeon.lastItem().colorScheme = (chooser < 0.5) ? "red" : "blue";
			}
		},
		reward3: {
			name: "reward3",
			colorScheme: "red",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.addRoom(new Room(
					"reward3",
					[
						new Border("floor", { y: 0 }),
						new Border("wall-to-left", { x: -250 }),
						new Border("wall-to-right", { x: 250 }),
						new Border("ceiling", { y: -300 }),

						new Door(-200, 0, ["combat", "parkour"], false, true),
						new Door(200, 0, ["combat", "parkour"], false, true),

						new Forge(0, 0)
					],
					"simple-bricks"
				));
			}
		},
		reward4: {
			name: "reward4",
			colorScheme: "all",
			difficulty: 0,
			extraDoors: 0,
			add: function() {
				game.addRoom(
					new Room(
						"reward4",
						[
							new Border("floor", { y: 0 }),
							new Border("wall-to-right", { x: 600 }),
							new Border("wall-to-left", { x: 0 }),
							new Border("ceiling", { y: -400 }),
							new Border("floor-to-left", { x: 200, y: -200 }),

							new Door(100, -200, ["combat", "parkour", "secret"]),

							new Stairs(200, 0, 10, "right"),
							new Chest(500, 0),
							new Decoration(500, -100),
						],
						"detailed-bricks"
					)
				);
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
			return ROOM_PREFIXES.some(prefix => {
				if(string.startsWith(prefix)) {
					var afterPrefix = string.substring(prefix.length, string.length);
					if(Object.typeof(parseInt(afterPrefix)) === "number") {
						return true;
					}
				}
				return false;
			});
		}
	},
	initializedRoomTests: utils.initializer.request(function() {
		game.rooms.getAllRooms().forEach(room => {
			testing.addTest({
				run: function() {
					testing.resetter.resetGameState();
					var roomType = /[^\d]+/g.exec(room.name)[0];
					debugging.setGeneratableRooms(room.name);
					game.dungeon = [testing.utils.emptyRoom()];
					var door = new Door(0, 0, [roomType]);
					door.containingRoomID = 0;
					game.dungeon.onlyItem().content.push(door);

					game.transitions.opacity = 1;
					game.transitions.dir = "fade-out";
					io.keys.KeyS = true;
					testing.runFrames(2);

					testing.assert(game.dungeon.length === 2);
					testing.assert(game.inRoom === 1);
					testing.assert(game.dungeon[1].type === room.name);
					testing.assert(game.dungeon[1].getInstancesOf(Door).min(door => Math.dist(door.x, door.y, p.x, p.y).dest === 0));
					testing.assert(game.dungeon[0].getInstancesOf(Door).onlyItem().dest === 1);
				},
				unit: room.name,
				name: "room can be generated"
			});
		});
	}),
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

	exist: function() {
		if(game.onScreen === "play") {
			game.dungeon[game.theRoom].renderingObjects = [];
			/* load enemies in other rooms */
			p.update();

			for(var i = 0; i < game.dungeon.length; i ++) {
				var room = game.dungeon[i];
				if((game.inRoom === i) || room.getInstancesOf(Enemy).some(enemy => enemy.seesPlayer)) {
					game.theRoom = i;
					room.update(i);
				}
			};

			/* move player into lower room when falling */
			if(p.y + p.hitbox.bottom > 900 && !game.transitions.isTransitioning()) {
				game.transitions.dir = "fade-out";
				game.transitions.color = "rgb(0, 0, 0)";
				game.transitions.onScreenChange = function() {
					p.roomsExplored ++;
					game.inRoom = game.dungeon.length;
					game.camera.x = 0;
					game.camera.y = 0;
					p.x = 0;
					p.y = -600;
					p.velocity.y = 2;
					p.fallDmg = Math.round(Math.randomInRange(40, 50));

					/* load a room like ambient1 (three doors with pillars room), but without a roof and with randomized pillar sizes */
					game.rooms.ambient1.add();
					var addedRoom = game.dungeon.lastItem();
					addedRoom.content = addedRoom.content.filter((obj) => !(obj instanceof Border && obj.type === "ceiling"));
					addedRoom.getInstancesOf(Pillar).forEach((pillar) => { pillar.h = Math.randomInRange(200, 300); });
				};
			}

			game.theRoom = game.inRoom;
			game.dungeon[game.inRoom].display();

			var locationBeforeOffset = { x: p.x, y: p.y };
			p.x += game.camera.getOffsetX();
			p.y += game.camera.getOffsetY();
			p.display();
			p.x = locationBeforeOffset.x;
			p.y = locationBeforeOffset.y;
			debugging.displayHitboxes();

			p.gui();
			ui.infoBar.exist();
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
			(new Room()).displayRadialShadow();
		}
	},

	addRoom: function(room) {
		room.index = game.dungeon.length;
		game.dungeon.push(room);
	},
	generateNewRoom: function(entranceDoor) {
		var previousRoom = game.inRoom;
		p.roomsExplored ++;
		p.numHeals ++;
		/* Calculate distance to nearest unexplored door */
		game.calculatePaths();
		p.terminateProb = 0;
		game.dungeon.forEach(room => {
			room.getInstancesOf(Door).forEach(door => {
				if(typeof door.dest === "object" && !door.entering) {
					p.terminateProb += (1 / ((room.pathScore + 1) * (room.pathScore + 1)));
				}
			});
		});
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
			/* Remove rooms that don't match the type of door */
			for(var j = 0; j < entranceDoor.dest.length; j ++) {
				if(room.name.startsWith(entranceDoor.dest[j])) {
					return true;
				}
			}
			return false;
		});
		possibleRooms = possibleRooms.filter(function(room) {
			return (room.name !== game.dungeon[previousRoom].type);
		});
		/* Add selected room */
		var roomIndex = possibleRooms.randomIndex();
		possibleRooms[roomIndex].add();
		if(
			(debugging.settings.DEBUGGING_MODE && debugging.settings.REFLECT_ROOMS === true) ||
			((debugging.settings.REFLECT_ROOMS === null || !debugging.settings.DEBUGGING_MODE) && Math.random() < 0.5)
		) {
			game.dungeon.lastItem().reflect();
		}
		var room = game.dungeon.lastItem();
		if(possibleRooms[roomIndex].colorScheme && !possibleRooms[roomIndex].colorScheme.includes("|")) {
			room.colorScheme = possibleRooms[roomIndex].colorScheme;
			if(room.colorScheme === "all") {
				if(game.dungeon[previousRoom].colorScheme === null) {
					room.colorScheme = ["red", "green", "blue"].randomItem();
					if(debugging.settings.DEBUGGING_MODE && debugging.settings.ROOM_COLOR !== null) {
						room.colorScheme = debugging.settings.ROOM_COLOR;
					}
				}
				else {
					room.colorScheme = game.dungeon[previousRoom].colorScheme;
				}
			}
		}
		else {
			// rooms that can be multiple colors but not any color should implement their special logic in the add() function.
		}
		/* Reset transition variables */
		game.inRoom = game.dungeon.length - 1;
		p.enteringDoor = false;
		p.exitingDoor = true;
		p.op = 1;
		p.op = 95;
		entranceDoor.dest = game.dungeon.length;
		/* Select a door */
		var doorIndexes = [];
		for(var j = 0; j < room.content.length; j ++) {
			if(room.content[j] instanceof Door && (!!room.content[j].noEntry) === (!!entranceDoor.invertEntries)) {
				doorIndexes.push(j);
			}
		}
		if(doorIndexes.length === 0) {
			for(var j = 0; j < room.content.length; j ++) {
				if(room.content[j] instanceof Door) {
					doorIndexes.push(j);
				}
			}
		}
		var theIndex = doorIndexes.randomItem();
		/* update door graphic types inside room */
		if(room.content[theIndex].type === "toggle") {
			for(var j = 0; j < room.content.length; j ++) {
				if(room.content[j] instanceof Door && j !== theIndex) {
					room.content[j].type = (room.content[j].type === "same") ? "toggle" : "same";
				}
			}
		}
		room.content[theIndex].type = p.doorType;
		/* Assign new door to lead to this room */
		room.content[theIndex].dest = previousRoom;
		/* Assign this door to lead to new door */
		entranceDoor.dest = game.inRoom;
	},
	calculatePaths: function() {
		/*
		This function goes through and, for each room, it sets that rooms `pathScore` property to be equal to the minimum number of doors you would need to travel through to get from that room to the currently occupied room. (Basically just the distance between that room and the currently occupied room). Currently occupied room's `pathScore` will be equal to 0.
		*/
		function calculated() {
			return game.dungeon.every((room) => { room.pathScore !== null });
		};
		game.dungeon.forEach(room => { room.pathScore = null; });
		var timeOut = 0;
		game.dungeon[game.inRoom].pathScore = 0;
		while(!calculated() && timeOut < 20) {
			timeOut ++;
			game.dungeon.forEach((room, index) => {
				if(room.pathScore === null) {
					room.getInstancesOf(Door).forEach(door => {
						var destinationRoom = door.getDestinationRoom();
						if(destinationRoom !== null && destinationRoom.pathScore !== null) {
							room.pathScore = destinationRoom.pathScore + 1;
						}
					});
				}
			});
		}
	},

	tutorial: {
		stages: [
			/*
			Tutorial stage properties:
			- `id`: a string. all lowercase, words separated by dashes.
			- `text`: the text to display to the user (or a function to return the text to display to the user)
			- `nextStageID`: the ID of the next stage
			- `completionCriteria`: a function that determines whether the tutorial can move on to the next stage
			Optional tutorial stage properties:
			- `onCompletion`: a function to be run when the user moves on from this stage
			- `regressionCriteria`: a function that determines whether the tutorial should move the user back to this stage
			*/
			{
				type: "progression",
				id: "basic-movement",
				text: "arrow keys to move, up to jump",
				nextStageID: "interact-with-objects",
				completionCriteria: function() { return p.x > 725; },
				onCompletion: function() {
					game.dungeon.onlyItem().getInstancesOf(MovingWall).min(wall => wall.x).zDir = 0.01;
				}
			},
			{
				type: "progression",
				id: "interact-with-objects",
				text: "press S to interact with objects \n (for example: opening a chest)",
				nextStageID: "open-inventory",
				completionCriteria: function() { return p.hasInInventory(WoodBow); }
			},
			{
				type: "progression",
				id: "open-inventory",
				text: "press D to view your items",
				nextStageID: "equip-items",
				completionCriteria: function() { return p.guiOpen === "inventory"; },
				regressionCriteria: function() {
					return game.tutorial.currentStageID === "equip-items" && p.guiOpen === "none";
				}
			},
			{
				type: "user-correction",
				id: "dont-equip-arrows",
				text: "equipping arrows is useless \n (you don't need them equipped in order to shoot)",
				activationCriteria: function() {
					return p.invSlots.filter(slot => slot.type === "holding").filter(slot => slot.content instanceof Arrow).length !== 0 && game.tutorial.getStageByID("open-inventory").completed && !game.tutorial.getStageByID("close-inventory").completed;
				}
			},
			{
				type: "progression",
				id: "equip-items",
				text: "click an item to equip / unequip it \n (try equipping this staff)",
				nextStageID: "close-inventory",
				completionCriteria: function() {
					var heldItemSlots = p.invSlots.filter(slot => slot.type === "holding");
					return (
						heldItemSlots.some(slot => slot.content instanceof MeleeWeapon) &&
						heldItemSlots.some(slot => slot.content instanceof RangedWeapon) &&
						heldItemSlots.some(slot => slot.content instanceof MagicWeapon)
					);
					debugger;
				}
			},
			{
				type: "progression",
				id: "close-inventory",
				text: "now press D again to exit",
				nextStageID: "use-items",
				completionCriteria: function() { return p.guiOpen === "none"; }
			},
			{
				type: "progression",
				id: "use-items",
				text: function() {
					var text = "press A to use the item you're holding";
					if(p.invSlots[p.activeSlot].content instanceof MeleeWeapon) {
						text += "\n (like swinging a sword)";
					}
					else if(p.invSlots[p.activeSlot].content instanceof RangedWeapon) {
						text += "\n (like shooting a bow)";
					}
					else if(p.invSlots[p.activeSlot].content instanceof MagicWeapon) {
						text += "\n (like using a staff)";
					}
					return text;
				},
				nextStageID: "switch-items",
				completionCriteria: function() {
					return io.keys.KeyA;
				}
			},
			{
				type: "progression",
				id: "switch-items",
				text: "press the number keys (1, 2, 3) to switch between items",
				nextStageID: "aim-weapons-1",
				completionCriteria: function() {
					return io.keys.Digit1 || io.keys.Digit2 || io.keys.Digit3;
				},
			},
			{
				type: "progression",
				id: "aim-weapons-1",
				text: "you can aim ranged weapons",
				nextStageID: "aim-weapons-2",
				completionCriteria: function() {
					var itemHeld = p.invSlots[p.activeSlot].content;
					return (itemHeld instanceof RangedWeapon || itemHeld instanceof MagicWeapon) && game.tutorial.timeInCurrentStage > FPS;
				},
				regressionCriteria: function() {
					return !(p.invSlots[p.activeSlot].content instanceof RangedWeapon || p.invSlots[p.activeSlot].content instanceof MagicWeapon) && game.tutorial.currentStageID.startsWith("aim-weapons");
				}
			},
			{
				type: "progression",
				id: "aim-weapons-2",
				text: "hold down the A key",
				nextStageID: "aim-weapons-3",
				completionCriteria: function() { return io.keys.KeyA && game.tutorial.timeInCurrentStage > FPS; },
				regressionCriteria: function() {
					return game.tutorial.currentStageID.startsWith("aim-weapons") && !p.aiming && (p.invSlots[p.activeSlot].content instanceof RangedWeapon || p.invSlots[p.activeSlot].content instanceof MagicWeapon);
				}
			},
			{
				type: "progression",
				id: "aim-weapons-3",
				text: "and then press up or down to aim",
				nextStageID: "aim-weapons-4",
				completionCriteria: function() {
					return Math.dist(p.aimRot, 0) > 20;
				}
			},
			{
				type: "progression",
				id: "aim-weapons-4",
				text: "then you can release A to shoot",
				nextStageID: "combat",
				completionCriteria: function() { return !io.keys.KeyA && game.tutorial.timeInCurrentStage > FPS; },
				onCompletion: function() {
					game.dungeon.onlyItem().getInstancesOf(MovingWall).max(wall => wall.x).zDir = -0.01;
				}
			},
			{
				type: "progression",
				id: "combat",
				text: "almost done. try fighting this monster for practice.",
				nextStageID: "tutorial-complete",
				completionCriteria: function() { return game.dungeon[game.inRoom].getInstancesOf(Enemy).length === 0; },
			},
			{
				type: "progression",
				id: "tutorial-complete",
				text: "that's all you need to know. good luck!",
				nextStageID: null,
				completionCriteria: function() {
					if(game.tutorial.timeInCurrentStage > FPS) {
						game.transitions.dir = "fade-out";
						game.transitions.color = "rgb(0, 0, 0)";
						game.transitions.nextScreen = "home";
					}
					return false;
				},
			}
		],
		exist: function() {
			game.inRoom = 0, game.theRoom = 0;
			p.update();
			game.dungeon.onlyItem().renderingObjects = [];
			game.dungeon.onlyItem().update(0);
			game.dungeon.onlyItem().display();

			p.x += game.camera.getOffsetX();
			p.y += game.camera.getOffsetY();
			p.display();
			p.x -= game.camera.getOffsetX();
			p.y -= game.camera.getOffsetY();
			p.gui();
			if(p.guiOpen === "inventory") {
				this.displayInventoryOverlay();
			}

			this.displayInfoText();
			this.updateTutorialStage();
			ui.infoBar.exist();
		},
		reset: function() {
			this.stages.forEach(stage => {
				stage.completed = false;
			});
			this.timeInCurrentStage = 0;
			this.currentStageID = "basic-movement";
			this.currentProgressionStageID = "basic-movement";

			p.reset();
			p.clearInventory();
			game.dungeon = [new Room(
				"tutorial",
				[
					new Border("floor", { y: 400 }),
					new Border("wall-to-left", { x: 400 }),
					new Border("wall-to-right", { x: 1700 }),
					new Border("floor-to-right", { x: 700, y: 300 }),

					new MovingWall(400, -4000, 300, 4400),
					new MovingWall(1100, -4000, 300, 4300, 1.1),
					new Chest(900, 300),
					new Spider(1600, 200),
				]
			)];
			game.inRoom = 0, game.theRoom = 0;
			p.addItem(new Sword());
			p.invSlots[3].content = new EnergyStaff();
			p.invSlots[17].content = new Arrow(Infinity);
		},

		currentStageID: "basic-movement",
		getStageByID: function(id) {
			return this.stages.find(stage => stage.id === id);
		},
		getCurrentStage: function() {
			var stage = this.getStageByID(this.currentStageID);
			if(Object.typeof(stage) === "object") {
				return stage;
			}
			else {
				throw new Error("Unknown tutorial stage ID of '" + this.currentStageID + "'");
			}
		},

		updateTutorialStage: function() {
			this.timeInCurrentStage ++;
			var currentStage = this.getCurrentStage();
			if(currentStage.type === "progression") {
				this.currentProgressionStageID = currentStage.id;
				if(currentStage.completionCriteria()) {
					currentStage.completed = true;
					this.currentStageID = currentStage.nextStageID;
					this.timeInCurrentStage = 0;
					if(typeof currentStage.onCompletion === "function") {
						currentStage.onCompletion();
					}
				}
			}
			else if(currentStage.type === "user-correction") {
				if(!currentStage.activationCriteria()) {
					this.currentStageID = this.currentProgressionStageID;
				}
			}
			/* check for old (already completed) stages to go back to if the user messed up */
			this.stages.filter(stage => stage.completed).forEach(stage => {
				if(typeof stage.regressionCriteria === "function" && stage.regressionCriteria()) {
					this.currentStageID = stage.id;
				}
			});
			/* check for other stages (branching off the main linear path) activated to warn the user under special conditions */
			this.stages.filter(stage => stage.type === "user-correction").forEach(stage => {
				if(stage.activationCriteria()) {
					this.currentStageID = stage.id;
				}
			});
		},
		timeInCurrentStage: 0,

		displayInfoText: function() {
			c.fillStyle = "rgb(255, 255, 255)";
			c.font = "100 20px Germania One";
			c.textAlign = "center";
			c.globalAlpha = 1;
			var currentStage = this.getCurrentStage();
			if(typeof currentStage.text === "string") {
				var linesOfText = currentStage.text;
			}
			else if(typeof currentStage.text === "function") {
				var linesOfText = currentStage.text();
			}
			else {
				throw new Error("Tutorial stage with ID of '" + currentStage.id + "'is missing informational text value. Value of '" + currentStage.text + "' is unsupported.");
			}
			linesOfText.split("\n").forEach((text, index) => {
				text = text.trim();
				c.fillText(text, canvas.width / 2, 600 + (index * 40));
			});
		},
		displayInventoryOverlay: function() {
			this.displayInventorySlotsLabel("holding", "items you're holding");
			this.displayInventorySlotsLabel("equip", "items you're wearing");
			this.displayInventorySlotsLabel("storage", "items you have");
		},
		displayInventorySlotsLabel: function(slotType, text) {
			var slots = p.invSlots.filter(slot => slot.type === slotType);

			var left = slots.min(slot => slot.x).x;
			var right = slots.max(slot => slot.x).x + 70;
			var middle = (left + right) / 2;
			var y = slots.max(slot => slot.y).y + 70 + 10;

			const HEIGHT = 20;
			const TEXT_SIZE = 20;
			c.fillStyle = "rgb(255, 255, 255)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.lineWidth = 5;
			c.font = TEXT_SIZE + "px Arial";
			c.textAlign = "center";
			c.strokeLine(left, y, left, y + HEIGHT);
			c.strokeLine(right, y, right, y + HEIGHT);
			c.strokeLine(left, y + HEIGHT, right, y + HEIGHT);
			c.strokeLine(middle, y + HEIGHT, middle, y + (HEIGHT * 2));
			c.fillText(text, middle, y + (HEIGHT * 2) + TEXT_SIZE);
		}
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
						p.x = 0;
						p.y = 0 - p.hitbox.bottom;
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
			var self = this;
			if(this.player === "warrior") {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					function() {
						stickFigure.display(true);
						c.save(); {
							c.translate(self.x + 15, self.y + self.offsetY - 30);
							c.scale(1, 0.65);
							c.rotate(Math.rad(180));
							new Sword().display("attacking");
						} c.restore();
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
			game.dungeon[0].displayImmediately(function() { new Block(-100, 600, 1000, 200).display(); });
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
						game.tutorial.reset();
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
			/* buttons */
			var self = this;
			game.dungeon[game.inRoom].displayImmediately(function() {
				new Block(-100, 600, 1000, 200).display();
				self.warriorButton.displayPlatform();
				self.archerButton.displayPlatform();
				self.mageButton.displayPlatform();
				self.warriorButton.displayStickFigure();
				self.archerButton.displayStickFigure();
				self.mageButton.displayStickFigure();
			});


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
			game.theRoom = 0;
			game.inRoom = 0;
			game.dungeon = [new Room()];
			game.dungeon[0].displayImmediately(function() {
				graphics3D.cube(-Border.OFFSCREEN_BUFFER, canvas.height - 100, canvas.width + (Border.OFFSCREEN_BUFFER * 2), Border.LARGE_NUMBER, 0.9, 1.1);
			});

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
				if(item instanceof MagicWeapon && (p.mana > item.manaCost || p.health > item.hpCost)) {
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
				if(item instanceof Barricade && Barricade.canBarricadeDoor()) {
					this.actions.a = "barricade door";
				}
				if(p.aiming) {
					this.actions.upDown = "aim";
					if(item instanceof MagicWeapon && !game.dungeon[game.inRoom].getInstancesOf(MagicCharge).some(charge => charge.beginAimed)) {
						this.actions.upDown = null;
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
		},

		exist: function() {
			this.calculateActions();
			this.display();
			this.resetActions();
		}
	}
};

utils.initializer.initializeEverything();

var p = new Player();
p.loadScores();

/** FRAMES **/
function timer() {
	c.globalAlpha = 1;
	io.cursor = "auto";
	utils.frameCount ++;
	utils.resizeCanvas();
	c.fillCanvas("rgb(100, 100, 100)");

	game.exist();

	if(debugging.settings.DEBUGGING_MODE) {
		if(debugging.settings.INFINITE_HEALTH) {
			p.health = p.maxHealth;
			p.mana = p.maxMana;
		}
		if(debugging.settings.ABILITY_KEYS) {
			debugging.keyAbilities.checkForKeyAbilities();
		}
		if(debugging.settings.SHOW_FPS) {
			debugging.fps.display();
			if(utils.frameCount % 10 === 0) {
				debugging.fps.recalculate();
			}
		}
	}
	utils.pastInputs.update();
	document.body.style.cursor = io.cursor;
};

window.setInterval(timer, 1000 / FPS);
