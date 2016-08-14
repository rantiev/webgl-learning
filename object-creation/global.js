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

	function initBuffers() {
		var vertices = [
			1.0,  1.0,  0.0,
			-1.0, 1.0,  0.0,
			1.0,  -1.0, 0.0,
			-1.0, -1.0, 0.0
		];

		squareVerticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		var colors = [
			1.0,  0.0,  1.0,  1.0,    // pink
			1.0,  0.0,  0.0,  1.0,    // red
			0.0,  1.0,  1.0,  1.0,    // green
			0.0,  0.0,  1.0,  1.0     // blue
		];

		squareVerticesColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	}

	function drawScene() {
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
			initBuffers();
			drawScene();

		}

	}

	window.raWebGL = {
		init: init
	};

})();