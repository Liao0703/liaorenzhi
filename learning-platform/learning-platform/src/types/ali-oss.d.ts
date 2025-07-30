declare module 'ali-oss' {
  export interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint: string;
    secure?: boolean;
  }

  export interface PutResult {
    url: string;
    name: string;
    etag: string;
    res: any;
  }

  export interface GetResult {
    content: string | Buffer;
    res: any;
  }

  export interface ListResult {
    objects?: Array<{
      name: string;
      url: string;
      lastModified: Date;
      etag: string;
      type: string;
      size: number;
      storageClass: string;
    }>;
    prefixes?: string[];
    isTruncated: boolean;
    nextContinuationToken?: string;
  }

  export default class OSS {
    constructor(options: OSSOptions);
    
    put(name: string, file: string | Buffer | Blob | File, options?: any): Promise<PutResult>;
    get(name: string, options?: any): Promise<GetResult>;
    head(name: string, options?: any): Promise<any>;
    delete(name: string, options?: any): Promise<any>;
    list(options?: any): Promise<ListResult>;
    signatureUrl(name: string, options?: any): string;
  }
} 