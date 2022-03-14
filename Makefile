o=$(o)

web:
	@DEBUG=vite:* ./node_modules/.bin/env-cmd ./node_modules/.bin/nodemon --watch 'src/**/*.ts' --exec './node_modules/.bin/ts-node' bin/$@.ts

cron:
	@DEBUG=vite:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-vite:
	@DEBUG=vite:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-bsc:
	@DEBUG=vite:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-bsc-2:
	@DEBUG=vite:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

.PHONY: \
	sync-vite \
	sync-bsc \
	sync-bsc-2 \
	cron \
	web