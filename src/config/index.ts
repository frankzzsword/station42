const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  if (process.env.VERCEL_URL) {
    // Reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    // Reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  }
  // Assume localhost
  return `http://localhost:${process.env.PORT || 3001}`;
};

const sanitizeUrl = (url: string) => {
  return url.replace(/([^:]\/)\/+/g, "$1").replace(/\/$/, '');
};

const baseUrl = getBaseUrl();

export const config = {
  baseUrl,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || baseUrl,
  api: {
    orders: sanitizeUrl(`${baseUrl}/api/orders`),
    sessions: sanitizeUrl(`${baseUrl}/api/sessions`),
  },
  socket: {
    options: {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    },
  },
} as const; 