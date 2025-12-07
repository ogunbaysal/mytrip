import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  heroImage: string;
  featuredImage: string;
  images: string | string[]; // JSON string or array
  category: "travel" | "food" | "culture" | "history" | "activity" | "lifestyle" | "business";
  tags: string | string[]; // JSON string or array
  status: "published" | "draft" | "archived" | "pending_review";
  featured: boolean;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  publishedAt: string;
  views: number;
  readTime: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string | string[]; // JSON string or array
  language: "tr" | "en";
  readingLevel: "easy" | "medium" | "hard";
  targetAudience: "travelers" | "locals" | "business_owners" | "all";
  createdAt: string;
  updatedAt: string;
};

type Params = {
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

type BlogsResponse = {
  blogPosts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export function useBlogs(params: Params) {
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
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}`).then(res => res.blogPost);
    },
    enabled: !!postId,
  });
}

export function useBlogStats() {
  return useQuery({
    queryKey: ["blogs", "stats"],
    queryFn: async () => {
      return apiFetch<{ stats: BlogStats }>(`/api/admin/blog/stats`).then(res => res.stats);
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
    mutationFn: async ({ postId, data }: { postId: string; data: Partial<BlogPost> }) => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["blogs", "stats"] });
    },
  });
}

export function useUpdateBlogStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: string }) => {
      return apiFetch<{ blogPost: BlogPost }>(`/api/admin/blog/${postId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (data, variables) => {
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
    onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ["blogs"] });
        queryClient.invalidateQueries({ queryKey: ["blogs", variables] });
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
      },
    });
}
