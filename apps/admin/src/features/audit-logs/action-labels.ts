import type { Locale } from '@/lib/i18n';

/** Visual/semantic group of an audit action; drives icons and colors. */
export type AuditCategory =
  | 'content'
  | 'publishing'
  | 'media'
  | 'security'
  | 'people'
  | 'site'
  | 'comments'
  | 'taxonomy'
  | 'system';

interface AuditActionInfo {
  readonly en: string;
  readonly bn: string;
  readonly category: AuditCategory;
}

/**
 * Every action the API records (see the audit calls in apps/api), with a
 * human label in both admin languages. Unknown actions fall back to a
 * humanized code, so a new backend action never shows as a raw `a.b_c`.
 */
const ACTIONS: Readonly<Record<string, AuditActionInfo>> = {
  'auth.bootstrap': { en: 'Super admin created', bn: 'সুপার অ্যাডমিন তৈরি', category: 'security' },
  'auth.failed_login': { en: 'Failed sign-in attempt', bn: 'সাইন-ইন ব্যর্থ', category: 'security' },
  'auth.login': { en: 'Signed in', bn: 'সাইন-ইন করেছেন', category: 'security' },
  'auth.logout': { en: 'Signed out', bn: 'সাইন-আউট করেছেন', category: 'security' },
  'auth.password_change_failed': {
    en: 'Password change failed',
    bn: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ',
    category: 'security',
  },
  'auth.password_changed': {
    en: 'Password changed',
    bn: 'পাসওয়ার্ড পরিবর্তন হয়েছে',
    category: 'security',
  },
  'role.assigned': { en: 'Role assigned', bn: 'ভূমিকা প্রদান', category: 'security' },
  'role.revoked': { en: 'Role revoked', bn: 'ভূমিকা প্রত্যাহার', category: 'security' },

  'user.avatar_update': {
    en: 'Profile photo updated',
    bn: 'প্রোফাইল ছবি আপডেট',
    category: 'people',
  },
  'user.created': { en: 'User created', bn: 'ইউজার তৈরি', category: 'people' },
  'user.updated': { en: 'User updated', bn: 'ইউজার আপডেট', category: 'people' },

  'post.create': { en: 'Post created', bn: 'পোস্ট তৈরি', category: 'content' },
  'post.update': { en: 'Post updated', bn: 'পোস্ট আপডেট', category: 'content' },
  'post.delete': { en: 'Post deleted', bn: 'পোস্ট মুছে ফেলা হয়েছে', category: 'content' },
  restored: { en: 'Item restored', bn: 'পুনরুদ্ধার করা হয়েছে', category: 'content' },

  'publication.create': { en: 'Publication created', bn: 'প্রকাশনা তৈরি', category: 'publishing' },
  'publication.publish': { en: 'Published', bn: 'প্রকাশিত', category: 'publishing' },
  'publication.publish_immediate': {
    en: 'Published now',
    bn: 'এখনই প্রকাশিত',
    category: 'publishing',
  },
  'publication.schedule': {
    en: 'Publication scheduled',
    bn: 'প্রকাশনা শিডিউল করা হয়েছে',
    category: 'publishing',
  },
  'publication.reschedule': {
    en: 'Publication rescheduled',
    bn: 'প্রকাশনার সময় বদলানো হয়েছে',
    category: 'publishing',
  },
  'publication.cancel_schedule': {
    en: 'Schedule cancelled',
    bn: 'শিডিউল বাতিল',
    category: 'publishing',
  },
  'publication.scheduled_publish': {
    en: 'Scheduled post went live',
    bn: 'শিডিউল করা পোস্ট প্রকাশিত হয়েছে',
    category: 'publishing',
  },
  'publication.submit_review': {
    en: 'Submitted for review',
    bn: 'রিভিউয়ের জন্য জমা',
    category: 'publishing',
  },
  'publication.unpublish': { en: 'Unpublished', bn: 'প্রকাশ প্রত্যাহার', category: 'publishing' },
  'publication.update_live': {
    en: 'Live publication updated',
    bn: 'প্রকাশিত কনটেন্ট আপডেট',
    category: 'publishing',
  },
  'publication.archive': {
    en: 'Publication archived',
    bn: 'প্রকাশনা আর্কাইভ করা হয়েছে',
    category: 'publishing',
  },
  'publication.restore': {
    en: 'Publication restored',
    bn: 'প্রকাশনা পুনরুদ্ধার',
    category: 'publishing',
  },

  'media.create': { en: 'Media added', bn: 'মিডিয়া যোগ', category: 'media' },
  'media.upload': { en: 'Media uploaded', bn: 'মিডিয়া আপলোড', category: 'media' },
  'media.update': { en: 'Media updated', bn: 'মিডিয়া আপডেট', category: 'media' },
  'media.delete': { en: 'Media deleted', bn: 'মিডিয়া মুছে ফেলা হয়েছে', category: 'media' },

  'comment.created': { en: 'New comment received', bn: 'নতুন মন্তব্য এসেছে', category: 'comments' },
  'comment.status_updated': { en: 'Comment moderated', bn: 'মন্তব্য মডারেট', category: 'comments' },
  'comment.batch_status_updated': {
    en: 'Comments moderated in bulk',
    bn: 'একসাথে মন্তব্য মডারেট',
    category: 'comments',
  },
  'comment.deleted': {
    en: 'Comment deleted',
    bn: 'মন্তব্য মুছে ফেলা হয়েছে',
    category: 'comments',
  },
  'newsletter.subscribed': {
    en: 'New newsletter subscriber',
    bn: 'নতুন নিউজলেটার সাবস্ক্রাইবার',
    category: 'comments',
  },

  'category.create': { en: 'Category created', bn: 'ক্যাটাগরি তৈরি', category: 'taxonomy' },
  'category.update': { en: 'Category updated', bn: 'ক্যাটাগরি আপডেট', category: 'taxonomy' },
  'category.delete': {
    en: 'Category deleted',
    bn: 'ক্যাটাগরি মুছে ফেলা হয়েছে',
    category: 'taxonomy',
  },
  'tag.create': { en: 'Tag created', bn: 'ট্যাগ তৈরি', category: 'taxonomy' },
  'tag.update': { en: 'Tag updated', bn: 'ট্যাগ আপডেট', category: 'taxonomy' },
  'tag.delete': { en: 'Tag deleted', bn: 'ট্যাগ মুছে ফেলা হয়েছে', category: 'taxonomy' },

  'site.create': { en: 'Site created', bn: 'সাইট তৈরি', category: 'site' },
  'site.update': { en: 'Site updated', bn: 'সাইট আপডেট', category: 'site' },
  'site.delete': { en: 'Site deleted', bn: 'সাইট মুছে ফেলা হয়েছে', category: 'site' },
  'site.update_branding': {
    en: 'Site branding updated',
    bn: 'সাইটের ব্র্যান্ডিং আপডেট',
    category: 'site',
  },
  'site.update_locales': {
    en: 'Site languages updated',
    bn: 'সাইটের ভাষা আপডেট',
    category: 'site',
  },
  'site.update_navigation': {
    en: 'Site navigation updated',
    bn: 'সাইটের নেভিগেশন আপডেট',
    category: 'site',
  },
  'site.update_seo': { en: 'Site SEO updated', bn: 'সাইটের SEO আপডেট', category: 'site' },
  'site.update_settings': {
    en: 'Site settings updated',
    bn: 'সাইটের সেটিংস আপডেট',
    category: 'site',
  },
  'domain.create': { en: 'Domain added', bn: 'ডোমেন যোগ', category: 'site' },
  'domain.update': { en: 'Domain updated', bn: 'ডোমেন আপডেট', category: 'site' },
  'domain.delete': { en: 'Domain removed', bn: 'ডোমেন সরানো হয়েছে', category: 'site' },
  'domain.verify': { en: 'Domain verified', bn: 'ডোমেন যাচাই সম্পন্ন', category: 'site' },
  'platform.settings_updated': {
    en: 'Platform settings updated',
    bn: 'প্ল্যাটফর্ম সেটিংস আপডেট',
    category: 'site',
  },

  'retention.purge': { en: 'Old records purged', bn: 'পুরোনো রেকর্ড পরিষ্কার', category: 'system' },
};

const PREFIX_CATEGORY: Readonly<Record<string, AuditCategory>> = {
  auth: 'security',
  role: 'security',
  user: 'people',
  post: 'content',
  publication: 'publishing',
  media: 'media',
  comment: 'comments',
  newsletter: 'comments',
  category: 'taxonomy',
  tag: 'taxonomy',
  site: 'site',
  domain: 'site',
  platform: 'site',
};

/** `user.avatar_update` → `User avatar update`. */
export function humanizeAuditAction(action: string): string {
  const text = action.replace(/[._]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'System event';
}

export interface AuditActionDescription {
  readonly label: string;
  readonly category: AuditCategory;
}

export function describeAuditAction(action: string, locale: Locale = 'en'): AuditActionDescription {
  const known = ACTIONS[action];
  if (known) return { label: known[locale], category: known.category };

  const prefix = action.split('.')[0] ?? '';
  return {
    label: humanizeAuditAction(action),
    category: PREFIX_CATEGORY[prefix] ?? 'system',
  };
}
