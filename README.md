# API Proxy

TODO Description

## Config

```
port?: number
securePort?: number
secureCertificate?: path
secureCertificateKey?: path

routes:
    - path: /hello
      method: GET | POST | PUT | PATCH | DELETE | OPTIONS
      body?: string | json object
      file?: path
      statusCode?: number
      useRegex?: boolean
      delay?: number
```
