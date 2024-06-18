webrio.js: webrio.c ~/aux/libsm64/dist/libsm64.so
	emcc -I ~/aux/libsm64/src -o $@ $^
