(function() {
	'use strict';

	function RaWebGl () {
		var o = this;

		o.canvas = null;
		o.gl = null;
		o.shaderProgram = null;

		o.init();
	}

	RaWebGl.prototype.getWebGLContext = function () {
		var o = this;

		try {
			return o.canvas.getContext('webgl') || o.canvas.getContext('experimenal-webgl');
		} catch (e) {
			alert('Unable to initialize WebGL. Your browser may not support it.');
			return null;
		}
	};

	RaWebGl.prototype.initGL = function () {
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

	RaWebGl.prototype.getShader = function (id) {
		var o = this;

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
			shader = o.gl.createShader(o.gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
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

	RaWebGl.prototype.initShaders = function () {
		var o = this;

		var fragmentShader = o.getShader("shader-fs");
		var vertexShader = o.getShader("shader-vs");

		o.shaderProgram = o.gl.createProgram();
		o.gl.attachShader(o.shaderProgram, vertexShader);
		o.gl.attachShader(o.shaderProgram, fragmentShader);
		o.gl.linkProgram(o.shaderProgram);

		if (!o.gl.getProgramParameter(o.shaderProgram, o.gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		o.gl.useProgram(o.shaderProgram);

		o.shaderProgram.vertexPositionAttribute = o.gl.getAttribLocation(o.shaderProgram, "aVertexPosition");
		o.gl.enableVertexAttribArray(o.shaderProgram.vertexPositionAttribute);

		/*		shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		 gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);*/

		o.shaderProgram.vertexNormalAttribute = o.gl.getAttribLocation(o.shaderProgram, "aVertexNormal");
		o.gl.enableVertexAttribArray(o.shaderProgram.vertexNormalAttribute);

		o.shaderProgram.textureCoordAttribute = o.gl.getAttribLocation(o.shaderProgram, "aTextureCoord");
		o.gl.enableVertexAttribArray(o.shaderProgram.textureCoordAttribute);

		o.shaderProgram.pMatrixUniform = o.gl.getUniformLocation(o.shaderProgram, "uPMatrix");
		o.shaderProgram.mvMatrixUniform = o.gl.getUniformLocation(o.shaderProgram, "uMVMatrix");
		o.shaderProgram.nMatrixUniform = o.gl.getUniformLocation(o.shaderProgram, "uNMatrix");
		o.shaderProgram.samplerUniform = o.gl.getUniformLocation(o.shaderProgram, "uSampler");
		o.shaderProgram.useLightingUniform = o.gl.getUniformLocation(o.shaderProgram, "uUseLighting");
		o.shaderProgram.lightingDirectionUniform = o.gl.getUniformLocation(o.shaderProgram, "uLightingDirection");
		o.shaderProgram.ambientColorUniform = o.gl.getUniformLocation(o.shaderProgram, "uAmbientColor");
		o.shaderProgram.directionalColorUniform = o.gl.getUniformLocation(o.shaderProgram, "uDirectionalColor");
		o.shaderProgram.alphaUniform = o.gl.getUniformLocation(o.shaderProgram, "uAlpha");
	};

	RaWebGl.prototype.initTextures = function (src) {
		var o = this;
		var textureImage = new Image();

		for (var i=0; i < 3; i++) {
			var texture = o.gl.createTexture();
			texture.image = textureImage;
			o.textures.push(texture);
		}

		textureImage.onload = function () {
			o.handleLoadedTexture(o.textures);
		};

		textureImage.src = src;
	};

	RaWebGl.prototype.handleLoadedTexture = function(textures) {
		var o = this;

		o.gl.pixelStorei(o.gl.UNPACK_FLIP_Y_WEBGL, true);

		o.gl.bindTexture(o.gl.TEXTURE_2D, textures[0]);
		o.gl.texImage2D(o.gl.TEXTURE_2D, 0, o.gl.RGBA, o.gl.RGBA, o.gl.UNSIGNED_BYTE, textures[0].image);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MAG_FILTER, o.gl.NEAREST);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MIN_FILTER, o.gl.NEAREST);

		o.gl.bindTexture(o.gl.TEXTURE_2D, textures[1]);
		o.gl.texImage2D(o.gl.TEXTURE_2D, 0, o.gl.RGBA, o.gl.RGBA, o.gl.UNSIGNED_BYTE, textures[1].image);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MAG_FILTER, o.gl.LINEAR);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MIN_FILTER, o.gl.LINEAR);

		o.gl.bindTexture(o.gl.TEXTURE_2D, textures[2]);
		o.gl.texImage2D(o.gl.TEXTURE_2D, 0, o.gl.RGBA, o.gl.RGBA, o.gl.UNSIGNED_BYTE, textures[2].image);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MAG_FILTER, o.gl.LINEAR);
		o.gl.texParameteri(o.gl.TEXTURE_2D, o.gl.TEXTURE_MIN_FILTER, o.gl.LINEAR_MIPMAP_NEAREST);
		o.gl.generateMipmap(o.gl.TEXTURE_2D);

		o.gl.bindTexture(o.gl.TEXTURE_2D, null);
	}

	RaWebGl.prototype.degToRad = function (d) {
		return d * Math.PI / 180;
	};

	RaWebGl.prototype.setup = function () {
		var o = this;

		o.gl.enable(o.gl.DEPTH_TEST);
		o.gl.depthFunc(o.gl.LESS);
		o.gl.blendFunc(o.gl.SRC_ALPHA, o.gl.ONE);
		o.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	};

	RaWebGl.prototype.init = function () {
		var o = this;

		o.initGL();
		o.initShaders();
		o.setup();
	};

	window.RaWebGL = RaWebGl;

})();