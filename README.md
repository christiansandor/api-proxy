# API Proxy

TODO Description

## Config

```
port?: number - Port the http service will use
securePort?: number - Port the https service will use
secureCertificate?: path - Absolute or relative path to certificate
secureCertificateKey?: path - Absolute or relative path to private key

routes:
    - path: string - Full path for endpoint, must start with "/"
      method?: http method - Accepted request method, defaults to all
      body?: json | string - Return body JSON or string
      file?: path - Return file from absolute or relative path
      statusCode?: number - Respond with specific status code
      contentType?: mime type - Respond with specific content type
      useRegex?: boolean - Enable the use of Regular Expressions in the path
      delay?: number - Delay response by milliseconds
      
    - path: string - Full path for endpoint, must start with "/"
      proxyUrl: url - Full URL to proxy
      proxyPassQuery?: boolean - Enable the passing of query parameters to the proxyUrl, defaults to false
      method?: http method - Accepted request method, defaults to all
```
