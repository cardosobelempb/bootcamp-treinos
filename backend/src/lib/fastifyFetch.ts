// lib/fastifyFetch.ts
import { FastifyReply, FastifyRequest } from "fastify";

/**
 * Converte uma requisição Fastify para Fetch API-compatible Request
 */
export function fastifyToFetch(request: FastifyRequest) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  const headers = new Headers();
  Object.entries(request.headers).forEach(([key, value]) => {
    if (value) headers.append(key, value.toString());
  });

  const body =
    request.body && Object.keys(request.body).length > 0
      ? JSON.stringify(request.body)
      : undefined;

  return new Request(url.toString(), {
    method: request.method,
    headers,
    ...(body ? { body } : {}),
  });
}

/**
 * Envia uma Response do Fetch para o Fastify Reply
 */
export async function fetchToFastifyReply(
  reply: FastifyReply,
  response: Response,
) {
  reply.status(response.status);
  response.headers.forEach((value, key) => reply.header(key, value));
  const text = await response.text();
  reply.send(text ? JSON.parse(text) : null);
}
