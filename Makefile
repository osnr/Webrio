webrio.js: webrio.c level.c ~/aux/libsm64/dist/libsm64.so
	emcc -sEXPORTED_FUNCTIONS=_webrio_init,_webrio_tick,_webrio_get_sm64_texture_width,_webrio_get_sm64_texture_height,_malloc,_webrio_get_surfaces_count,_webrio_get_surface_type,_webrio_get_surface_force,_webrio_get_surface_terrain,_webrio_get_surface_vertices \
	  	-sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
		-sEXPORT_ES6=1 -sMODULARIZE -sEXPORT_NAME=webrio \
		-I ~/aux/libsm64/src -o $@ $^

clean:
	rm webrio.js webrio.wasm
