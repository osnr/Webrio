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
    this.marioProgram = {
      program,

      viewLoc: gl.getUniformLocation(program, 'view'),
      projectionLoc: gl.getUniformLocation(program, 'projection'),
      marioTexLoc: gl.getUniformLocation(program, 'marioTex'),

      positionLoc: gl.getAttribLocation(program, 'position'),
      positionBuf: gl.createBuffer(),

      normalLoc: gl.getAttribLocation(program, 'normal'),
      normalBuf: gl.createBuffer(),

      colorLoc: gl.getAttribLocation(program, 'color'),
      colorBuf: gl.createBuffer(),

      uvLoc: gl.getAttribLocation(program, 'uv'),
      uvBuf: gl.createBuffer(),
    };
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const unit = 5; // TODO: organize these
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.marioTex);

    gl.useProgram(this.marioProgram.program);
    gl.uniform1i(this.marioProgram.marioTexLoc, unit);
  }

  // view and projection are 16-element Float32Arrays (mat4).
  // The bufs are flattened Float32Arrays.
  draw(view, projection,
       positionArr, colorArr, normalArr, uvArr,
       numTrianglesUsed) {
    const gl = this.gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.marioProgram.program);

    // Set mat4 view
    gl.uniformMatrix4fv(this.marioProgram.viewLoc,
                        false, view);
    // Set mat4 projection
    gl.uniformMatrix4fv(this.marioProgram.projectionLoc,
                        false, projection);

    // Pass in Mario triangles:
    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.positionBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positionArr, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.positionBuf);
    gl.vertexAttribPointer(this.marioProgram.positionLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.colorBuf);
    gl.vertexAttribPointer(this.marioProgram.colorLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.normalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, normalArr, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.normalBuf);
    gl.vertexAttribPointer(this.marioProgram.normalLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvArr, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.uvBuf);
    gl.vertexAttribPointer(this.marioProgram.uvLoc,
                           2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, numTrianglesUsed);
  }
};
