#!/usr/bin/env bash
#
# Deploy AutoVerdict Web to AWS Amplify Hosting via the AWS CLI.
# Creates (or updates) the Amplify app/branch/domain from infra/amplify.cfn.yml,
# then triggers a build of the branch.
#
# Prerequisites:
#   - AWS CLI v2 configured (`aws configure`) with Amplify + CloudFormation perms
#   - The code pushed to a Git repo (GitHub/GitLab/Bitbucket/CodeCommit)
#   - A GitHub access token (repo scope) the first time, to connect the repo
#
# Usage:
#   REPO_URL=https://github.com/<owner>/<repo> \
#   GITHUB_TOKEN=ghp_xxx \
#   [BRANCH=main] [REGION=ap-northeast-2] [STACK=autoverdict-web] \
#   [ADSENSE_CLIENT=ca-pub-xxx] [ADSENSE_SLOT=xxx] [DOMAIN=example.com] \
#   ./scripts/deploy-amplify.sh
set -euo pipefail

STACK="${STACK:-autoverdict-web}"
BRANCH="${BRANCH:-main}"
REGION="${REGION:-ap-northeast-2}"
TEMPLATE="$(cd "$(dirname "$0")/.." && pwd)/infra/amplify.cfn.yml"

: "${REPO_URL:?Set REPO_URL=https://github.com/<owner>/<repo>}"

echo "▶ Deploying CloudFormation stack '$STACK' in $REGION ..."
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK" \
  --template-file "$TEMPLATE" \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "RepositoryUrl=$REPO_URL" \
    "GithubAccessToken=${GITHUB_TOKEN:-}" \
    "BranchName=$BRANCH" \
    "AdsenseClient=${ADSENSE_CLIENT:-}" \
    "AdsenseSlot=${ADSENSE_SLOT:-}" \
    "DomainName=${DOMAIN:-}"

APP_ID="$(aws cloudformation describe-stacks \
  --region "$REGION" --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='AppId'].OutputValue" --output text)"

BRANCH_URL="$(aws cloudformation describe-stacks \
  --region "$REGION" --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='BranchUrl'].OutputValue" --output text)"

echo "▶ Starting build job for app $APP_ID branch $BRANCH ..."
aws amplify start-job \
  --region "$REGION" \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --job-type RELEASE >/dev/null

echo "✓ Build started. App: $APP_ID"
echo "✓ URL: $BRANCH_URL"
echo "  Watch progress: aws amplify list-jobs --region $REGION --app-id $APP_ID --branch-name $BRANCH"
