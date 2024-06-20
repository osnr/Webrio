webrio.js: webrio.c ~/aux/libsm64/dist/libsm64.so
	emcc -sEXPORTED_FUNCTIONS=_webrio_init,_webrio_tick,_webrio_get_sm64_texture_length,_malloc \
	  	-sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
		-sEXPORT_ES6=1 -sMODULARIZE -sEXPORT_NAME=webrio \
		-I ~/aux/libsm64/src -o $@ $^

clean:
	rm webrio.js webrio.wasm
