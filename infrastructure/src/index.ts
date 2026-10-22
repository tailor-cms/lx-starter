import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import { getEnvVariables, getSecrets } from './env';
import { getCluster, getDatabase, getVpc } from './resources';

const config = new pulumi.Config();
const dnsConfig = new pulumi.Config('dns');

const PROJECT_NAME = pulumi.getProject();
const STACK = pulumi.getStack();

const resourceNamePrefix = config.require('resourceNamePrefix');
const fullPrefix = `${resourceNamePrefix}-${STACK}`;

// Optional stack reference for reusing infrastructure (VPC, database, ECS)
const sharedStackRef = config.get('sharedStackRef');
const sharedStack = sharedStackRef
  ? new pulumi.StackReference(sharedStackRef)
  : undefined;

function buildAndPushImage() {
  const repository = new aws.ecr.Repository(`${fullPrefix}-ecr`, {
    forceDelete: true,
  });
  return new awsx.ecr.Image(`${fullPrefix}-img`, {
    repositoryUrl: repository.repositoryUrl,
    context: '..',
    platform: 'linux/amd64',
    args: { ssh: 'default', GITHUB_TOKEN: process.env.GITHUB_TOKEN || '' },
  });
}

export const dockerImage =
  process.env.APP_DOCKER_IMAGE || buildAndPushImage().imageUri;

// Infrastructure resources: Use shared stack or create new
const vpc = getVpc(sharedStack, PROJECT_NAME);
const cluster = getCluster(sharedStack, fullPrefix);
// Database: Get shared instance or create new
// Note: For shared stacks, the app will create the "lx" database on startup
const db = getDatabase(sharedStack, fullPrefix, vpc);

// Web server: Always created (ALB + ECS service)
new studion.WebServer(`${fullPrefix}-be`, {
  image: dockerImage,
  port: 3000,
  domain: dnsConfig.require('domain'),
  hostedZoneId: dnsConfig.require('hostedZoneId'),
  vpcId: vpc.vpcId,
  vpcCidrBlock: vpc.vpcCidrBlock,
  publicSubnetIds: vpc.publicSubnetIds,
  clusterId: cluster.id,
  clusterName: cluster.name,
  autoscaling: { enabled: false },
  size: 'large',
  desiredCount: 1,
  healthCheckPath: '/api/healthcheck',
  environment: getEnvVariables(db, sharedStack),
  secrets: getSecrets(),
});

// For operational tasks
export const ecsClusterName = cluster.name;
