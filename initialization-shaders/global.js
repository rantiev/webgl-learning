(function () {

	var o = {};
	var _o = {
		selectors: {
			canvas: '#raCanvas'
		},
		canvas: null,
		gl: null
	};

	function getContext(canvas) {

		try {
			return canvas.getContext('webgl') || canvas.getContext('experimenal-webgl');
		} catch(e) {}

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

		while(currentChild) {
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
		var shaderFs = getShader(_o.gl, 'shader-fs');
		var shaderVs = getShader(_o.gl, 'shader-vs');
		var shaderProgram = _o.gl.createProgram();

		_o.gl.attachShader(shaderProgram, shaderFs);
		_o.gl.attachShader(shaderProgram, shaderVs);
		_o.gl.linkProgram(shaderProgram);

		if (!_o.gl.getProgramParameter(shaderProgram, _o.gl.LINK_STATUS)) {
			alert("Unable to initialize the shader program: " + _o.gl.getProgramInfoLog(shaderProgram));
		}

		_o.gl.useProgram(shaderProgram);

		var vertexPositionAttribute = _o.gl.getAttribLocation(shaderProgram, "aVertexPosition");
		_o.gl.enableVertexAttribArray(vertexPositionAttribute);

	}

	function init() {
		_o.canvas = document.querySelector(_o.selectors.canvas);

		if(_o.canvas) {

			_o.gl = getContext(_o.canvas);

			if (!_o.gl) {
				return;
			}

			_o.gl.clearColor(0.0, 0.0, 0.0, 1.0);
			_o.gl.enable(_o.gl.DEPTH_TEST);
			_o.gl.depthFunc(_o.gl.LEQUAL);
			_o.gl.clear(_o.gl.COLOR_BUFFER_BIT|_o.gl.DEPTH_BUFFER_BIT);

			initShaders();

		}

	}

	o.init = init;

	window.RaWebGL = o;

})();