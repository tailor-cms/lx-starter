# Infrastructure Deployment

AWS infrastructure provisioning for the LX platform using Pulumi and TypeScript.

## 🏗️ Architecture Overview

This infrastructure deploys:
- **Database**: PostgreSQL RDS instance with automated backups
- **Application**: Containerized NestJS backend with auto-scaling
- **Networking**: VPC, subnets, security groups, load balancer
- **DNS**: Route53 hosted zone and SSL certificates
- **Secrets**: AWS Systems Manager Parameter Store for sensitive data
- **Monitoring**: CloudWatch logs and metrics

## 📋 Prerequisites

### Required Tools
```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Install AWS CLI
# macOS: brew install awscli
# Linux: pip install awscli

# Install Node.js 22+ and pnpm  
# macOS: brew install node pnpm
```

### AWS Account Setup
1. **AWS Account** with administrative access
2. **AWS CLI configured** with appropriate credentials:
   ```bash
   aws configure
   ```
3. **Domain name** registered and managed in Route53
4. **Hosted Zone ID** for your domain

## 🛠️ Configuration

### Deployment Modes

This infrastructure supports two deployment modes:

1. **Standalone Mode** (default): Creates all resources (VPC, database, ECS cluster)
2. **Shared Infrastructure Mode**: Reuses existing VPC, database instance, and ECS cluster from another Tailor stack

### 1. Update Pulumi Configuration

#### Standalone Mode
Edit `Pulumi.prod.yaml` with your specific values:

```yaml
config:
  aws:region: us-east-1                           # Your preferred AWS region
  dns:domain: your-domain.com                     # Your domain name
  dns:hostedZoneId: Z1234567890ABCDEF             # Your Route53 hosted zone ID
  mail:host: email-smtp.us-east-1.amazonaws.com   # Your SMTP host
  mail:senderAddress: noreply@your-domain.com     # Your sender email
  ssm:keyPrefix: app/dev                          # SSM parameter prefix
  lx:resourceNamePrefix: lx                       # Resource naming prefix
  # Garment (S3 storage) configuration (optional)
  garment:region: us-east-1                       # S3 bucket region
  garment:bucket: your-content-bucket             # S3 bucket name for content files
```

#### Shared Infrastructure Mode
To reuse existing infrastructure from another stack:

```yaml
config:
  aws:region: us-east-1
  dns:domain: lx.your-domain.com
  dns:hostedZoneId: Z1234567890ABCDEF
  mail:host: email-smtp.us-east-1.amazonaws.com
  mail:senderAddress: noreply@your-domain.com
  ssm:keyPrefix: lx/prod
  lx:resourceNamePrefix: lx
  # Reference the shared stack (format: organization/project/stack)
  lx:sharedStackRef: your-org/tailor-cms/prod
  # Garment (S3 storage) configuration
  garment:region: us-east-1
  garment:bucket: your-content-bucket
```

**What gets reused:**
- ✅ VPC and networking (subnets, security groups)
- ✅ PostgreSQL RDS instance (a new "lx" database will be created within it)
- ✅ ECS cluster

**What gets created:**
- 🆕 ECR repository and Docker image
- 🆕 Application Load Balancer
- 🆕 ECS service
- 🆕 "lx" database within the shared PostgreSQL instance
- 🆕 Route53 DNS records

### 2. Set Up AWS Secrets
Store sensitive configuration in AWS Systems Manager Parameter Store:

