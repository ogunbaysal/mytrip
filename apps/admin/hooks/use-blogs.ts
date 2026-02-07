import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  heroImageId: string | null;
  featuredImageId: string | null;
  heroImage: string | null;
  featuredImage: string | null;
  images: string[];
  imageFileIds?: string[];
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  tags: string[];
  status: "published" | "draft" | "archived" | "pending_review";
  featured: boolean;
  authorId: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  publishedAt: string | null;
  views: number;
  readTime: number | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  language: "tr" | "en";
  createdAt: string;
  updatedAt: string;
};

export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  blogCount?: number;
};

export type BlogComment = {
  id: string;
  blogId: string;
  blogTitle?: string | null;
  blogSlug?: string | null;
  userId: string | null;
  userName?: string | null;
  userEmail?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  content: string;
  status: "pending" | "published" | "rejected" | "spam";
  adminNote: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BlogParams = {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  status?: string;
  language?: string;
  featured?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type BlogCommentsParams = {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  blogId?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type BlogsResponse = {
  blogPosts: BlogPost[];
  pagination: Pagination;
};

type BlogCommentsResponse = {
  comments: BlogComment[];
  pagination: Pagination;
};

type BlogStats = {
  totalPosts: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageReadTime: number;
  recentPosts: number;
  publishedPosts: number;
};

export function useBlogs(params: BlogParams) {
  return useQuery({
    queryKey: ["blogs", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
      return apiFetch<BlogsResponse>(`/api/admin/blog?${searchParams.toString()}`);
    },
  });
}

export function useBlog(postId: string) {
  return useQuery({
    queryKey: ["blogs", postId],
    queryFn: async () => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}`).then(
        (res) => res.blogPost,
      );
    },
    enabled: !!postId,
  });
}

export function useBlogStats() {
  return useQuery({
    queryKey: ["blogs", "stats"],
    queryFn: async () => {
      return apiFetch<{ stats: BlogStats }>(`/api/admin/blog/stats`).then(
        (res) => res.stats,
      );
    },
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blogData: any) => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog`, {
        method: "POST",
        body: JSON.stringify(blogData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", "stats"] });
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      data,
    }: {
      postId: string;
      data: Partial<BlogPost>;
    }) => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["blogs", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
    },
  });
}

export function useUpdateBlogStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      status,
    }: {
      postId: string;
      status: string;
    }) => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["blogs", "stats"] });
    },
  });
}

export function useToggleBlogFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}/feature`, {
        method: "PATCH",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", variables] });
      queryClient.invalidateQueries({ queryKey: ["blogs", "stats"] });
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Blog categories
// ---------------------------------------------------------------------------

export function useBlogCategories(params?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: ["blog-categories", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.includeInactive) query.set("includeInactive", "true");
      const endpoint = `/api/admin/blog/categories${query.toString() ? `?${query.toString()}` : ""}`;
      return apiFetch<{ categories: BlogCategory[] }>(endpoint).then((res) => res.categories);
    },
  });
}

export function useBlogCategory(id: string) {
  return useQuery({
    queryKey: ["blog-category", id],
    queryFn: async () => {
      return apiFetch<{ category: BlogCategory }>(`/api/admin/blog/categories/${id}`).then(
        (res) => res.category,
      );
    },
    enabled: !!id,
  });
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<BlogCategory>) => {
      return apiFetch<{ category: BlogCategory }>(`/api/admin/blog/categories`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
    },
  });
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<BlogCategory>;
    }) => {
      return apiFetch<{ category: BlogCategory }>(`/api/admin/blog/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["blog-category", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/admin/blog/categories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Blog comments moderation
// ---------------------------------------------------------------------------

export function useBlogComments(params: BlogCommentsParams) {
  return useQuery({
    queryKey: ["blog-comments", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
      return apiFetch<BlogCommentsResponse>(
        `/api/admin/blog/comments?${searchParams.toString()}`,
      );
    },
  });
}

export function useBlogComment(commentId: string) {
  return useQuery({
    queryKey: ["blog-comment", commentId],
    queryFn: async () => {
      return apiFetch<{ comment: BlogComment }>(`/api/admin/blog/comments/${commentId}`).then(
        (res) => res.comment,
      );
    },
    enabled: !!commentId,
  });
}

export function useUpdateBlogComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      payload,
    }: {
      commentId: string;
      payload: Partial<BlogComment>;
    }) => {
      return apiFetch<{ comment: BlogComment }>(`/api/admin/blog/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
      queryClient.invalidateQueries({ queryKey: ["blog-comment", variables.commentId] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });
}

export function useDeleteBlogComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      return apiFetch<{ success: boolean }>(`/api/admin/blog/comments/${commentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", "stats"] });
    },
  });
}
