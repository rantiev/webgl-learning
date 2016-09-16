(function () {
	var ragl;
	var gl;
	var shaderProgram;

	var effectiveFPMS = 60 / 100;
	var zoom = -15;
	var tilt = 90;
	var spin = 0;

	var nStars = 30;
	var stars = [];

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

	function Star (startDistance, speedRotation) {
		var o = this;

		o.angle = 0;
		o.dist = 0;
		o.speedRotation = speedRotation;

		o.randomizeColors();
	}

	Star.prototype.draw = function () {
		var o = this;

		ragl.mvPushMatrix();

		mat4.rotate(ragl.mvMatrix, ragl.degToRad(o.angle), [0.0, 1.0, 0.0]);
		mat4.translate(ragl.mvMatrix, [o.dist, 0.0, 0.0]);

		mat4.rotate(ragl.mvMatrix, ragl.degToRad(-o.angle), [0.0, 1.0, 0.0]);
		mat4.rotate(ragl.mvMatrix, ragl.degToRad(-tilt), [1.0, 0.0, 0.0]);

		//mat4.rotate(ragl.mvMatrix, ragl.degToRad(spin), [0.0, 0.0, 1.0]);

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

		//o.angle += o.speedRotation * effectiveFPMS * ragl.elapsed;
		o.dist += 0.01 * effectiveFPMS  * ragl.elapsed;

		if (o.dist > 10.0) {
			o.dist = 0.0;
			o.randomizeColors();
		}
	};

	Star.prototype.randomizeColors = function () {
		var o = this;

		o.r = Math.random();
		o.g = Math.random();
		o.b = Math.random();
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

		for (var i = 0; i < nStars; i++) {
			var star = new Star(i / nStars * 5.0, i / nStars);
			star.angle = i * 360/* * Math.PI*/ / nStars/* / 180*/;
			stars.push(star);
		}

	}

	function draw () {

		mat4.identity(ragl.mvMatrix);
		mat4.translate(ragl.mvMatrix, [0.0, 0.0, zoom]);
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

})();