import type * as pulumi from '@pulumi/pulumi';

export interface VpcOutputs {
  vpcId: pulumi.Output<string>;
  vpcCidrBlock: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
  isolatedSubnetIds: pulumi.Output<string[]>;
}

export interface DatabaseOutputs {
  instance: {
    address: pulumi.Output<string>;
    port: pulumi.Output<number>;
    dbName: pulumi.Output<string>;
    username: pulumi.Output<string>;
  };
}

export interface ClusterOutputs {
  id: pulumi.Output<string>;
  name: pulumi.Output<string>;
}
