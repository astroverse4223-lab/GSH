// Environment configuration for different stages
export const config = {
  development: {
    database: {
      type: "mongodb",
      url: process.env.MONGODB_URI_DEV,
    },
    storage: {
      type: "local",
      path: "./public/uploads",
    },
    cache: {
      type: "memory",
    },
  },

  staging: {
    database: {
      type: "mongodb",
      url: process.env.MONGODB_URI_STAGING,
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      },
    },
    storage: {
      type: "s3",
      bucket: process.env.AWS_S3_BUCKET_STAGING,
      region: process.env.AWS_REGION,
      cdnUrl: process.env.CLOUDFRONT_URL_STAGING,
    },
    cache: {
      type: "redis",
      url: process.env.REDIS_URL_STAGING,
    },
  },

  production: {
    database: {
      type: "postgresql", // Future migration target
      url: process.env.DATABASE_URL,
      options: {
        ssl: true,
        connectionLimit: 20,
      },
    },
    storage: {
      type: "s3",
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      cdnUrl: process.env.CLOUDFRONT_URL,
    },
    cache: {
      type: "redis",
      url: process.env.REDIS_URL,
      cluster: true,
    },
    search: {
      type: "elasticsearch",
      url: process.env.ELASTICSEARCH_URL,
    },
  },
};

export const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || "development";
  return config[env as keyof typeof config];
};
