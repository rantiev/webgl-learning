(function () {
	var ragl;
	var gl;
	var shaderProgram;

	var textureSrc = '../img/star.gif';

	var textureCoords = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

	var zoom = -15;
	var tilt = 0;
	var spin = 0;

	var gridSize = 10;
	var gridStep = 1;

	var colorBase = {
		r: 0.2,
		g: 0.2,
		b: 0.2
	};

	var halfGrid = gridSize / 2;

	var mainPosition = {
		x: -halfGrid,
		y: -halfGrid,
		z: 0
	};

	var distanceFrom = 0;
	var distanceTo = 10;
	var duration = 100;
	var durationRandomUpdate = 10000;

	var opacityFrom = 1;
	var opacityTo = 0;
	var durationOpacity = 35000;

	var currentDist = 0;
	var currentOpacity = 1;
	var currentTime = 0;
	var timeStarted = 0;
	var timeRandomUpdated = 0;

	var vertices = [];
	var verticesPlaneIndexes = [];
	var verticesColors = [];
	var verticesTextures = [];

	var vertexPositionBuffer;
	var vertexPositionPlainBuffer;
	var vertexColorBuffer;
	var vertexTextureCoordBuffer;

	var vertextColorsAnimation = [];

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

	function createVerticesData() {
		for (var i = 0; i <= gridSize; i += gridStep) {
			for (var j = 0; j <= gridSize; j += gridStep) {
				vertices.push(j, i , 0);
			}
		}
	}

	function createVerticePlainIndexData() {
		for (var i = 0; i < Math.pow(gridSize, 2); i += gridStep) {
			var j = i + Math.floor(i / gridSize);
			verticesPlaneIndexes.push(j, j + 1, j + gridSize + 2, j, j + gridSize + 2, j + gridSize + 1);
		}
	}

	function createVerticesColorsDataObjects() {

		for (var i = 0; i <= gridSize; i += gridStep) {
			for (var j = 0; j <= gridSize; j += gridStep) {

				vertextColorsAnimation.push({
					r: {
						from: colorBase.r,
						to: colorBase.r
					},
					g: {
						from: colorBase.g,
						to: colorBase.g
					},
					b: {
						from: colorBase.b,
						to: colorBase.b
					},
					o: {
						from: Math.random(),
						to: Math.random()
					}
				});

			}
		}
	}

	function updateVerticesColorsDataObjects() {

		var prev = null;

		vertextColorsAnimation.forEach(function(item, i) {

			if (i !== 0 && Math.random() > 0.5) {
				vertextColorsAnimation[i] = prev;
			} else {

				prev = vertextColorsAnimation[i] = {
					r: {
						from: colorBase.r,
						to: colorBase.r
					},
					g: {
						from: colorBase.g,
						to: colorBase.g
					},
					b: {
						from: colorBase.b,
						to: colorBase.b
					},
					o: {
						from: item.o.current,
						to: Math.random()
					}
				}

			}

		});

	}

	function createVerticesColorsData () {

		verticesColors = [];
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

			verticesColors.push(item.r.current, item.g.current, item.b.current, item.o.current);
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

	}
	
	function createVerticesTextureData () {
		for (var i = 0; i < Math.pow(gridSize, 2); i++) {
			verticesTextures = verticesTextures.concat(textureCoords);
		}
	}
	
	function initBuffers() {

		vertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		vertexPositionBuffer.itemSize = 3;
		vertexPositionBuffer.numItems = 4;

		vertexPositionPlainBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexPositionPlainBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesPlaneIndexes), gl.STATIC_DRAW);
		vertexPositionPlainBuffer.itemSize = 1;
		vertexPositionPlainBuffer.numItems = verticesPlaneIndexes.length;

		createVerticesColorsData();

		vertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesColors), gl.STATIC_DRAW);
		vertexColorBuffer.itemSize = 4;
		vertexColorBuffer.numItems = verticesColors.length / vertexColorBuffer.itemSize;

		vertexTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesTextures), gl.STATIC_DRAW);
		vertexTextureCoordBuffer.itemSize = 2;
		vertexTextureCoordBuffer.numItems = verticesTextures.length / 2;

		console.log(verticesTextures.length, vertexTextureCoordBuffer.numItems);

	}

	function draw() {

		currentTime = ragl.lastTime - timeStarted;
		currentOpacity = easeOutCubic(currentTime, opacityFrom, opacityTo - opacityFrom, durationOpacity);
		currentDist = easeOutCubic(currentTime, distanceFrom, distanceTo - distanceFrom, duration);

		if (currentTime > duration) {
			currentDist = 0;
			currentOpacity = 1;
			timeStarted = performance.now();

			if(ragl.lastTime - timeRandomUpdated > durationRandomUpdate) {
				timeRandomUpdated = timeStarted;
				updateVerticesColorsDataObjects();
			}

			createVerticesColorsData();

			gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesColors), gl.STATIC_DRAW);
		}

		mat4.identity(ragl.mvMatrix);
		mat4.translate(ragl.mvMatrix, [mainPosition.x, mainPosition.y, zoom + mainPosition.z]);
		mat4.rotate(ragl.mvMatrix, ragl.degToRad(tilt), [1.0, 1.0, 0.0]);

		ragl.addTextures();

		gl.uniform3f(shaderProgram.colorUniform, colorBase.r, colorBase.g, colorBase.b);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexPositionPlainBuffer);
		ragl.setMatrixUniforms();
		gl.drawElements(gl.TRIANGLES, vertexPositionPlainBuffer.numItems, gl.UNSIGNED_SHORT, 0);

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

	var raglOptions = {
		enableTextures: true
	};

	ragl = new RaWebGL(raglOptions, draw, handleKeys);
	gl = ragl.gl;
	shaderProgram = ragl.shaderProgram;

	createVerticesData();
	createVerticePlainIndexData();
	createVerticesColorsDataObjects();
	createVerticesTextureData();
	ragl.initTextures(textureSrc);

	initBuffers();

	ragl.setupDrawCycle();

	function easeOutCubic(t, b, c, d) {
		t /= d;
		t--;
		return c * (t * t * t + 1) + b;
	}

	function easeInCubic(t, b, c, d) {
		t /= d;
		return c * t * t * t + b;
	};

})();