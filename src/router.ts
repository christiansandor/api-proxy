import { config$ } from './config';
import { NextFunction, Request, Response, Router } from 'express';
import * as queryString from 'querystring';
import { parse } from 'querystring';
import { getFullPath, resolveVariables } from './utils';
import { Config, ConfigRoute } from './dto/config.dto';
import * as request from 'request';

const router = Router();

let config: Config;
config$.subscribe(newConfig => config = newConfig);

const handleRoute = (route: ConfigRoute, req: Request, res: Response, next: NextFunction) => {
  const { body, query, method, originalUrl } = req;

  if (route.proxyUrl) {
    let qs: any;
    if (route.proxyPassQuery) {
      let proxyUrlQuery = route.proxyUrl.split('?').slice(1).join('?');
      if (proxyUrlQuery) {
        proxyUrlQuery = '?' + proxyUrlQuery;
      }

      qs = {
        ...queryString.parse(proxyUrlQuery),
        ...req.query as any,
      };
    }

    const url = resolveVariables(route.proxyUrl, {
      body,
      query,
      method,
      path: originalUrl,
      cache: config.cache,
    });

    console.log('PROXY URL', url);

    req
      .pipe(
        request(url, { qs })
          .on('error', (error) => next(error)),
      )
      .pipe(res).on('error', (error) => next(error));

    return;
  }

  setTimeout(() => {
    if (route.statusCode) {
      res.status(route.statusCode);
    }

    if (route.body) {
      let routeBody: any = route.body;
      if (typeof routeBody === 'string') {
        routeBody = resolveVariables(routeBody, {
          query,
          method,
          path: originalUrl,
          cache: config.cache,
        });
      }

      res.setHeader('Content-Type', route.contentType || (typeof routeBody === 'string' ? 'text/html' : 'application/json'));
      res.send(routeBody);
    } else if (route.file) {
      const filePath = resolveVariables(route.file, {
        query,
        method,
        path: originalUrl,
        cache: config.cache,
      });

      res.sendFile(getFullPath(filePath));
    } else {
      res.send();
    }
  }, route.delay);
};

router.use((req, res, next) => {
  if (!config) {
    return next(new Error('Invalid or missing config'));
  }

  const reqMethod = req.method.toUpperCase();
  const pathVariables = {
    body: req.body,
    cache: config.cache,
    method: reqMethod,
  };

  const url = req.url.split('?')[0].replace(/\/$/, '');

  const route = config.routes.find(configRoute => {
    const { path, useRegex, method } = configRoute;
    if (method && reqMethod !== method) {
      return false;
    }

    if (useRegex) {
      return configRoute.regex.test(url);
    }

    let isMatch = url === resolveVariables(path, pathVariables).split('?')[0].replace(/\/$/, '');
    if (!isMatch) {
      return false;
    }

    const qs = configRoute.path.split('?').slice(1).join('?');
    if (qs) {
      const query = parse(qs);
      const every = Object.keys(query).every(queryKey => query[queryKey] === req.query[queryKey]);
      if (!every) {
        return false;
      }
    }

    return true;
  });

  if (!route) {
    return next();
  }

  handleRoute(route, req, res, next);
});

export { router };
