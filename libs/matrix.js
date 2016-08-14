function loadIdentity() {
	return Matrix.I(4);
}

function multMatrix(m, mvMatrix) {
	return mvMatrix.x(m);
}

function mvTranslate(v, mvMatrix) {
	return multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4(), mvMatrix);
}

function setMatrixUniforms(gl, shaderProgram, perspectiveMatrix, mvMatrix) {
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}