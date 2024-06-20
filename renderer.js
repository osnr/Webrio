export class Renderer {
  constructor(canv) {
    this.gl = canv.getContext('webgl');
    if (this.gl === null) {
      alert('WebGL initialization failed.');
    }
  }

  draw() {
    const gl = this.gl;
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
};
