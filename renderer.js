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

const worldShader = `
precision highp float;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform sampler2D tex;

v2f vec3 v_normal;
v2f vec3 v_worldPos;

#ifdef VERTEX

    layout(location = 0) in vec3 position;
    layout(location = 1) in vec3 normal;

    void main()
    {
        v_normal = inverse(mat3(model)) * normal;
        vec4 worldPos4 = model * vec4(position, 1.);
        v_worldPos = worldPos4.xyz;
        gl_Position = projection * view * worldPos4;
    }

#endif
#ifdef FRAGMENT

    vec3 tri( vec3 x )
    {
        return abs(x-floor(x)-.5);
    } 
    float surfFunc( vec3 p )
    {
        float n = dot(tri(p*.15 + tri(p.yzx*.075)), vec3(.444));
        p = p*1.5773 - n;
        p.yz = vec2(p.y + p.z, p.z - p.y) * .866;
        p.xz = vec2(p.x + p.z, p.z - p.x) * .866;
        n += dot(tri(p*.225 + tri(p.yzx*.1125)), vec3(.222));     
        return abs(n-.5)*1.9 + (1.-abs(sin(n*9.)))*.05;
    }

    const vec3 light_x = vec3(-1.0, 0.4, 0.9);

    out vec4 color;

    void main() 
    {
        float surfy = surfFunc( v_worldPos / 50. );
        float brightness = smoothstep( .2, .3, surfy );

        color = vec4( (0.5 + 0.25 * brightness) * (.5+.5*v_normal), 1 );
        color = vec4( 1, 0, 0, 1 );
    }

#endif
`;

export class Renderer {
  constructor(canv) {
    const gl = this.gl = canv.getContext('webgl2');
    if (gl === null) {
      alert('WebGL initialization failed.');
    }

    (() => {
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
    })();

    (() => {
      const vert = `#version 300 es\n#define VERTEX  \n#define v2f out\n${worldShader}`;
      const frag = `#version 300 es\n#define FRAGMENT  \n#define v2f in\n${worldShader}`;
      const program = this.createProgram(vert, frag);
      this.worldProgram = {
        program,

        modelLoc: gl.getUniformLocation(program, 'model'),
        viewLoc: gl.getUniformLocation(program, 'view'),
        projectionLoc: gl.getUniformLocation(program, 'projection'),
        texLoc: gl.getUniformLocation(program, 'tex'),

        positionLoc: gl.getAttribLocation(program, 'position'),
        positionBuf: gl.createBuffer(),

        normalLoc: gl.getAttribLocation(program, 'normal'),
        normalBuf: gl.createBuffer(),
      };
    })();
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

  // Takes an array of surfaces with {type, force, terrain, vertices}.
  loadSurfaces(surfaces) {
    const mesh = this.mesh = {
      numVertices: 3 * surfaces.length,
      position: new Float32Array(surfaces.length * 9),
      normal: new Float32Array(surfaces.length * 9),
      index: new Uint16Array(surfaces.length * 3)
    };

    for (let i = 0; i < surfaces.length; i++) {
      const surf = surfaces[i];

      const x1 = mesh.position[9*i+0] = surf.vertices[0];
      const y1 = mesh.position[9*i+1] = surf.vertices[1];
      const z1 = mesh.position[9*i+2] = surf.vertices[2];
      const x2 = mesh.position[9*i+3] = surf.vertices[3];
      const y2 = mesh.position[9*i+4] = surf.vertices[4];
      const z2 = mesh.position[9*i+5] = surf.vertices[5];
      const x3 = mesh.position[9*i+6] = surf.vertices[6];
      const y3 = mesh.position[9*i+7] = surf.vertices[7];
      const z3 = mesh.position[9*i+8] = surf.vertices[8];

      let nx = (y2 - y1) * (z3 - z2) - (z2 - z1) * (y3 - y2);
      let ny = (z2 - z1) * (x3 - x2) - (x2 - x1) * (z3 - z2);
      let nz = (x2 - x1) * (y3 - y2) - (y2 - y1) * (x3 - x2);
      const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= mag;
      ny /= mag;
      nz /= mag;

      mesh.normal[9*i+0] = nx;
      mesh.normal[9*i+1] = ny;
      mesh.normal[9*i+2] = nz;
      mesh.normal[9*i+3] = nx;
      mesh.normal[9*i+4] = ny;
      mesh.normal[9*i+5] = nz;
      mesh.normal[9*i+6] = nx;
      mesh.normal[9*i+7] = ny;
      mesh.normal[9*i+8] = nz;

      mesh.index[3*i+0] = 3*i+0;
      mesh.index[3*i+1] = 3*i+1;
      mesh.index[3*i+2] = 3*i+2;
    }

    // TODO: load vertex array into GPU
  }

  // model, view, and projection are 16-element Float32Arrays (mat4).
  // The arrs are flattened Float32Arrays.
  drawWorld(model, view, projection,
            positionArr, normalArr) {
    const gl = this.gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.worldProgram.program);

    // Set mat4 model
    gl.uniformMatrix4fv(this.worldProgram.modelLoc,
                        false, model);
    // Set mat4 view
    gl.uniformMatrix4fv(this.worldProgram.viewLoc,
                        false, view);
    // Set mat4 projection
    gl.uniformMatrix4fv(this.worldProgram.projectionLoc,
                        false, projection);

    // Pass in world triangles:
    gl.bindBuffer(gl.ARRAY_BUFFER, this.worldProgram.positionBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positionArr, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.worldProgram.positionLoc);
    gl.vertexAttribPointer(this.worldProgram.positionLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.worldProgram.normalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, normalArr, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.worldProgram.normalLoc);
    gl.vertexAttribPointer(this.worldProgram.normalLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.mesh.numVertices);
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
  // The arrs are flattened Float32Arrays.
  drawMario(view, projection,
            positionArr, colorArr, normalArr, uvArr,
            numTrianglesUsed) {
    const gl = this.gl;

    gl.useProgram(this.marioProgram.program);

    // Set mat4 view
    gl.uniformMatrix4fv(this.marioProgram.viewLoc,
                        false, view);
    // Set mat4 projection
    gl.uniformMatrix4fv(this.marioProgram.projectionLoc,
                        false, projection);

    // Pass in Mario triangles:
    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.positionBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positionArr, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.positionLoc);
    gl.vertexAttribPointer(this.marioProgram.positionLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.colorLoc);
    gl.vertexAttribPointer(this.marioProgram.colorLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.normalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, normalArr, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.normalLoc);
    gl.vertexAttribPointer(this.marioProgram.normalLoc,
                           3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.marioProgram.uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvArr, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.marioProgram.uvLoc);
    gl.vertexAttribPointer(this.marioProgram.uvLoc,
                           2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, numTrianglesUsed);
  }
};
