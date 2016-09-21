(function () {
	var ragl;
	var gl;
	var shaderProgram;

	var zoom = -15;
	var tilt = 90;
	var spin = 0;

	var mainPosition = {
		x: 0,
		y: 0,
		z: 0
	};

	var deviation = 5;

	var distanceFrom = 0;
	var distanceTo = 10;
	var duration = 1400;

	var opacityFrom = 1;
	var opacityTo = 0;
	var durationOpacity = 35000;

	var nStars = 12;
	var stars = [];

	var currentColor = {};
	var currentDist = 0;
	var currentOpacity = 1;
	var currentTime = 0;
	var timeStarted = 0;

	var textureSrc = '../img/star.gif';

	var vertices = [
		-1.1, -1.1,  0.0,
		1.1, -1.1,  0.0,
		-1.1,  1.1,  0.0,
		1.1,  1.1,  0.0
	];

	var textureCoords = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

	var starVertexPositionBuffer;
	var starVertexTextureCoordBuffer;

	function Star (startDistance, color, speedRotation) {
		var o = this;

		o.angle = 0;
		o.dist = startDistance;
		o.speedRotation = speedRotation;

		o.setColor(color);
	}

	Star.prototype.draw = function () {
		var o = this;

		ragl.mvPushMatrix();

		mat4.rotate(ragl.mvMatrix, ragl.degToRad(o.angle), [0.0, 1.0, 0.0]);
		mat4.translate(ragl.mvMatrix, [o.dist + o.c, 0.0, 0.0]);

		mat4.rotate(ragl.mvMatrix, ragl.degToRad(-o.angle), [0.0, 1.0, 0.0]);
		mat4.rotate(ragl.mvMatrix, ragl.degToRad(-tilt), [1.0, 0.0, 0.0]);

		mat4.rotate(ragl.mvMatrix, ragl.degToRad(spin), [0.0, 0.0, 1.0]);

		gl.uniform3f(shaderProgram.colorUniform, o.r, o.g, o.b);

		ragl.addTextures();

		gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, starVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, starVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		ragl.setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, starVertexPositionBuffer.numItems);

		ragl.mvPopMatrix();

	};

	Star.prototype.animate = function () {
		var o = this;
		o.dist = currentDist;

		if (currentTime > duration) {
			o.dist = 0.0;
		}

		o.setColor(currentColor);
	};

	Star.prototype.randomizeColors = function () {
		var o = this;
		var c = {
			r: Math.random(),
			g: Math.random(),
			b: Math.random()
		};

		o.r = c.r;
		o.g = c.g;
		o.b = c.b;

		return c;
	};

	Star.prototype.setColor = function (c) {
		var o = this;

		o.r = c.r;
		o.g = c.g;
		o.b = c.b;
	};

	function initBuffers() {
		starVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		starVertexPositionBuffer.itemSize = 3;
		starVertexPositionBuffer.numItems = 4;

		starVertexTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		starVertexTextureCoordBuffer.itemSize = 2;
		starVertexTextureCoordBuffer.numItems = 4;
	}

	function createStars () {

		timeStarted = performance.now();

		var currentColor = {
			r: 1,
			g: 1,
			b: 1
		};

		for (var i = 0; i < nStars; i++) {
			var star = new Star(i / nStars * 5.0, currentColor, i / nStars);
			star.angle = i * 360 / nStars;
			star.sin = Math.sin(ragl.degToRad(star.angle)).toFixed(2);
			star.c = star.angle > 0 && star.angle <= 180 ? -1 * star.sin : -star.sin;
			star.c *= 2;
			stars.push(star);
		}

	}

	function draw () {

		currentTime = ragl.lastTime - timeStarted;
		currentOpacity = easeOutCubic(currentTime, opacityFrom, opacityTo - opacityFrom, durationOpacity);
		currentDist = easeOutCubic(currentTime, distanceFrom, distanceTo - distanceFrom, duration);

		if (currentColor.r) {
			currentColor.r *= currentOpacity;
			currentColor.g *= currentOpacity;
			currentColor.b *= currentOpacity;
		}

		if (currentTime > duration) {
			currentDist = 0;
			currentOpacity = 1;
			currentColor = Star.prototype.randomizeColors.call({});
			timeStarted = performance.now();

			mainPosition = {
				x: Math.random() * deviation - deviation / 2,
				y: Math.random() * deviation - deviation / 2,
				z: zoom + Math.random() * deviation - deviation / 2
			}

		}

		mat4.identity(ragl.mvMatrix);
		mat4.translate(ragl.mvMatrix, [0.0, 0.0, zoom]);

		mat4.translate(ragl.mvMatrix, [mainPosition.x, mainPosition.y, zoom + mainPosition.z]);

		mat4.rotate(ragl.mvMatrix, ragl.degToRad(tilt), [1.0, 0.0, 0.0]);

		stars.forEach(function(item){
			item.draw();
			item.animate();

			spin += 0.1;
		});

	}

	function handleKeys() {
		var keys = ragl.currentlyPressedKeys;
		
		if (keys[33]) {
			// Page Up
			zoom -= 0.1;
		}

		if (keys[34]) {
			// Page Down
			zoom += 0.1;
		}

		if (keys[38]) {
			// Up cursor key
			tilt += 2;
		}

		if (keys[40]) {
			// Down cursor key
			tilt -= 2;
		}
	}

	ragl = new RaWebGL(draw, handleKeys);
	gl = ragl.gl;
	shaderProgram = ragl.shaderProgram;
	initBuffers();

	ragl.initTextures(textureSrc);

	createStars();

	ragl.setupDrawCycle();

	function easeOutCubic (t, b, c, d) {
		t /= d;
		t--;
		return c*(t*t*t + 1) + b;
	}

	function easeInCubic (t, b, c, d) {
		t /= d;
		return c*t*t*t + b;
	};

})();