export function createPageViewTracker(recordPageView: () => void) {
  let previousPath: string | undefined;
  return (url: string, { shallow = false }: { shallow?: boolean } = {}) => {
    if (shallow) return;
    const path = url.split(/[?#]/, 1)[0];
    if (!path || path === previousPath) return;
    previousPath = path;
    recordPageView();
  };
}
