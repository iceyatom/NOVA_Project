import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

export function getAwsCredentials() {
  if (process.env.NODE_ENV === "production" && process.env.AWS_ROLE_ARN) {
    return awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN,
    });
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return undefined;
}