```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Set your SSM key prefix (match Pulumi.dev.yaml)
export SSM_PREFIX="app/dev"

# Create secure parameters
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/AUTH_JWT_SECRET" \
  --value "your-super-secure-jwt-secret-here" \
  --type "SecureString" \
  --description "JWT secret for authentication"

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/MAIL_USER" \
  --value "your-smtp-username" \
  --type "SecureString" \
  --description "SMTP authentication username"

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/MAIL_PASSWORD" \
  --value "your-smtp-password" \
  --type "SecureString" \
  --description "SMTP authentication password"

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/SENTRY_DSN" \
  --value "your-sentry-dsn" \
  --type "SecureString" \
  --description "Sentry DSN for error tracking"

# Database password
# For standalone mode: This will be used to create the database
# For shared mode: This should be the password for the shared database instance
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/DATABASE_PASSWORD" \
  --value "your-database-password" \
  --type "SecureString" \
  --description "Database password"

# Google OAuth credentials (optional - only if enabling Google SSO)
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/GOOGLE_CLIENT_ID" \
  --value "your-google-client-id" \
  --type "SecureString" \
  --description "Google OAuth Client ID"

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/GOOGLE_CLIENT_SECRET" \
  --value "your-google-client-secret" \
  --type "SecureString" \
  --description "Google OAuth Client Secret"

# Garment (S3 storage) credentials
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/GARMENT_KEY" \
  --value "your-aws-access-key-id" \
  --type "SecureString" \
  --description "AWS Access Key ID for S3 storage"

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/GARMENT_SECRET" \
  --value "your-aws-secret-access-key" \
  --type "SecureString" \
  --description "AWS Secret Access Key for S3 storage"
```

**Note for Shared Infrastructure Mode:**
- The `DATABASE_PASSWORD` must be the password for the shared PostgreSQL instance
- The infrastructure will automatically create a new "lx" database within the shared instance
- Ensure you have network connectivity from your deployment environment to the database for the initial setup
- `DATABASE_SHARED_DEFAULT_DB_NAME` should be set

### 3. Verify Domain Setup
Ensure your domain is properly configured:
```bash
# Check if your domain's hosted zone exists
aws route53 list-hosted-zones-by-name --dns-name your-domain.com

# Note the HostedZoneId for your Pulumi configuration
```

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
cd infrastructure
pnpm install
```

### 2. Initialize Pulumi Stack
```bash
# Login to Pulumi (choose your backend)
pulumi login  # For Pulumi Service (free tier available)
# OR
pulumi login --local  # For local state management

# Initialize the stack
pulumi stack init prod
```

### 3. Preview Deployment
```bash
# Preview what will be created
pulumi preview

# Review the planned changes carefully
# Ensure all configurations look correct
```

### 4. Deploy Infrastructure
```bash
# Deploy the infrastructure
pulumi up

# Type 'yes' when prompted to confirm deployment
# This process typically takes 10-15 minutes
```

### 5. Verify Deployment
```bash
# Check deployment status
pulumi stack output

# Test the application endpoint
curl https://your-domain.com/api/health
```

## 📊 Post-Deployment

### Application Access
- **API Endpoint**: `https://your-domain.com/api`
- **Health Check**: `https://your-domain.com/api/health`
- **API Documentation**: `https://your-domain.com/api/docs`

### Enabling Google OAuth (Optional)

To enable Google OAuth SSO for your deployment:

#### 1. Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Select **Web application** as application type
7. Add authorized redirect URI: `https://your-domain.com/api/oidc/callback`
8. Save and note your Client ID and Client Secret

#### 2. Update SSM Parameters
```bash
# Set your SSM prefix (match your Pulumi configuration)
export SSM_PREFIX="lx/prod"
export AWS_REGION="us-east-1"

# Update Google OAuth credentials
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/GOOGLE_CLIENT_ID" \
  --value "your-google-client-id.apps.googleusercontent.com" \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/GOOGLE_CLIENT_SECRET" \
  --value "your-google-client-secret" \
  --type "SecureString" \
  --overwrite
```

### Database Access
The database is only accessible from within the VPC for security. To connect:

1. **Via Application**: The deployed app automatically connects
2. **For Management**: Use an EC2 bastion host or VPN connection
3. **Database Details**: Available in Pulumi stack outputs

### Logs and Monitoring
```bash
# View application logs
aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/app-starter"

# Follow real-time logs
aws logs tail "/aws/ecs/app-starter" --follow
```

### Running Backend Scripts (Invite Admin)

To execute backend scripts like inviting an admin user on the deployed ECS service:

#### 1. Get your cluster name from Pulumi stack outputs
```bash
cd infrastructure
pulumi stack output ecsClusterName
# Example output: tailor-cms-prod-ecs-cluster (or lx-prod-ecs-cluster if standalone)
```

