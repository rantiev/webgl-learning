(function () {
	var o;
	var gl;
	var shaderProgram;

	var angle = 0;
	var textureSrc = '../img/glass.gif';
	var textures = [];
	var filter = 0;
	var camDistance = -7;
	var xSpeed = 0;
	var ySpeed = 0;
	var xRot = 0;
	var yRot = 0;

	function initBuffers() {

	}

	function draw() {
		angle += (75 * o.elapsed) / 1000;

		xRot += (xSpeed * o.elapsed) / 1000.0;
		yRot += (ySpeed * o.elapsed) / 1000.0;

		mat4.translate(o.mvMatrix, [0.0, 0.0, camDistance]);
		o.mvPushMatrix();

		mat4.rotate(o.mvMatrix, o.degToRad(xRot), [1, 0, 0]);
		mat4.rotate(o.mvMatrix, o.degToRad(yRot), [0, 1, 0]);


		o.addTextures();
		o.addLightning();
		o.addBlending();


		o.setMatrixUniforms();


	}

	function handleKeys() {
		var keys = o.currentlyPressedKeys;

		if (keys[33]) {
			// Page Up
			camDistance -= 0.05;
		}

		if (keys[34]) {
			// Page Down
			camDistance += 0.05;
		}

		if (keys[37]) {
			// Left cursor key
			ySpeed -= 1;
		}

		if (keys[39]) {
			// Right cursor key
			ySpeed += 1;
		}

		if (keys[38]) {
			// Up cursor key
			xSpeed -= 1;
		}

		if (keys[40]) {
			// Down cursor key
			xSpeed += 1;
		}
	}


	o = new RaWebGL(draw, handleKeys);
	gl = o.gl;
	shaderProgram = o.shaderProgram;

	initBuffers();
	o.initTextures(textureSrc);

})();