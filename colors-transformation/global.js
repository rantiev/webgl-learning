(function () {

	var canvas;
	var gl;
	var vertexPositionAttribute;
	var vertexColorAttribute;
	var squareVerticesBuffer;
	var squareVerticesColorBuffer;
	var mvMatrix;
	var shaderProgram;
	var perspectiveMatrix;

	function getContext(canvas) {

		try {
			return canvas.getContext('webgl') || canvas.getContext('experimenal-webgl');
		} catch (e) {

		}

		alert("Unable to initialize WebGL. Your browser may not support it.");
		return null;
	}

	function getShader(gl, id) {
		var shaderScript, theSource, currentChild, shader;

		shaderScript = document.getElementById(id);

		if (!shaderScript) {
			return null;
		}

		theSource = "";
		currentChild = shaderScript.firstChild;

		while (currentChild) {
			if (currentChild.nodeType == currentChild.TEXT_NODE) {
				theSource += currentChild.textContent;
			}

			currentChild = currentChild.nextSibling;
		}

		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			// Unknown shader type
			return null;
		}

		gl.shaderSource(shader, theSource);

		// Compile the shader program
		gl.compileShader(shader);

		// See if it compiled successfully
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}

	function initShaders() {
		var shaderFs = getShader(gl, 'shader-fs');
		var shaderVs = getShader(gl, 'shader-vs');
		shaderProgram = gl.createProgram();

		gl.attachShader(shaderProgram, shaderFs);
		gl.attachShader(shaderProgram, shaderVs);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
		}

		gl.useProgram(shaderProgram);

		vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(vertexPositionAttribute);

		vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(vertexColorAttribute);

	}

	var timeToPass = 40;
	var timePreviousStep = 0;
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
				newProp.current = parseFloat(newProp.current.toFixed(2));

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


	function drawScene(timestamp) {

		if (timestamp > timePreviousStep + timeToPass) {

			var vertices = [
				1.0, 1.0, 0.0,
				-1.0, 1.0, 0.0,
				1.0, -1.0, 0.0,
				-1.0, -1.0, 0.0
			];

			squareVerticesBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

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

			squareVerticesColorBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);


			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			perspectiveMatrix = makePerspective(45, 640.0 / 480.0, 0.1, 100.0);

			mvMatrix = loadIdentity();
			mvMatrix = mvTranslate([0.0, 0.0, -5.0], mvMatrix);

			gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
			gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
			gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

			setMatrixUniforms(gl, shaderProgram, perspectiveMatrix, mvMatrix);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			timePreviousStep = timestamp;

		}

		requestAnimationFrame(drawScene);
	}

	function init() {
		canvas = document.querySelector('#raCanvas');

		if (canvas) {

			gl = getContext(canvas);

			if (!gl) {
				return;
			}

			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			initShaders();

			drawScene();

		}

	}

	window.RaWebGL = {
		init: init
	};

})
();