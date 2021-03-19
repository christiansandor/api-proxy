import { config$ } from './config';
import { NextFunction, Request, Response, Router } from 'express';
import * as queryString from 'querystring';
import { parse } from 'querystring';
import { getFullPath } from './utils';
import { Config, ConfigRoute } from './dto/config.dto';
import * as request from 'request';

const router = Router();

let config: Config;
config$.subscribe(newConfig => config = newConfig);

const handleRoute = (route: ConfigRoute, req: Request, res: Response, next: NextFunction) => {
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

    req
      .pipe(
        request(route.proxyUrl, { qs })
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
      res.setHeader('Content-Type', route.contentType || (typeof route.body === 'string' ? 'text/html' : 'application/json'));
      res.send(route.body);
    } else if (route.file) {
      res.sendFile(getFullPath(route.file));
    } else {
      res.send();
    }
  }, route.delay);
};

router.use((req, res, next) => {
  if (!config) {
    return next(new Error('Invalid or missing config'));
  }

  const url = req.url.split('?')[0].replace(/\/$/, '');
  const reqMethod = req.method.toUpperCase();
  const route = config.routes.find(configRoute => {
    const { path, useRegex, method } = configRoute;
    if (method && reqMethod !== method) {
      return false;
    }

    if (useRegex) {
      return configRoute.regex.test(url);
    }

    return url === path.split('?')[0].replace(/\/$/, '');
  });

  if (!route) {
    return next();
  }

  const qs = route.path.split('?').slice(1).join('?');
  if (qs) {
    const query = parse(qs);
    const every = Object.keys(query).every(queryKey => query[queryKey] === req.query[queryKey]);
    if (!every) {
      return next();
    }
  }

  handleRoute(route, req, res, next);
});

export { router };
