#include <libsm64.h>

#include "webrio.h"
#include "level.h"

#include <string.h>

int32_t marioId;

struct SM64MarioGeometryBuffers marioGeometry;

void webrio_init(uint8_t* rom, uint8_t* tex,
                 // These will get filled in on each tick:
                 float* positionBuf,
                 float* colorBuf,
                 float* normalBuf,
                 float* uvBuf) {
    sm64_global_init(rom, tex);

    sm64_static_surfaces_load( surfaces, surfaces_count );

    marioId = sm64_mario_create( 0, 1000, 0 );

    marioGeometry.position = positionBuf;
    marioGeometry.color    = colorBuf;
    marioGeometry.normal   = normalBuf;
    marioGeometry.uv       = uvBuf;
    marioGeometry.numTrianglesUsed = 0;
}

// HACK: returns numTrianglesUsed.
int webrio_tick(// inputs:
                float camLookX, float camLookZ,
                float stickX, float stickY,
                uint8_t buttonA, uint8_t buttonB, uint8_t buttonZ,

                // outputs:
                float* outMarioPosition) {
    struct SM64MarioInputs inputs = {
        .camLookX = camLookX, .camLookZ = camLookZ,
        .stickX = stickX, .stickY = stickY,
        .buttonA = buttonA, .buttonB = buttonB, .buttonZ = buttonZ
    };

    struct SM64MarioState outState;
    sm64_mario_tick(marioId, &inputs, &outState, &marioGeometry);

    memcpy(outMarioPosition, outState.position, sizeof(outState.position));
    return marioGeometry.numTrianglesUsed;
}

int webrio_get_sm64_texture_width() { return SM64_TEXTURE_WIDTH; }
int webrio_get_sm64_texture_height() { return SM64_TEXTURE_HEIGHT; }

// These just pull from the test level in test/level.h and
// test/level.c.
size_t webrio_get_surfaces_count() { return surfaces_count; }
int16_t webrio_get_surface_type(int surfaceIdx) {
    return surfaces[surfaceIdx].type;
}
int16_t webrio_get_surface_force(int surfaceIdx) {
    return surfaces[surfaceIdx].force;
}
uint16_t webrio_get_surface_terrain(int surfaceIdx) {
    return surfaces[surfaceIdx].terrain;
}
void webrio_get_surface_vertices(int surfaceIdx,
                                 int32_t vertices[3][3]) {
    memcpy(vertices, surfaces[surfaceIdx].vertices,
           sizeof(int32_t) * 9);
}
