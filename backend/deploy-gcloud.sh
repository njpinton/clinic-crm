#!/bin/bash
# Google Cloud Run Deployment Script for Clinic CRM Backend
# Usage: ./deploy-gcloud.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID="${1:-$(gcloud config get-value project)}"
REGION="${2:-us-central1}"
SERVICE_NAME="clinic-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Clinic CRM Backend - GCloud Deployment ===${NC}"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null 2>&1; then
    echo -e "${RED}Error: Not authenticated with gcloud. Run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Check if project is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No project ID specified. Run 'gcloud config set project PROJECT_ID' or pass as argument.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Configuring Docker for GCR...${NC}"
gcloud auth configure-docker --quiet

echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:latest -f Dockerfile .

echo -e "${YELLOW}Step 3: Pushing image to Google Container Registry...${NC}"
docker push ${IMAGE_NAME}:latest

echo -e "${YELLOW}Step 4: Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8000 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --set-env-vars "DJANGO_SETTINGS_MODULE=config.settings.production" \
    --set-env-vars "DB_NAME=clinic" \
    --set-env-vars "DB_USER=postgres" \
    --set-secrets "DB_PASSWORD=clinic-db-password:latest" \
    --set-secrets "SECRET_KEY=django-secret-key:latest" \
    --add-cloudsql-instances "${PROJECT_ID}:${REGION}:clinic-sql" \
    --set-env-vars "CLOUD_SQL_CONNECTION_NAME=${PROJECT_ID}:${REGION}:clinic-sql"

echo -e "${GREEN}Step 5: Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "Service URL: ${SERVICE_URL}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update frontend NEXT_PUBLIC_API_URL to: ${SERVICE_URL}"
echo "2. Add ${SERVICE_URL} to CORS_ALLOWED_ORIGINS if needed"
echo "3. Verify health: curl ${SERVICE_URL}/api/health/"
