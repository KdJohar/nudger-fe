PROJECT_ID ?= plugnudge-509408
REGION ?= asia-south1
REPOSITORY ?= nudger-fe-app
IMAGE_NAME ?= nudger-fe
IMAGE_TAG ?= latest
REGISTRY_HOST := $(REGION)-docker.pkg.dev
IMAGE_PATH := $(REGISTRY_HOST)/$(PROJECT_ID)/$(REPOSITORY)/$(IMAGE_NAME)

.PHONY: docker-up docker-down tunnel stop-tunnels test build ensure-artifact-registry create-image publish-image deploy-production

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
	npm run test:ui && npm run test:audience && npm run test:api && npm run test:charts && npm run test:snackbar && npm run test:compose && npm run test:api-access && npm run test:profile

build:
	npm run build

ensure-artifact-registry:
	@if ! gcloud artifacts repositories describe $(REPOSITORY) --project=$(PROJECT_ID) --location=$(REGION) >/dev/null 2>&1; then \
		gcloud artifacts repositories create $(REPOSITORY) \
			--project=$(PROJECT_ID) \
			--location=$(REGION) \
			--repository-format=docker \
			--description='Plug & Nudge frontend container images'; \
	fi
	gcloud artifacts repositories set-cleanup-policies $(REPOSITORY) \
		--project=$(PROJECT_ID) \
		--location=$(REGION) \
		--policy=scripts/artifact-cleanup-untagged.json

create-image: test
	npm run build
	docker build --platform linux/amd64 -t $(IMAGE_PATH):$(IMAGE_TAG) .

publish-image: create-image ensure-artifact-registry
	gcloud auth configure-docker $(REGISTRY_HOST) --quiet
	docker push $(IMAGE_PATH):$(IMAGE_TAG)
	@printf 'Published %s\n' '$(IMAGE_PATH):$(IMAGE_TAG)'

deploy-production: publish-image
	./scripts/deploy_cloud_run_production.sh
