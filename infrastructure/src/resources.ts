import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import type { ClusterOutputs, DatabaseOutputs, VpcOutputs } from './types';

const ssmConfig = new pulumi.Config('ssm');

function getSsmKey(key: string): string {
  const prefix = ssmConfig.require('keyPrefix');
  return `/${prefix}/${key}`;
}

export function getVpc(
  sharedStack: pulumi.StackReference | undefined,
  projectName: string,
): VpcOutputs {
  if (sharedStack) {
    return {
      vpcId: sharedStack.requireOutput('vpcId') as pulumi.Output<string>,
      vpcCidrBlock: sharedStack.requireOutput(
        'vpcCidrBlock',
      ) as pulumi.Output<string>,
      publicSubnetIds: sharedStack.requireOutput(
        'vpcPublicSubnetIds',
      ) as pulumi.Output<string[]>,
      privateSubnetIds: sharedStack.requireOutput(
        'vpcPrivateSubnetIds',
      ) as pulumi.Output<string[]>,
      isolatedSubnetIds: sharedStack.requireOutput(
        'vpcIsolatedSubnetIds',
      ) as pulumi.Output<string[]>,
    };
  }

  const vpc = new awsx.ec2.Vpc(`${projectName}-vpc`, {
    enableDnsHostnames: true,
    numberOfAvailabilityZones: 2,
    natGateways: { strategy: 'Single' },
    subnetStrategy: 'Auto',
    subnetSpecs: [
      { type: awsx.ec2.SubnetType.Public, cidrMask: 24 },
      { type: awsx.ec2.SubnetType.Private, cidrMask: 24 },
      { type: awsx.ec2.SubnetType.Isolated, cidrMask: 24 },
    ],
  });

  return {
    vpcId: vpc.vpcId,
    vpcCidrBlock: vpc.vpc.cidrBlock,
    publicSubnetIds: vpc.publicSubnetIds,
    privateSubnetIds: vpc.privateSubnetIds,
    isolatedSubnetIds: vpc.isolatedSubnetIds,
  };
}

export function getDatabase(
  sharedStack: pulumi.StackReference | undefined,
  fullPrefix: string,
  vpc: VpcOutputs,
): DatabaseOutputs | studion.Database {
  if (sharedStack) {
    return {
      instance: {
        address: sharedStack.requireOutput(
          'dbEndpoint',
        ) as pulumi.Output<string>,
        port: sharedStack
          .requireOutput('dbPort')
          .apply((p: string) => parseInt(p, 10)) as pulumi.Output<number>,
        dbName: pulumi.output('lx'),
        username: sharedStack.requireOutput('dbUser') as pulumi.Output<string>,
      },
    };
  }

  const dbPassword = aws.ssm.getParameterOutput({
    name: getSsmKey('DATABASE_PASSWORD'),
    withDecryption: true,
  });

  return new studion.Database(`${fullPrefix}-db`, {
    instanceClass: 'db.t4g.small',
    dbName: 'lx',
    username: 'lx',
    password: dbPassword.value,
    vpcId: vpc.vpcId,
    vpcCidrBlock: vpc.vpcCidrBlock,
    isolatedSubnetIds: vpc.isolatedSubnetIds,
    engineVersion: '17.6',
    enableMonitoring: false,
  });
}

export function getCluster(
  sharedStack: pulumi.StackReference | undefined,
  fullPrefix: string,
): ClusterOutputs {
  if (sharedStack) {
    return {
      id: sharedStack.requireOutput('ecsCluserId') as pulumi.Output<string>,
      name: sharedStack.requireOutput('ecsCluserName') as pulumi.Output<string>,
    };
  }

  const cluster = new aws.ecs.Cluster(`${fullPrefix}-ecs-cluster`, {
    name: `${fullPrefix}-ecs-cluster`,
  });

  return {
    id: cluster.id,
    name: cluster.name,
  };
}
