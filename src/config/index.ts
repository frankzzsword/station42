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

export const config = {
  baseUrl: getBaseUrl(),
  api: {
    orders: `${getBaseUrl()}/api/orders`,
    sessions: `${getBaseUrl()}/api/sessions`,
  },
} as const; 