import { Config, config$, ConfigRoute } from './config';
import { Request, Response, Router } from 'express';
import { parse } from 'querystring';
import { getFullPath } from './utils';

const router = Router();

let config: Config;
config$.subscribe(newConfig => config = newConfig);

const handleRoute = (route: ConfigRoute, req: Request, res: Response) => {
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
    if (reqMethod !== method) {
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

  handleRoute(route, req, res);
});

export { router };
