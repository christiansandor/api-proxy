export function logSystemMessage(message: any, ...optionalParams: any[]) {
  console.log(`\x1b[32m[api-proxy] ${message}`, ...optionalParams, '\x1b[0m');
}
