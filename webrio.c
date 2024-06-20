#include <libsm64.h>

#include "webrio.h"

int32_t marioId;

void webrio_init(uint8_t* rom, uint8_t* tex) {
    sm64_global_init(rom, tex);

    /* sm64_static_surfaces_load( surfaces, surfaces_count ); */

    marioId = sm64_mario_create( 0, 1000, 0 );
}

void webrio_tick() {
    /* sm64_mario_tick(marioId, inputs, outState, outBuffers); */
}

int webrio_get_sm64_texture_length() {
    return 4 * SM64_TEXTURE_WIDTH * SM64_TEXTURE_HEIGHT;
}
