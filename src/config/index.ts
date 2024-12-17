const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://station42.vercel.app';
};

const sanitizeUrl = (url: string) => {
  return url.replace(/([^:]\/)\/+/g, "$1").replace(/\/$/, '');
};

const baseUrl = getBaseUrl();

export const config = {
  baseUrl,
  socketUrl: baseUrl,
  api: {
    orders: sanitizeUrl(`${baseUrl}/api/orders`),
    sessions: sanitizeUrl(`${baseUrl}/api/sessions`),
  },
  socket: {
    options: {
      path: '/api/socketio',
      transports: ['websocket'],
      secure: true,
      rejectUnauthorized: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    },
  },
} as const; 