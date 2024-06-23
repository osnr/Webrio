const marioShader = `
precision highp float;

uniform mat4 view;
uniform mat4 projection;
uniform sampler2D marioTex;

v2f vec3 v_color;
v2f vec3 v_normal;
v2f vec3 v_light;
v2f vec2 v_uv;

#ifdef VERTEX

    layout(location = 0) in vec3 position;
    layout(location = 1) in vec3 normal;
    layout(location = 2) in vec3 color;
    layout(location = 3) in vec2 uv;

    void main()
    {
        v_color = color;
        v_normal = normal;
        v_light = transpose( mat3( view )) * normalize( vec3( 1 ));
        v_uv = uv;

        gl_Position = projection * view * vec4( position, 1. );
    }

#endif
#ifdef FRAGMENT

    out vec4 color;

    void main() 
    {
        float light = .5 + .5 * clamp( dot( v_normal, v_light ), 0., 1. );
        vec4 texColor = texture( marioTex, v_uv );
        vec3 mainColor = mix( v_color, texColor.rgb, texColor.a ); // v_uv.x >= 0. ? texColor.a : 0. );
        color = vec4( mainColor * light, 1 );
    }

#endif
`;

export class Renderer {
  constructor(canv) {
    const gl = this.gl = canv.getContext('webgl2');
    if (gl === null) {
      alert('WebGL initialization failed.');
    }

    const vert = `#version 300 es\n#define VERTEX  \n#define v2f out\n${marioShader}`;
    const frag = `#version 300 es\n#define FRAGMENT  \n#define v2f in\n${marioShader}`;
    const program = this.createProgram(vert, frag);
    this.marioProgram = program;

    // Fill uniforms:
    this.viewLoc = gl.getUniformLocation(program, 'view');
    this.projectionLoc = gl.getUniformLocation(program, 'projection');
    this.marioTexLoc = gl.getUniformLocation(program, 'marioTex');
  }

  loadShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
  createProgram(vertSource, fragSource) {
    const gl = this.gl;
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vertSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fragSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert(
        `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        program,
      )}`,
      );
      return null;
    }

    return program;
  }

  loadMarioTexture(data, width, height) {
    const gl = this.gl;
    this.marioTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.marioTex);
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D,
                  level, internalFormat,
                  width, height,
                  border, format, type, data);
  }

  draw() {
    const gl = this.gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.marioProgram);
    gl.drawArrays();
  }
};
