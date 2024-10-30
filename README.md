# apigw-vpclink-ecs

This repository shows the AWS CDK script to deploy an API Gateway with ECS Fargate Services. We shall build an API that interfaces with a non-internet facing Network Load Balancer (NLB)through a VPC Link. We will configure the API as an HTTP Proxy Integration, which passes all requests directly to the NLB. The NLB shall target an Application Load Balancer (ALB) which then direct the requests to ECS Fargate Service sitting behind. Using the ALB allows us to provide context path routing to ECS Fargate Services behind the ALB. We will use the HTTP proxy integration to a proxy resource to set up the API to expose a portion or an entire endpoint hierarchy of the HTTP backend with a single integration setup.

API Gateway --> VPC LINK(NLB) --> ALB --> ECS Fargate Service
