"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Eye,
  Building2,
  Phone,
  Mail,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

type BusinessRegistration = {
  id: string;
  companyName: string;
  taxId: string;
  businessAddress: string;
  contactPhone: string;
  contactEmail: string;
  businessType: string;
  documents: string[] | string;
  status: string;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function ApproveBusinessPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending">("pending");
  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingBusinessId, setRejectingBusinessId] = useState<string | null>(
    null,
  );

  const { data: businessData, isLoading } = useQuery({
    queryKey: ["admin-approvals-business", filter],
    queryFn: () =>
      api.approvals.business.list(filter === "all" ? {} : { status: filter }),
  });

  const registrations = businessData?.registrations || [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approvals.business.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approvals-business"] });
      alert("İşletme kaydı başarıyla onaylandı");
    },
    onError: (error: Error) => {
      alert(`Onaylama hatası: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.approvals.business.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approvals-business"] });
      setShowRejectDialog(false);
      setRejectReason("");
      setRejectingBusinessId(null);
      alert("İşletme kaydı reddedildi");
    },
    onError: (error: Error) => {
      alert(`Reddetme hatası: ${error.message}`);
    },
  });

  const handleApprove = (id: string) => {
    if (
      window.confirm(
        "Bu işletme kaydını onaylamak istediğinizden emin misiniz?",
      )
    ) {
      approveMutation.mutate(id);
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingBusinessId(id);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      alert("Lütfen bir reddetme sebebi giriniz");
      return;
    }
    if (rejectingBusinessId) {
      rejectMutation.mutate({ id: rejectingBusinessId, reason: rejectReason });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const parseJSON = (data: string | object, fallback: any) => {
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data as string);
    } catch {
      return fallback;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">İşletme Kayıtları</h1>
        <p className="text-muted-foreground">
          Kullanıcıların işletme sahibi olma başvurularını inceleyip onaylayın
          veya reddedin.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          Bekleyen (
          {
            registrations.filter(
              (r: BusinessRegistration) => r.status === "pending",
            ).length
          }
          )
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Tümü
        </Button>
      </div>

      <div className="space-y-4">
        {registrations.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Onay bekleyen kayıt yok</h3>
            <p className="text-muted-foreground">
              {filter === "pending"
                ? "Şu anda onay bekleyen işletme kaydı bulunmuyor."
                : "Henüz işletme kaydı yapılmamış."}
            </p>
          </Card>
        ) : (
          registrations.map((reg: BusinessRegistration) => (
            <Card key={reg.id} className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Building2 className="size-5 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">
                          {reg.companyName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        {formatDate(reg.createdAt)}
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        reg.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : reg.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : reg.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {reg.status === "pending"
                        ? "Beklemede"
                        : reg.status === "approved"
                          ? "Onaylandı"
                          : reg.status === "rejected"
                            ? "Reddedildi"
                            : reg.status}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Vergi No:</span>
                      <span className="font-medium">{reg.taxId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        İşletme Tipi:
                      </span>
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {reg.businessType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span className="font-medium">{reg.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="font-medium">{reg.contactEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">Adres:</span>
                    <span className="flex-1">{reg.businessAddress}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Belgeler:
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                      {(parseJSON(reg.documents, []) as string[]).length} dosya
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBusiness(reg)}
                  >
                    <Eye className="mr-2 size-4" />
                    Detayları Görüntüle
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {reg.status === "pending" && (
                    <>
                      <Button
                        onClick={() => handleApprove(reg.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 size-4" />
                        Onayla
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectClick(reg.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="mr-2 size-4" />
                        Reddet
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={!!selectedBusiness}
        onOpenChange={() => setSelectedBusiness(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBusiness?.companyName}</DialogTitle>
          </DialogHeader>
          {selectedBusiness && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold">İşletme Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Şirket Adı:</span>{" "}
                      <span className="font-medium">
                        {selectedBusiness.companyName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vergi No:</span>{" "}
                      <span className="font-medium">
                        {selectedBusiness.taxId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        İşletme Tipi:
                      </span>{" "}
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {selectedBusiness.businessType}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold">İletişim Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedBusiness.contactPhone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedBusiness.contactEmail}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Adres</h4>
                <p className="text-sm">{selectedBusiness.businessAddress}</p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Belgeler</h4>
                <div className="space-y-2">
                  {(parseJSON(selectedBusiness.documents, []) as string[]).map(
                    (doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          İncele
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <h4 className="mb-2 font-semibold">Kullanıcı Bilgisi</h4>
                {selectedBusiness.user ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ad Soyad:</span>{" "}
                      <span className="font-medium">
                        {selectedBusiness.user.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">E-posta:</span>{" "}
                      <span className="font-medium">
                        {selectedBusiness.user.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Kullanıcı bilgisi bulunamadı
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBusiness(null)}>
              Kapat
            </Button>
            {selectedBusiness?.status === "pending" && (
              <>
                <Button
                  onClick={() => {
                    setSelectedBusiness(null);
                    handleApprove(selectedBusiness.id);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 size-4" />
                  Onayla
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedBusiness(null);
                    handleRejectClick(selectedBusiness.id);
                  }}
                >
                  <X className="mr-2 size-4" />
                  Reddet
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reddetme Sebebi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bu işletme kaydını reddetme sebebinizi belirtiniz. Kullanıcı bu
              sebep ile birlikte bilgilendirilecektir.
            </p>
            <Textarea
              placeholder="Reddetme sebebinizi buraya yazın..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <X className="mr-2 size-4" />
                  Reddet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
