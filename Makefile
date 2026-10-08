.PHONY: docker-up docker-down tunnel stop-tunnels test build

docker-up:
	docker build -t nudger-fe:local .
	-docker rm -f nudger-fe
	docker run -d --name nudger-fe --restart unless-stopped --env-file .env.nudger.local --add-host host.docker.internal:host-gateway -p 5174:80 nudger-fe:local

docker-down:
	-docker rm -f nudger-fe

tunnel:
	$(MAKE) -C /Users/kd/projects/plugnudge-be tunnels

stop-tunnels:
	$(MAKE) -C /Users/kd/projects/plugnudge-be stop-tunnels

test:
	npm run test:ui && npm run test:audience && npm run test:api

build:
	npm run build
