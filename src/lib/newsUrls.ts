export const safeArticleUrl = (value: string): string | undefined => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !['formula1.com', 'www.formula1.com'].includes(url.hostname) ||
        !url.pathname.startsWith('/en/latest/')) return undefined;
    return url.href;
  } catch { return undefined; }
};

export const safeImageUrl = (value: string | undefined): string | undefined => {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
};
