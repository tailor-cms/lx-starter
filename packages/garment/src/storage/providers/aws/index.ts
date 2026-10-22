import type { FileStorage, FileStorageConfig } from '../../interfaces';
import type { GetObjectResponse } from '../../types';

import path from 'node:path';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime-types';

/**
 * Check if error is a "not found" error
 */
function isNotFoundError(err: any): boolean {
  return err.name === 'NoSuchKey' ||
    err.name === 'NotFound' ||
    err.$metadata?.httpStatusCode === 404;
}

/**
 * Convert SDK stream to Buffer
 * AWS SDK v3 returns web streams that need conversion
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  if (Buffer.isBuffer(stream)) {
    return stream;
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

class AWS implements FileStorage {
  #bucket: string;
  #client: S3Client;

  constructor(storage: FileStorageConfig) {
    this.#bucket = storage.bucket;

    // Ensure endpoint has protocol if provided
    let endpoint = storage.aws.endpoint;
    if (
      endpoint &&
      !endpoint.startsWith('http://') &&
      !endpoint.startsWith('https://')
    ) {
      endpoint = `https://${endpoint}`;
    }

    // Create S3Client with v3 configuration
    this.#client = new S3Client({
      credentials: {
        accessKeyId: storage.aws.keyId,
        secretAccessKey: storage.aws.secretKey,
      },
      endpoint,
      forcePathStyle: storage.aws.forcePathStyle,
      region: storage.aws.region,
      maxAttempts: 3,
      apiVersion: '2006-03-01',
    });
  }

  public async listObjects(key: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.#bucket,
      Prefix: key,
    });
    const response = await this.#client.send(command);
    const files = response.Contents || [];
    return files.map((it) => it.Key).filter(Boolean) as string[];
  }

  public async getObject(key: string): Promise<GetObjectResponse<string>> {
    const command = new GetObjectCommand({
      Bucket: this.#bucket,
      Key: key,
    });
    try {
      const response = await this.#client.send(command);
      // Convert stream to buffer
      const raw = response.Body ? await streamToBuffer(response.Body) : Buffer.from('');
      const content = raw.toString('utf8');
      return { content, raw };
    } catch (err: any) {
      // Add the key and bucket to the error for debugging
      err.message = `${err.message} (Bucket: ${this.#bucket}, Key: ${key})`;
      throw err;
    }
  }

  public async getJSON(key: string): Promise<any> {
    const { content } = await this.getObject(key);
    return JSON.parse(content);
  }

  public async saveObject(key: string, data: string | Buffer): Promise<void> {
    const contentType = mime.contentType(path.extname(key)) || undefined;
    const body = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const command = new PutObjectCommand({
      Bucket: this.#bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.#client.send(command);
  }

  public async copyObject(key: string, newKey: string): Promise<void> {
    const { base, ...rest } = path.parse(key);
    const encodedSource = path.format({ base: encodeURIComponent(base), ...rest });
    const command = new CopyObjectCommand({
      Bucket: this.#bucket,
      CopySource: this.path(`/${encodedSource}`),
      Key: newKey,
    });
    await this.#client.send(command);
  }

  public async copyDirectory(dirPath: string, newDirPath: string): Promise<void> {
    const fileNames = await this.listObjects(dirPath);
    await Promise.all(
      fileNames.map((fileName: string) => {
        const relativePath = fileName.substring(dirPath.length, fileName.length);
        const dst = path.join(newDirPath, relativePath);
        return this.copyObject(fileName, dst);
      }),
    );
  }

  public async moveObject(key: string, newKey: string): Promise<void> {
    await this.copyObject(key, newKey);
    await this.deleteObject(key);
  }

  public async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.#bucket,
      Key: key,
    });
    await this.#client.send(command);
  }

  public async deleteObjects(keys: string[]): Promise<void> {
    const command = new DeleteObjectsCommand({
      Bucket: this.#bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    });
    await this.#client.send(command);
  }

  public async doesObjectExist(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.#bucket,
        Key: key,
      });
      await this.#client.send(command);
      return true;
    } catch (err: any) {
      if (isNotFoundError(err)) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Generate pre-signed URL for S3 object
   * This is a LOCAL computation using AWS Signature V4 algorithm
   * NO network request is made - signature is computed locally
   * @param key - S3 object key
   * @param secondsAvailable - URL validity in seconds (default: 3600 = 1 hour)
   * @returns Promise<string> - Pre-signed URL
   */
  public async getSignedObjectUrl(key: string, secondsAvailable = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.#bucket,
      Key: key,
    });
    // getSignedUrl computes signature LOCALLY - no network request
    // It uses HMAC-SHA256 with AWS credentials to create signed URL
    return getSignedUrl(this.#client, command, {
      expiresIn: secondsAvailable,
    });
  }

  private path(segment: string): string {
    return path.join(this.#bucket, segment);
  }
}

export default AWS;
