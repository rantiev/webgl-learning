(function () {
	var raWebGL;
	var gl;
	var shaderProgram;
	var cubeVertexPositionBuffer;
	var cubeVertexColorBuffer;
	var cubeVertexIndexBuffer;
	var cubeVertexNormalBuffer;
	var cubeVertexTextureCoordBuffer;
	var pMatrix = mat4.create();
	var mvMatrix = mat4.create();
	var mvMatrixStack = [];
	var lastTime = 0;
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

	var vertices = [
		// Front face
		-1.0, -1.0, 1.0,
		-1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, -1.0, 1.0,

		// Back face
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, -1.0, -1.0,

		// Left face
		-1.0, -1.0, 1.0,
		-1.0, 1.0, 1.0,
		-1.0, 1.0, -1.0,
		-1.0, -1.0, -1.0,

		// Right face
		1.0, -1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0, -1.0,
		1.0, -1.0, -1.0,

		// Top face
		-1.0, 1.0, 1.0,
		-1.0, 1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, 1.0, 1.0,

		// Bottom face
		-1.0, -1.0, 1.0,
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, 1.0
	];

	var cubeVertexIndices = [
		0, 1, 2,      0, 2, 3,    // Front face
		4, 5, 6,      4, 6, 7,    // Back face
		8, 9, 10,     8, 10, 11,  // Left face
		12, 13, 14,   12, 14, 15, // Right face
		16, 17, 18,   16, 18, 19, // Top face
		20, 21, 22,   20, 22, 23  // Bottom face
	];

	var vertexNormals = [
		// Front face
		0.0,  0.0,  1.0,
		0.0,  0.0,  1.0,
		0.0,  0.0,  1.0,
		0.0,  0.0,  1.0,

		// Back face
		0.0,  0.0, -1.0,
		0.0,  0.0, -1.0,
		0.0,  0.0, -1.0,
		0.0,  0.0, -1.0,

		// Left face
		-1.0,  0.0,  0.0,
		-1.0,  0.0,  0.0,
		-1.0,  0.0,  0.0,
		-1.0,  0.0,  0.0,

		// Right face
		1.0,  0.0,  0.0,
		1.0,  0.0,  0.0,
		1.0,  0.0,  0.0,
		1.0,  0.0,  0.0,

		// Top face
		0.0,  1.0,  0.0,
		0.0,  1.0,  0.0,
		0.0,  1.0,  0.0,
		0.0,  1.0,  0.0,

		// Bottom face
		0.0, -1.0,  0.0,
		0.0, -1.0,  0.0,
		0.0, -1.0,  0.0,
		0.0, -1.0,  0.0


	];

	var vertextColorsAnimation = [
		{
			r: {
				from: 1,
				to: 0
			},
			g: {
				from: 0,
				to: 1
			},
			b: {
				from: 0,
				to: 0.5
			},
			o: {
				from: 1,
				to: 1
			}
		},
		{
			r: {
				from: 0,
				to: 0
			},
			g: {
				from: 1,
				to: 0
			},
			b: {
				from: 0,
				to: 0
			},
			o: {
				from: 1,
				to: 1
			}
		},
		{
			r: {
				from: 0.5,
				to: 0
			},
			g: {
				from: 0.5,
				to: 0
			},
			b: {
				from: 1,
				to: 0.2
			},
			o: {
				from: 1,
				to: 1
			}
		},
		{
			r: {
				from: 1,
				to: 0.5
			},
			g: {
				from: 1,
				to: 0
			},
			b: {
				from: 1,
				to: 0.5
			},
			o: {
				from: 1,
				to: 1
			}
		}
	];

	var textureCoords = [
		// Front face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,

		// Back face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,

		// Top face
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,

		// Bottom face
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,

		// Right face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,

		// Left face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
	];

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
		mvPushMatrix();

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
		setMatrixUniforms();
		gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		mvPopMatrix();
	}

	function translate() {
		angle += (75 * elapsed) / 1000;
	}

	function changeProp (prop) {
		var newProp = prop;

		if (newProp.current === undefined) {
			newProp.current = newProp.from;
			newProp.direction = newProp.from > newProp.to ? true : false;
			newProp.min = Math.min(newProp.from, newProp.to);
			newProp.max = Math.max(newProp.from, newProp.to);
		}

		if(!newProp.finished) {
			if(newProp.from === newProp.to) {
				newProp.finished = true;
			} else {

				newProp.current = newProp.direction ? newProp.current - 0.01 : newProp.current + 0.01;
				newProp.current = parseFloat(newProp.current.toFixed(3));

				if (newProp.current >= newProp.max) {
					newProp.current = newProp.max;
					newProp.finished = true;
					newProp.direction = !newProp.direction;
				} else if (newProp.current <= newProp.min) {
					newProp.current = newProp.min;
					newProp.finished = true;
					newProp.direction = !newProp.direction;
				}

			}
		}

		return newProp;
	}

	function tick(time) {

		if(!time) {
			time = 0;
		}

		elapsed = time - lastTime;
		lastTime = time;

		handleKeys();
		translate();
		draw();

		requestAnimationFrame(tick);
	}

	function setMatrixUniforms() {
		gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

		var normalMatrix = mat3.create();
		mat4.toInverseMat3(mvMatrix, normalMatrix);
		mat3.transpose(normalMatrix);
		gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
	}

	function mvPushMatrix() {
		var copy = mat4.create();
		mat4.set(mvMatrix, copy);
		mvMatrixStack.push(copy);
	}

	function mvPopMatrix() {
		if (mvMatrixStack.length == 0) {
			throw "Invalid popMatrix!";
		}
		mvMatrix = mvMatrixStack.pop();
	}

	function handleKeyDown(event) {
		currentlyPressedKeys[event.keyCode] = true;

		if (String.fromCharCode(event.keyCode) == "F") {
			filter += 1;
			if (filter == 3) {
				filter = 0;
			}
		}
	}

	function handleKeyUp(event) {
		currentlyPressedKeys[event.keyCode] = false;
	}

	function handleKeys() {
		if (currentlyPressedKeys[33]) {
			// Page Up
			camDistance -= 0.05;
		}
		if (currentlyPressedKeys[34]) {
			// Page Down
			camDistance += 0.05;
		}
		if (currentlyPressedKeys[37]) {
			// Left cursor key
			ySpeed -= 1;
		}
		if (currentlyPressedKeys[39]) {
			// Right cursor key
			ySpeed += 1;
		}
		if (currentlyPressedKeys[38]) {
			// Up cursor key
			xSpeed -= 1;
		}
		if (currentlyPressedKeys[40]) {
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

		document.onkeydown = handleKeyDown;
		document.onkeyup = handleKeyUp;

		setTimeout(function () {
			tick();
		}, 10);
	}

	window.raWebGLInstance = {
		init: init
	};

})();