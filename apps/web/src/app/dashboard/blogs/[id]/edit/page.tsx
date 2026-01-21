"use client";

import { useParams } from "next/navigation";
import { BlogEditor } from "@/components/dashboard/blog";

export default function EditBlogPage() {
  const params = useParams();
  const blogId = params.id as string;

  return <BlogEditor mode="edit" blogId={blogId} />;
}
