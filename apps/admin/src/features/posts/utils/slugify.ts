/** URL slug suggestion from a post title: "Hello, World!" → "hello-world". */
export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'post'
  );
}
