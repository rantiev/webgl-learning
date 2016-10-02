(function() {
	'use strict';

	function RaWebGL (options, handleKeysFunction, drawFunction) {
		var o = this;

		o.defaults = {
			enableTextures: true
		};

		o.options = Object.assign({}, o.defaults, options);

		o.d = document;
		o.canvas = null;

		o.gl = null;
		o.shaderProgram = null;

		o.mvMatrix = null;
		o.mvMatrixStack = null;

		o.pMatrix = mat4.create();
		o.mvMatrix = mat4.create();

		o.blending = true;

		o.mvMatrixStack = [];

		if (o.options.enableTextures) {
			o.textures = [];
		}

		o.filter = 0;
		o.elapsed = 0;
		o.lastTime = 0;

		o.drawFunction = drawFunction;
		o.handleKeysFunction = handleKeysFunction;
		o.currentlyPressedKeys = {};

		o.init();
	}

	RaWebGL.prototype.getWebGLContext = function () {
		var o = this;

		try {
			return o.canvas.getContext('webgl') || o.canvas.getContext('experimenal-webgl');
		} catch (e) {
			alert('Unable to initialize WebGL. Your browser may not support it.');
			return null;
		}
	};

	RaWebGL.prototype.initGL = function () {
		var o = this;
		o.canvas = document.querySelector('#raCanvas');

		if (o.canvas) {

			o.gl = o.getWebGLContext(o.canvas);

			if (!o.gl) {
				return;
			}

			o.gl.viewportWidth = o.canvas.width;
			o.gl.viewportHeight = o.canvas.height;
		}
	};

	RaWebGL.prototype.getShader = function (id) {
		var o = this;

		var shaderScript = document.getElementById(id);
		if (!shaderScript) {
			return null;
		}

		var str = '';
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) {
				str += k.textContent;
			}
			k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == 'x-shader/x-fragment') {
			shader = o.gl.createShader(o.gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == 'x-shader/x-vertex') {
			shader = o.gl.createShader(o.gl.VERTEX_SHADER);
		} else {
			return null;
		}

		o.gl.shaderSource(shader, str);
		o.gl.compileShader(shader);

		if (!o.gl.getShaderParameter(shader, o.gl.COMPILE_STATUS)) {
			alert(o.gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	};

	RaWebGL.prototype.initShaders = function () {
		var o = this;

		var fragmentShader = o.getShader('shader-fs');
		var vertexShader = o.getShader('shader-vs');

		o.shaderProgram = o.gl.createProgram();
		o.gl.attachShader(o.shaderProgram, vertexShader);
		o.gl.attachShader(o.shaderProgram, fragmentShader);
		o.gl.linkProgram(o.shaderProgram);

		if (!o.gl.getProgramParameter(o.shaderProgram, o.gl.LINK_STATUS)) {
			alert('Could not initialise shaders');
		}

		o.gl.useProgram(o.shaderProgram);

		o.shaderProgram.vertexPositionAttribute = o.gl.getAttribLocation(o.shaderProgram, "aVertexPosition");
		o.gl.enableVertexAttribArray(o.shaderProgram.vertexPositionAttribute);

		o.shaderProgram.vertexColorAttribute = o.gl.getAttribLocation(o.shaderProgram, "aVertexColor");
		o.gl.enableVertexAttribArray(o.shaderProgram.vertexColorAttribute);

		if (o.options.enableTextures) {
			o.shaderProgram.textureCoordAttribute = o.gl.getAttribLocation(o.shaderProgram, "aTextureCoord");
			o.gl.enableVertexAttribArray(o.shaderProgram.textureCoordAttribute);
		}

		o.shaderProgram.pMatrixUniform = o.gl.getUniformLocation(o.shaderProgram, "uPMatrix");
		o.shaderProgram.mvMatrixUniform = o.gl.getUniformLocation(o.shaderProgram, "uMVMatrix");
		o.shaderProgram.samplerUniform = o.gl.getUniformLocation(o.shaderProgram, "uSampler");
		o.shaderProgram.colorUniform = o.gl.getUniformLocation(o.shaderProgram, "uColor");

	};

	RaWebGL.prototype.addTextures = function () {
		var o = this;

		o.gl.activeTexture(o.gl.TEXTURE0);
		o.gl.bindTexture(o.gl.TEXTURE_2D, o.textures[o.filter]);
		o.gl.uniform1i(o.shaderProgram.samplerUniform, 0);
	};

	RaWebGL.prototype.addLightning = function () {
		var o = this;

		var lighting = document.getElementById('lighting').checked;
		o.gl.uniform1i(o.shaderProgram.useLightingUniform, lighting);

		if (lighting) {

			o.gl.uniform3f(
				o.shaderProgram.ambientColorUniform,
				parseFloat(document.getElementById('ambientR').value),
				parseFloat(document.getElementById('ambientG').value),
				parseFloat(document.getElementById('ambientB').value)
			);

			var lightingDirection = [
				parseFloat(document.getElementById('lightDirectionX').value),
				parseFloat(document.getElementById('lightDirectionY').value),
				parseFloat(document.getElementById('lightDirectionZ').value)
			];

			var adjustedLD = vec3.create();

			vec3.normalize(lightingDirection, adjustedLD);
			vec3.scale(adjustedLD, -1);

			o.gl.uniform3fv(o.shaderProgram.lightingDirectionUniform, adjustedLD);
			o.gl.uniform3f(
				o.shaderProgram.directionalColorUniform,
				parseFloat(document.getElementById('directionalR').value),
				parseFloat(document.getElementById('directionalG').value),
				parseFloat(document.getElementById('directionalB').value)
			);

		}
	};

	RaWebGL.prototype.addBlending = function () {
		var o = this;

		o.gl.blendFunc(o.gl.SRC_ALPHA, o.gl.ONE);
		o.gl.enable(o.gl.BLEND);
	};

	RaWebGL.prototype.initTextures = function (src) {
		var o = this;
		var textureImage = new Image();

		var texture = o.gl.createTexture();
		texture.image = textureImage;
		o.textures.push(texture);

		textureImage.onload = function () {
			o.handleLoadedTexture();
		};

		textureImage.src = src;
	};

	RaWebGL.prototype.handleLoadedTexture = function() {
		var o = this;

		o.gl.pixelStorei(o.gl.UNPACK_FLIP_Y_WEBGL, true);
		o.gl.bindTexture(o.gl.TEXTURE_2D, o.textures[0]);
		o.gl.texImage2D(o.gl.TEXTURE_2D, 0, o.gl.RGBA, o.gl.RGBA, o.gl.UNSIGNED_BYTE, o.textures[0].image);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MAG_FILTER, o.gl.LINEAR);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MIN_FILTER, o.gl.LINEAR);
		o.gl.bindTexture(o.gl.TEXTURE_2D, null);

		console.log('texture loaded');
	};

	RaWebGL.prototype.degToRad = function (d) {
		return d * Math.PI / 180;
	};

	RaWebGL.prototype.mvPushMatrix = function () {
		var o = this;
		var copy = mat4.create();

		mat4.set(o.mvMatrix, copy);
		o.mvMatrixStack.push(copy);
	};

	RaWebGL.prototype.mvPopMatrix = function() {
		var o = this;

		if (o.mvMatrixStack.length == 0) {
			throw 'Invalid popMatrix!';
		}
		o.mvMatrix = o.mvMatrixStack.pop();
	};

	RaWebGL.prototype.setMatrixUniforms = function () {
		var o = this;

		o.gl.uniformMatrix4fv(o.shaderProgram.pMatrixUniform, false, o.pMatrix);
		o.gl.uniformMatrix4fv(o.shaderProgram.mvMatrixUniform, false, o.mvMatrix);
	};

	RaWebGL.prototype.handleKeyDown = function (e) {
		var o = this;

		o.currentlyPressedKeys[e.keyCode] = true;
	};

	RaWebGL.prototype.handleKeyUp = function (e) {
		var o = this;

		o.currentlyPressedKeys[e.keyCode] = false;
	};

	RaWebGL.prototype.setupKeysHandlers = function () {
		var o = this;

		o.d.onkeydown = o.handleKeyDown.bind(o);
		o.d.onkeyup = o.handleKeyUp.bind(o);
	};

	RaWebGL.prototype.setupGL = function () {
		var o = this;

		o.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	};

	RaWebGL.prototype.handleKeys = function () {
		var o = this;

		o.handleKeysFunction();
	};

	RaWebGL.prototype.draw = function () {
		var o = this;

		o.gl.viewport(0, 0, o.gl.viewportWidth, o.gl.viewportHeight);
		o.gl.clear(o.gl.COLOR_BUFFER_BIT | o.gl.DEPTH_BUFFER_BIT);

		mat4.perspective(45, o.gl.viewportWidth / o.gl.viewportHeight, 0.1, 100.0, o.pMatrix);

		o.addBlending();

		o.drawFunction();
	};

	RaWebGL.prototype.tick = function (time) {
		var o = this;

		if(!time) {
			time = 0;
		}

		o.elapsed = time - o.lastTime;
		o.lastTime = time;

		requestAnimationFrame(o.tick);

		o.draw();
		o.handleKeys();
	};

	RaWebGL.prototype.setupDrawCycle = function () {
		var o = this;

		o.tick = o.tick.bind(o);

		setTimeout(function() {
			o.tick();
		}, 1000);
	};

	RaWebGL.prototype.init = function () {
		var o = this;

		o.initGL();
		o.initShaders();
		o.setupGL();
		o.setupKeysHandlers();
		o.setupDrawCycle();
	};

	window.RaWebGL = RaWebGL;

})();