o=$(o)

web:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/nodemon --watch 'src/**/*.ts' --exec './node_modules/.bin/ts-node' bin/$@.ts

cron:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-vite:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-bsc:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

sync-bsc-2:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

fix-db:
	@DEBUG=backend:* ./node_modules/.bin/env-cmd ./node_modules/.bin/ts-node bin/$@.ts

deploy:
	git push
	git push heroku-testnet-api main
	git push heroku-testnet-cron main

.PHONY: \
	web \
	cron \
	sync-vite \
	sync-bsc \
	sync-bsc-2 \
	fix-db \
	deploy