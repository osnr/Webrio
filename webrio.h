#ifndef WEBRIO_H
#define WEBRIO_H

void webrio_init(uint8_t* rom, uint8_t* tex);
void webrio_tick();

int webrio_get_sm64_texture_length();

#endif
