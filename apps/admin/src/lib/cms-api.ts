'use client';

import type {
  ApiSuccess,
  CategoryItem,
  MediaAssetItem,
  MediaUploadResponse,
  PaginatedResult,
  PostItem,
  PostPreviewData,
  PostPublicationItem,
  PreviewTokenResponse,
  SiteItem,
  TagItem,
} from '@multi-site-cms/types';
import { platformApi } from './store';

export interface CreatePostPayload {
  type: string;
  sourceLocale?: string;
  title: string;
  excerpt?: string;
  body: Record<string, unknown>;
}

export interface UpdatePostPayload {
  expectedRevisionNumber: number;
  type?: string;
  title?: string;
  excerpt?: string;
  body?: Record<string, unknown>;
  changeSummary?: string;
}

export interface CreatePublicationPayload {
  siteId: string;
  slug: string;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  featuredImageId?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface ListPostsParams {
  siteId?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListMediaParams {
  siteId?: string;
  mimeType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const cmsApi = platformApi.injectEndpoints({
  endpoints: (build) => ({
    // Sites
    listSites: build.query<SiteItem[], void>({
      query: () => ({ path: '/sites' }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteItem[],
    }),

    // Posts
    listPosts: build.query<PaginatedResult<PostItem>, ListPostsParams | void>({
      query: (params) => ({
        path: '/posts',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as PaginatedResult<PostItem>,
      providesTags: (result: PaginatedResult<PostItem> | undefined) =>
        result
          ? [
              ...result.items.map((item: PostItem) => ({ type: 'Post' as const, id: item.id })),
              { type: 'Post' as const, id: 'LIST' },
            ]
          : [{ type: 'Post' as const, id: 'LIST' }],
    }),

    getPost: build.query<PostItem, string>({
      query: (postId) => ({ path: `/posts/${postId}` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostItem,
      providesTags: (_result, _error, id) => [{ type: 'Post' as const, id }],
    }),

    createPost: build.mutation<PostItem, CreatePostPayload>({
      query: (body) => ({
        path: '/posts',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostItem,
      invalidatesTags: [{ type: 'Post' as const, id: 'LIST' }],
    }),

    updatePost: build.mutation<PostItem, { postId: string; data: UpdatePostPayload }>({
      query: ({ postId, data }) => ({
        path: `/posts/${postId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostItem,
      invalidatesTags: (_result, _error, { postId }) => [
        { type: 'Post' as const, id: postId },
        { type: 'Post' as const, id: 'LIST' },
      ],
    }),

    deletePost: build.mutation<void, string>({
      query: (postId) => ({
        path: `/posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Post' as const, id: 'LIST' }],
    }),

    // Publications
    createPublication: build.mutation<
      PostPublicationItem,
      { postId: string; data: CreatePublicationPayload }
    >({
      query: ({ postId, data }) => ({
        path: `/posts/${postId}/publications`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_result, _error, { postId }) => [{ type: 'Post' as const, id: postId }],
    }),

    // Preview
    generatePreviewToken: build.mutation<PreviewTokenResponse, { postId: string; siteId?: string }>(
      {
        query: ({ postId, siteId }) => ({
          path: `/posts/${postId}/preview-token`,
          method: 'POST',
          query: siteId ? { siteId } : undefined,
        }),
        transformResponse: (response: ApiSuccess<unknown>) => response.data as PreviewTokenResponse,
      },
    ),

    getPostPreview: build.query<
      PostPreviewData,
      { postId: string; token: string; siteId?: string }
    >({
      query: ({ postId, token, siteId }) => ({
        path: `/posts/${postId}/preview`,
        query: { token, siteId: siteId ?? '' },
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPreviewData,
    }),

    // Media
    listMedia: build.query<PaginatedResult<MediaAssetItem>, ListMediaParams | void>({
      query: (params) => ({
        path: '/media',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as PaginatedResult<MediaAssetItem>,
      providesTags: (result: PaginatedResult<MediaAssetItem> | undefined) =>
        result
          ? [
              ...result.items.map((item: MediaAssetItem) => ({
                type: 'Media' as const,
                id: item.id,
              })),
              { type: 'Media' as const, id: 'LIST' },
            ]
          : [{ type: 'Media' as const, id: 'LIST' }],
    }),

    uploadMedia: build.mutation<MediaUploadResponse, FormData>({
      query: (formData) => ({
        path: '/media/upload',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as MediaUploadResponse,
      invalidatesTags: [{ type: 'Media' as const, id: 'LIST' }],
    }),

    updateMedia: build.mutation<
      MediaAssetItem,
      { mediaId: string; altText?: string; caption?: string }
    >({
      query: ({ mediaId, ...body }) => ({
        path: `/media/${mediaId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as MediaAssetItem,
      invalidatesTags: (_result, _error, { mediaId }) => [
        { type: 'Media' as const, id: mediaId },
        { type: 'Media' as const, id: 'LIST' },
      ],
    }),

    deleteMedia: build.mutation<void, string>({
      query: (mediaId) => ({
        path: `/media/${mediaId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Media' as const, id: 'LIST' }],
    }),

    // Taxonomy
    listCategories: build.query<CategoryItem[], string>({
      query: (siteId) => ({ path: `/sites/${siteId}/categories` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as CategoryItem[],
    }),

    listTags: build.query<TagItem[], string>({
      query: (siteId) => ({ path: `/sites/${siteId}/tags` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as TagItem[],
    }),
  }),
});

export const {
  useListSitesQuery,
  useListPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useCreatePublicationMutation,
  useGeneratePreviewTokenMutation,
  useGetPostPreviewQuery,
  useListMediaQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useListCategoriesQuery,
  useListTagsQuery,
} = cmsApi;
