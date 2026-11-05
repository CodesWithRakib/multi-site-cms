import type { PostKind } from '../utils/post-display';

const KIND_BADGE: Record<PostKind, string> = {
  travel:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
  air: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
  other:
    'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80',
};

export function PostTypeBadge({ kind, type }: { readonly kind: PostKind; readonly type: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${KIND_BADGE[kind]}`}
    >
      {type.replace('_', ' ')}
    </span>
  );
}
