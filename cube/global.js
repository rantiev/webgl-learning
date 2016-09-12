(function () {

	var gl;
	var canvas;
	var cubeVertexPositionBuffer;
	var cubeVertexColorBuffer;
	var cubeVertexIndexBuffer;
	var pMatrix = mat4.create();
	var mvMatrix = mat4.create();
	var mvMatrixStack = [];
	var shaderProgram;
	var lastTime;
	var angle = 0;

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

	/*var colors = [];
	for (var i=0; i < 4; i++) {
		colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
	}*/

	function getContext(canvas) {

		try {
			return canvas.getContext('webgl') || canvas.getContext('experimenal-webgl');
		} catch (e) {

		}

		alert("Unable to initialize WebGL. Your browser may not support it.");
		return null;
	}

	function initGL() {
		canvas = document.querySelector('#raCanvas');

		if (canvas) {

			gl = getContext(canvas);

			if (!gl) {
				return;
			}

			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
		}
	}

	function getShader(gl, id) {
		var shaderScript = document.getElementById(id);
		if (!shaderScript) {
			return null;
		}

		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) {
				str += k.textContent;
			}
			k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			return null;
		}

		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}

	function initShaders() {
		var fragmentShader = getShader(gl, "shader-fs");
		var vertexShader = getShader(gl, "shader-vs");

		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		gl.useProgram(shaderProgram);

		shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

		shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	}

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

		cubeVertexColorBuffer = gl.createBuffer();
		cubeVertexColorBuffer.itemSize = 4;
		cubeVertexColorBuffer.numItems = 24;
	}

	function draw() {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);

		mvPushMatrix();
		mat4.rotate(mvMatrix, degToRad(angle), [1, 1, 1]);

		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		var colors = [];
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
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsFull), gl.STATIC_DRAW);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

		setMatrixUniforms();
		gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		mvPopMatrix();
	}

	function translate() {
		var timeNow = new Date().getTime();
		if (lastTime) {
			var elapsed = timeNow - lastTime;
			angle += (75 * elapsed) / 1000;
		}
		lastTime = timeNow;
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

	function tick() {
		draw();
		translate();

		requestAnimationFrame(tick);
	}

	function setMatrixUniforms() {
		gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
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

	function degToRad(degrees) {
		return degrees * Math.PI / 180;
	}

	function init() {
		initGL();
		initShaders();
		initBuffers();

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);

		tick();
	}

	window.RaWebGL = {
		init: init
	};

})();