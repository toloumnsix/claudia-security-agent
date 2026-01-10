import { routeElizaApiRequest } from '../server/index.mjs';

export default async function handler(request, response) {
    return routeElizaApiRequest(request, response);
}