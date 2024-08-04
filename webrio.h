#ifndef WEBRIO_H
#define WEBRIO_H

void webrio_init(uint8_t* rom, uint8_t* tex,
                 // These will get filled in on each tick:
                 float* positionBuf,
                 float* colorBuf,
                 float* normalBuf,
                 float* uvBuf);

// HACK: returns numTrianglesUsed.
int webrio_tick(float camLookX, float camLookZ,
                float stickX, float stickY,
                uint8_t buttonA, uint8_t buttonB, uint8_t buttonZ,
                float* outMarioPosition);

int webrio_get_sm64_texture_width();
int webrio_get_sm64_texture_height();

// These just pull from the test level in test/level.h and
// test/level.c.
size_t webrio_get_surfaces_count();
int16_t webrio_get_surface_type(int surfaceIdx);
int16_t webrio_get_surface_force(int surfaceIdx);
uint16_t webrio_get_surface_terrain(int surfaceIdx);
void webrio_get_surface_vertices(int surfaceIdx,
                                 int32_t vertices[3][3]);

#endif
