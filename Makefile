o=$(o)

web:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/nodemon --watch 'src/**/*.ts' --exec './node_modules/.bin/ts-node' bin/$@.ts

cron:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-vite-bsc:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-vite-eth:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-bsc-vite:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-bsc-vite-2:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-eth-vite:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-eth-vite-2:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

fix-db:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

set-confirmed:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

deploy:
	git push
	git push heroku-testnet-api main
	git push heroku-testnet-cron main

.PHONY: \
	web \
	cron \
	sync-vite-bsc \
	sync-vite-eth \
	sync-bsc-vite \
	sync-bsc-vite-2 \
	sync-eth-vite \
	sync-eth-vite-2 \
	fix-db \
	set-confirmed \
	deploy
