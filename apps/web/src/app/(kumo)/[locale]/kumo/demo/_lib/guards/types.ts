/**
 * One request a sample page tried to make, after the fetch guard caught it.
 * `path` has no leading slash and no query string.
 */
export interface SampleRequest {
  /** "api" for the central API, "server" for an Appbox server's own API. */
  target: "api" | "server"
  method: string
  path: string
  params: URLSearchParams
}

/**
 * Sample answers for one feature's requests. Return the JSON body to answer
 * with, or `undefined` to leave the request to the next handler. Requests that
 * no handler answers get an empty list (reads) or a refusal (writes), so a
 * handler never needs to cover writes.
 */
export type SampleHandler = (request: SampleRequest) => unknown | undefined
