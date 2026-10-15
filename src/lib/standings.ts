const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const pending = new Map<string, Promise<Response>>();

// Share concurrent dashboard reads without caching results or failed requests.
// Each caller gets its own response body to consume.
export async function fetchStandings(kind: 'drivers' | 'constructors'): Promise<Response> {
  let request = pending.get(kind);
  if (!request) {
    const endpoint = kind === 'drivers'
      ? '/drivers/get-all-drivers-season-rankings'
      : '/constructors/get-all-constructors-season-rankings';
    request = fetch(`${BACKEND_URL}${endpoint}`)
      .then(response => {
        if (!response.ok) throw new Error(`Standings request failed (${response.status})`);
        return response;
      })
      .finally(() => pending.delete(kind));
    pending.set(kind, request);
  }
  return (await request).clone();
}
