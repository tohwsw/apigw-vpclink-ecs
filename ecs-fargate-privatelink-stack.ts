import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class EcsFargatePrivatelinkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'MyVPC', { maxAzs: 2 });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', { vpc });

    // Create a Fargate service with private application load balancer
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MyFargateService', {
      cluster,
      memoryLimitMiB: 512,
      cpu: 256,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      },
      publicLoadBalancer: false,
    });

    // Create a Network Load Balancer
    const nlb = new elbv2.NetworkLoadBalancer(this, 'MyNLB', {
      vpc,
      internetFacing: false,
    });

    // Add a listener to the NLB
    const nlbListener = nlb.addListener('NLBListener', {
      port: 80,
    });

    nlbListener.addTargets('Targets', {
      targets: [new targets.AlbListenerTarget(fargateService.listener)],
      port: 80,
    });
     
    // Create a VPC Link for the API Gateway
    const vpcLink = new apigateway.VpcLink(this, 'MyVpcLink', {
      targets: [nlb],
    });

    // Create an API Gateway with VPC Link integration

    const integration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink: vpcLink,
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
      uri: `http://${nlb.loadBalancerDnsName}`,
    });

    //create a new api
    const api = new apigateway.RestApi(this, 'MyAPI', {
      deployOptions: {
        stageName: 'prod',
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultIntegration: integration
    });

    // Create a proxy resource
    const proxyResource = new apigateway.ProxyResource(this, "ProxyResource", {
      parent: api.root,
      anyMethod: false,
    })
  
    proxyResource.addMethod( "ANY", integration, {
        methodResponses: [{ statusCode: "200" }],
        requestParameters: {
          "method.request.path.proxy": true
        }
    })

    
  }
}

const app = new cdk.App();
new EcsFargatePrivatelinkStack(app, 'EcsFargatePrivatelinkStack');
app.synth();
