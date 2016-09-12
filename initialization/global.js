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

		}

	}

	o.init = init;

	window.RaWebGL = o;

})();