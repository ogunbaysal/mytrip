"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Edit,
  Eye,
  MoreHorizontal,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BlogPost,
  useDeleteBlog,
  useToggleBlogFeature,
  useUpdateBlogStatus,
} from "@/hooks/use-blogs";

type BlogsTableProps = {
  data: BlogPost[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

const STATUS_LABELS: Record<string, string> = {
  published: "Yayında",
  draft: "Taslak",
  pending_review: "İncelemede",
  archived: "Arşivlendi",
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  published: "default",
  draft: "secondary",
  pending_review: "outline",
  archived: "destructive",
};

const ActionsCell = ({ blog }: { blog: BlogPost }) => {
  const router = useRouter();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { mutate: updateBlogStatus } = useUpdateBlogStatus();
  const { mutate: toggleFeature } = useToggleBlogFeature();
  const { mutate: deleteBlog, isPending: isDeleting } = useDeleteBlog();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteBlog(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast.success("Blog yazısı başarıyla silindi");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Silme işlemi başarısız");
      },
    });
  };

  return (
    <>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu blog yazısını silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menüyü aç</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/blogs/${blog.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> Detayları Gör
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/blogs/${blog.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Düzenle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {blog.status !== "published" && (
            <DropdownMenuItem
              onClick={() => updateBlogStatus({ postId: blog.id, status: "published" })}
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Yayınla
            </DropdownMenuItem>
          )}
          {blog.status === "published" && (
            <DropdownMenuItem
              onClick={() => updateBlogStatus({ postId: blog.id, status: "draft" })}
            >
              <XCircle className="mr-2 h-4 w-4 text-orange-600" />
              Yayından Kaldır (Taslak)
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => toggleFeature(blog.id)}>
            <Star className="mr-2 h-4 w-4" />
            {blog.featured ? "Öne Çıkarılanlardan Kaldır" : "Öne Çıkar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(blog.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export function BlogsTable({
  data,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
}: BlogsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<BlogPost>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Tümünü seç"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Satır seç"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Başlık
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const blog = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{blog.title}</span>
              {blog.featured && (
                <Badge variant="default" className="bg-yellow-500 text-xs text-black">
                  ⭐ Öne Çıkan
                </Badge>
              )}
            </div>
            <div className="line-clamp-1 text-sm text-muted-foreground">{blog.excerpt}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "categoryName",
      header: "Kategori",
      cell: ({ row }) => (
        <Badge variant="outline">{(row.getValue("categoryName") as string) || "Kategorisiz"}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Durum",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={STATUS_BADGE[status] || "outline"}>{STATUS_LABELS[status] || status}</Badge>;
      },
    },
    {
      accessorKey: "views",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Görüntülenme
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const views = row.getValue("views") as number;
        return <div className="font-medium">{views.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: "authorName",
      header: "Yazar",
      cell: ({ row }) => {
        const authorName = row.getValue("authorName") as string | null;
        return <div className="text-sm">{authorName || "-"}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Tarih
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dateStr = row.getValue("createdAt") as string;
        const date = new Date(dateStr);
        return date.toLocaleDateString("tr-TR");
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => <ActionsCell blog={row.original} />,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: totalPages || 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 py-2">
          <Skeleton className="h-10 w-[220px]" />
          <Skeleton className="ml-auto h-10 w-[120px]" />
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <div className="text-sm text-muted-foreground">
          Toplam <span className="font-medium text-foreground">{total}</span> kayıt
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Sütunlar <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id === "title"
                    ? "Başlık"
                    : column.id === "categoryName"
                      ? "Kategori"
                      : column.id === "status"
                        ? "Durum"
                        : column.id === "views"
                          ? "Görüntülenme"
                          : column.id === "authorName"
                            ? "Yazar"
                            : column.id === "createdAt"
                              ? "Tarih"
                              : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Sayfa {Math.max(page, 1)} / {Math.max(totalPages, 1)}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
