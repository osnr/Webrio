#include <libsm64.h>

void webrio_init(uint8_t* rom, uint8_t* tex) {
    sm64_global_init(rom, tex);
}

void webrio_tick() {
    
}

int webrio_get_sm64_texture_length() {
    return 4 * SM64_TEXTURE_WIDTH * SM64_TEXTURE_HEIGHT;
}