#### 2. Find the LX service in the cluster
```bash
CLUSTER_NAME="tailor-cms-prod-ecs-cluster"  # Replace with your cluster name
SERVICE_NAME=$(aws ecs list-services --cluster $CLUSTER_NAME --query 'serviceArns[*]' --output text | tr '\t' '\n' | grep lx | awk -F/ '{print $NF}')
echo "LX Service: $SERVICE_NAME"
```

#### 3. Find the running task and container for LX service
```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --desired-status RUNNING --query 'taskArns[0]' --output text)
TASK_ID=$(echo $TASK_ARN | awk -F/ '{print $NF}')

# Get container name (first container with "lx" in the name)
CONTAINER_NAME=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ID --query "tasks[0].containers[?contains(name, 'lx')].name | [0]" --output text)

echo "Task ID: $TASK_ID"
echo "Container name: $CONTAINER_NAME"
```

#### 4. Connect to the ECS task
```bash
aws ecs execute-command \
  --cluster $CLUSTER_NAME \
  --task $TASK_ID \
  --container $CONTAINER_NAME \
  --command "/bin/sh" \
  --interactive
```

#### 4. Once inside the container, run the invite script
```bash
cd /apps/backend
node scripts/invite-admin.js --email admin@example.com
```

#### One-liner alternative (execute command directly)
```bash
aws ecs execute-command \
  --cluster $CLUSTER_NAME \
  --task $TASK_ID \
  --container lx-backend \
  --interactive \
  --command "cd /app/apps/backend && node scripts/invite-admin.js --email admin@example.com"
```

**Prerequisites:**
- ECS Exec must be enabled on your service (managed by WebServer component)
- AWS Session Manager plugin must be installed: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
- Your IAM user/role must have `ecs:ExecuteCommand` permission


## 🔄 Updates and Maintenance

### Updating Infrastructure
```bash
# Make changes to your Pulumi code or configuration
# Preview changes
pulumi preview

# Apply updates
pulumi up
```

### Updating Application
The infrastructure is designed for container-based deployments. Update your application by:

1. Building and pushing a new container image
2. Updating the ECS service to use the new image
3. ECS will perform a rolling update automatically

### Backup and Recovery
- **Database Backups**: Automated daily backups with 7-day retention
- **Point-in-time Recovery**: Available for the database
- **Infrastructure State**: Pulumi state is managed in your chosen backend

## 🔒 Security Considerations

### Network Security
- Application runs in private subnets
- Database is only accessible from application subnets
- Load balancer provides SSL termination
- Security groups restrict access to necessary ports only

### Secrets Management
- All sensitive data stored in AWS Parameter Store (encrypted)
- Database password managed by AWS Secrets Manager
- Application retrieves secrets at runtime
- No secrets stored in code or configuration files

### SSL/TLS
- Automatic SSL certificate provisioning via ACM
- HTTPS enforced for all web traffic
- Secure communication between all components

## 🧹 Cleanup

To destroy the infrastructure:

```bash
# Preview what will be destroyed
pulumi destroy --show-config

# Destroy the infrastructure
pulumi destroy

# Type 'yes' when prompted
# This process typically takes 5-10 minutes
```

**Note**: This will permanently delete all resources including the database. Ensure you have backups if needed.

## 🆘 Troubleshooting

### Common Issues

**Deployment Fails with DNS Errors:**
- Verify your hosted zone ID is correct
- Ensure the domain is properly configured in Route53
- Check that your AWS credentials have Route53 permissions

**Application Not Starting:**
- Check ECS task logs: `aws logs tail "/aws/ecs/app-starter" --follow`
- Verify all required SSM parameters are set
- Ensure database is accessible from application subnets

**SSL Certificate Issues:**
- Certificate validation requires DNS control
- Ensure your domain's nameservers point to Route53
- Certificate provisioning can take 5-10 minutes

**Database Connection Issues:**
- Verify security group rules allow database access
- Check that DATABASE_HOST environment variable is correct
- Ensure database is in the same VPC as the application

### Getting Help
- Check Pulumi stack outputs: `pulumi stack output`
- Review AWS CloudFormation events in the console
- Examine ECS task definitions and service status
- Monitor CloudWatch logs for application errors

### Support Resources
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Project Repository Issues](https://github.com/your-repo/issues)
