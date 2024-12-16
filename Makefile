LIB_SM_PATH = ~/aux/libsm64 # defaults

libsm64/dist/libsm64.so: emcc $(LIB_SM_PATH)/dist/libsm64.so -o $(LIB_SM_PATH)/dist/libsm64.js -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORTED_RUNTIME_METHODS=ccall,cwrap -s EXPORTED_FUNCTIONS=_malloc,_free -s ALLOW_MEMORY_GROWTH=1 -s ASSERTIONS=1 -s DEMANGLE_SUPPORT=1 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s EXPORT_NAME=SM64Module

webrio.js: webrio.c level.c $(LIB_SM_PATH)/dist/libsm64.so
	emcc -sEXPORTED_FUNCTIONS=_webrio_init,_webrio_tick,_webrio_get_sm64_texture_width,_webrio_get_sm64_texture_height,_malloc,_webrio_get_surfaces_count,_webrio_get_surface_type,_webrio_get_surface_force,_webrio_get_surface_terrain,_webrio_get_surface_vertices \
	  	-sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
		-sEXPORT_ES6=1 -sMODULARIZE -sEXPORT_NAME=webrio \
		-I $(LIB_SM_PATH)/src -o $@ $^

clean:
	rm webrio.js webrio.wasm
