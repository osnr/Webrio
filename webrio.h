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
                uint8_t buttonA, uint8_t buttonB, uint8_t buttonZ);

int webrio_get_sm64_texture_width();
int webrio_get_sm64_texture_height();

#endif
