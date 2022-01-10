# API Proxy

TODO Description

## Config

```
port?: number - Port the http service will use
securePort?: number - Port the https service will use
secureCertificate?: path - Absolute or relative path to certificate
secureCertificateKey?: path - Absolute or relative path to private key

cache:
    {name}: any

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
      useRegex?: boolean - Enable the use of Regular Expressions in the path
```

When using query parameters (e.g. the `path` includes `?key=value`) then these parameters
will be matched against the requested URL and the route will be activated only when all
the parameters match.

### Configuration variables

With some properties, you can use variables from other properties that as described in the
tables below. You cannot use variables in the `path` with `useRegex`.

| Variable name | Description |
|---|---|
| $body | POST or PUT body |
| $cache | Cache objects you described in config and / or in routes |
| $path | Resolved URL path that is called in the API |
| $query | Query parameters as an object |
| $method | Method called in the API |

| Property | Variables available on property |
|---|---|
| path | `$body` `$cache` `$method` |
| file | `$path` `$cache` `$query` `$method` |
| body (has to be a string to use variables) | `$path` `$cache` `$query` `$method` |
| proxyUrl | `$path` `$body` `$cache` `$query` `$method` |

### Using cache

TODO
