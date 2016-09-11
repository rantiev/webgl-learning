(function () {
	var raWebGL;
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
	var currentlyPressedKeys = {};
	var elapsed = 0;

	function initBuffers() {
		cubeVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		cubeVertexPositionBuffer.itemSize = 3;
		cubeVertexPositionBuffer.numItems = 4;

		cubeVertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
		cubeVertexIndexBuffer.itemSize = 1;
		cubeVertexIndexBuffer.numItems = 36;

		cubeVertexNormalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
		cubeVertexNormalBuffer.itemSize = 3;
		cubeVertexNormalBuffer.numItems = 24;

/*		cubeVertexColorBuffer = gl.createBuffer();
		cubeVertexColorBuffer.itemSize = 4;
		cubeVertexColorBuffer.numItems = 24;*/

		cubeVertexTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		cubeVertexTextureCoordBuffer.itemSize = 2;
		cubeVertexTextureCoordBuffer.numItems = 24;
	}

	function draw() {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
		mat4.identity(mvMatrix);

		xRot += (xSpeed * elapsed) / 1000.0;
		yRot += (ySpeed * elapsed) / 1000.0;

		mat4.translate(mvMatrix, [0.0, 0.0, camDistance]);
		raWebGL.mvPushMatrix();

		mat4.rotate(mvMatrix, raWebGL.degToRad(xRot), [1, 0, 0]);
		mat4.rotate(mvMatrix, raWebGL.degToRad(yRot), [0, 1, 0]);

		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

/*		var colors = [];
		var finishedNumber = 0;

		vertextColorsAnimation.forEach(function (item) {

			item.r = changeProp(item.r);
			item.g = changeProp(item.g);
			item.b = changeProp(item.b);
			item.o = changeProp(item.o);

			if (item.r.finished && item.g.finished && item.b.finished && item.o.finished) {
				item.finished = true;
				finishedNumber++;
			}

			colors.push(item.r.current, item.g.current, item.b.current, item.o.current);
		});

		if (finishedNumber === 4) {
			vertextColorsAnimation.forEach(function (item) {
				item.finished = false;
				item.r.finished = false;
				item.g.finished = false;
				item.b.finished = false;
				item.o.finished = false;
			});
			finishedNumber = 0;
		}

		var colorsFull = [];

		while (colorsFull.length < 24 * 4) {
			colorsFull = colorsFull.concat(colors);
		}*/

/*		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsFull), gl.STATIC_DRAW);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);*/

		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textures[filter]);
		gl.uniform1i(shaderProgram.samplerUniform, 0);

		var lighting = document.getElementById("lighting").checked;
		gl.uniform1i(shaderProgram.useLightingUniform, lighting);

		if (lighting) {

			gl.uniform3f(
				shaderProgram.ambientColorUniform,
				parseFloat(document.getElementById("ambientR").value),
				parseFloat(document.getElementById("ambientG").value),
				parseFloat(document.getElementById("ambientB").value)
			);

			var lightingDirection = [
				parseFloat(document.getElementById("lightDirectionX").value),
				parseFloat(document.getElementById("lightDirectionY").value),
				parseFloat(document.getElementById("lightDirectionZ").value)
			];

			var adjustedLD = vec3.create();

			vec3.normalize(lightingDirection, adjustedLD);
			vec3.scale(adjustedLD, -1);

			gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
			gl.uniform3f(
				shaderProgram.directionalColorUniform,
				parseFloat(document.getElementById("directionalR").value),
				parseFloat(document.getElementById("directionalG").value),
				parseFloat(document.getElementById("directionalB").value)
			);

		}

		var blending = document.getElementById("blending").checked;

		if (blending) {
			gl.disable(gl.DEPTH_TEST);
			gl.enable(gl.BLEND);
			gl.uniform1f(shaderProgram.alphaUniform, parseFloat(document.getElementById("alpha").value));
		} else {
			gl.disable(gl.BLEND);
			gl.enable(gl.DEPTH_TEST);
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
		raWebGL.setMatrixUniforms();
		gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		raWebGL.mvPopMatrix();
	}


	function tick(time) {

		if(!time) {
			time = 0;
		}

		elapsed = time - lastTime;
		lastTime = time;

		handleKeys();

		angle += (75 * elapsed) / 1000;

		draw();

		requestAnimationFrame(tick);
	}


	function handleKeys() {
		var keys = raWebGL.currentlyPressedKeys;

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


	function init() {

		raWebGL = new RaWebGL();
		gl = raWebGL.gl;
		shaderProgram = raWebGL.shaderProgram;

		initBuffers();
		raWebGL.initTextures(textureSrc);

		setTimeout(function () {
			tick();
		}, 10);
	}

	window.raWebGLInstance = {
		init: init
	};

})();