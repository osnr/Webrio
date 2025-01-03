import { Renderer } from "./renderer.js";
import webrioLoader from "./webrio.js";

const mat4 = glMatrix.mat4;

export async function gameStart(canvas, rom) {
  const Webrio = await webrioLoader();
  window.Webrio = Webrio; // for debugging.

  const renderer = new Renderer(canvas);
  
  const heapRomPtr = Webrio._malloc(rom.length);
  const heapRom = new Uint8Array(Webrio.HEAPU8.buffer, heapRomPtr, rom.length);
  heapRom.set(rom);

  const heapTexLength = Webrio._webrio_get_sm64_texture_width() *
  Webrio._webrio_get_sm64_texture_height() * 4;
  const heapTexPtr = Webrio._malloc(heapTexLength);

  const sizeofFloat = 4;
  const SM64_GEO_MAX_TRIANGLES = 1024;
  const positionBufPtr = Webrio._malloc(sizeofFloat * 9 * SM64_GEO_MAX_TRIANGLES);
  const colorBufPtr    = Webrio._malloc(sizeofFloat * 9 * SM64_GEO_MAX_TRIANGLES);
  const normalBufPtr   = Webrio._malloc(sizeofFloat * 9 * SM64_GEO_MAX_TRIANGLES);
  const uvBufPtr       = Webrio._malloc(sizeofFloat * 6 * SM64_GEO_MAX_TRIANGLES);

  const positionArr = new Float32Array(Webrio.HEAPF32.buffer, positionBufPtr, 9 * SM64_GEO_MAX_TRIANGLES);
  const colorArr    = new Float32Array(Webrio.HEAPF32.buffer, colorBufPtr, 9 * SM64_GEO_MAX_TRIANGLES);
  const normalArr   = new Float32Array(Webrio.HEAPF32.buffer, normalBufPtr, 9 * SM64_GEO_MAX_TRIANGLES);
  const uvArr       = new Float32Array(Webrio.HEAPF32.buffer, uvBufPtr, 6 * SM64_GEO_MAX_TRIANGLES);

  Webrio._webrio_init(heapRomPtr, heapTexPtr,
                      positionBufPtr, colorBufPtr,
                      normalBufPtr, uvBufPtr);

  // Load Mario:
  const heapTex = new Uint8Array(Webrio.HEAPU8.buffer, heapTexPtr, heapTexLength);
  renderer.loadMarioTexture(heapTex,
                            Webrio._webrio_get_sm64_texture_width(),
                            Webrio._webrio_get_sm64_texture_height());

  // Load world:
  const surfaces = [];
  const surfacesCount = Webrio._webrio_get_surfaces_count();
  for (let i = 0; i < surfacesCount; i++) {
    const verticesPtr = Webrio._malloc(4 * 9); // int32_t[3][3]
    const verticesArr = new Int32Array(Webrio.HEAP32.buffer, verticesPtr, 4 * 9);
    Webrio._webrio_get_surface_vertices(i, verticesPtr);

    surfaces.push({
      type: Webrio._webrio_get_surface_type(i),
      force: Webrio._webrio_get_surface_force(i),
      terrain: Webrio._webrio_get_surface_terrain(i),
      vertices: verticesArr
    });
  }
  renderer.loadSurfaces(surfaces);

  const marioPositionPtr = Webrio._malloc(sizeofFloat * 3);
  const marioPositionArr = new Float32Array(Webrio.HEAPF32.buffer, marioPositionPtr, 3);

  let cameraPos = [0, 0, 0]
  let cameraRot = 0.0;

  let view = Array(16).fill(0);
  let projection = Array(16).fill(0);
  let model = Array(16).fill(0);

  const keysDown = {};

  window.requestAnimationFrame(function tick() {
    let stickX = 0.0;
    let stickY = 0.0;
    let buttonA = 0.0;
    if ("ArrowLeft" in keysDown) { stickX -= 1.0; }
    if ("ArrowRight" in keysDown) { stickX += 1.0; }
    if ("ArrowUp" in keysDown) { stickY -= 1.0; }
    if ("ArrowDown" in keysDown) { stickY += 1.0; }
    if ("z" in keysDown) { buttonA = 1.0; }
    const numTrianglesUsed = Webrio._webrio_tick(0, 0,
                                                 stickX, stickY,
                                                 buttonA, 0, 0,
                                                 marioPositionPtr);

    // cameraRot += x0_axis * dt * 2;
    cameraPos[0] = marioPositionArr[0] + 1000.0 * Math.cos( cameraRot );
    cameraPos[1] = marioPositionArr[1] + 200.0;
    cameraPos[2] = marioPositionArr[2] + 1000.0 * Math.sin( cameraRot );

    const windowWidth = 640.0;
    const windowHeight = 480.0;
    mat4.perspective(projection, 45.0, windowWidth / windowHeight, 100.0, 20000.0);
    mat4.translate(view, view, cameraPos);
    mat4.lookAt(view, cameraPos, marioPositionArr, [0, 1, 0]);
    mat4.identity(model);

    statusEl.innerText = `
numTrianglesUsed: ${numTrianglesUsed}
cameraPos: ${cameraPos}
marioPosition: ${marioPositionArr}

view: ${view}
projection: ${projection}
    `;

    renderer.drawWorld(model, view, projection);

    renderer.drawMario(view, projection,
                       positionArr, colorArr, normalArr, uvArr,
                       numTrianglesUsed);

    window.requestAnimationFrame(tick);
  });

  window.addEventListener('keydown', (e) => {
    keysDown[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    delete keysDown[e.key];
  });
};
