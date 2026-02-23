"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

const STEPS = [
  "Kişisel Bilgiler",
  "İşletme Bilgileri",
  "İletişim Bilgileri",
  "İşletme Tipi",
  "Gözden Geçir",
] as const;

type Step = (typeof STEPS)[number];

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(STEPS[0]);
  const [formData, setFormData] = useState({
    companyName: "",
    taxId: "",
    businessAddress: "",
    contactPhone: "",
    contactEmail: "",
    businessType: "",
  });

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  const isAuthenticated = Boolean(session?.data?.user);

  const { data: businessStatus } = useQuery({
    queryKey: ["business-status"],
    queryFn: () => api.business.getStatus(),
    enabled: isAuthenticated,
  });

  const registerMutation = useMutation({
    mutationFn: (data: typeof formData) => api.business.register(data),
    onSuccess: () => {
      router.push("/dashboard" as Route);
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast.error(error.message || "Kayıt sırasında bir hata oluştu");
    },
  });

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.replace("/login" as Route);
    }
  }, [isAuthenticated, isSessionLoading, router]);

  useEffect(() => {
    if (businessStatus?.hasRegistration && businessStatus.status === "approved") {
      router.replace("/dashboard" as Route);
    }
  }, [businessStatus?.hasRegistration, businessStatus?.status, router]);

  if (isSessionLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (businessStatus?.hasRegistration && businessStatus.status === "pending") {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="mx-auto max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Kayıt İnceleniyor</h2>
          <p className="mb-6 text-muted-foreground">
            İşletme kaydınız şu anda TatilDesen yöneticileri tarafından
            inceleniyor. Bu süreç genellikle 24-48 saat sürer. Onaylandığında
            size bildirim gönderilecektir.
          </p>
          <Button onClick={() => router.push("/dashboard" as Route)}>
            Paneye Dön
          </Button>
        </Card>
      </div>
    );
  }

  if (businessStatus?.hasRegistration && businessStatus.status === "approved") {
    return null;
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getCurrentStepIndex = () => STEPS.indexOf(currentStep);
  const canProceed = () => {
    const index = getCurrentStepIndex();
    switch (index) {
      case 0:
        return true;
      case 1:
        return (
          formData.companyName.length >= 2 &&
          formData.taxId.length >= 10 &&
          formData.businessAddress.length > 0
        );
      case 2:
        return (
          formData.contactPhone.length >= 10 &&
          formData.contactEmail.length > 0 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
        );
      case 3:
        return formData.businessType.length >= 2;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    registerMutation.mutate(formData);
  };

  const renderStep = () => {
    const index = getCurrentStepIndex();
    const isLastStep = index === STEPS.length - 1;

    switch (currentStep) {
      case "Kişisel Bilgiler":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input
                value={session?.data?.user?.name || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Bu bilgiler kayıtlı hesabınızdan alınmıştır.
              </p>
            </div>
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input
                value={session?.data?.user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        );

      case "İşletme Bilgileri":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Şirket Adı *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Örn: Turizm A.Ş."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Vergi Numarası *</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleChange("taxId", e.target.value)}
                placeholder="10 haneli vergi numarası"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAddress">İşletme Adresi *</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) =>
                  handleChange("businessAddress", e.target.value)
                }
                placeholder="Mahalle, Sokak No, İlçe, Şehir"
              />
            </div>
          </div>
        );

      case "İletişim Bilgileri":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">İletişim Telefonu *</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="+90 555 123 4567"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">İşletme E-postası *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="iletisim@sirket.com"
              />
            </div>
          </div>
        );

      case "İşletme Tipi":
        return (
          <div className="space-y-6">
            <Label>İşletme Tipi *</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "otel", label: "Otel/Pansiyon", icon: "🏨" },
                { value: "restoran", label: "Restoran/Kafe", icon: "🍽️" },
                { value: "aktivite", label: "Tur/Aktivite", icon: "🎯" },
                { value: "diger", label: "Diğer", icon: "🏢" },
              ].map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer border-2 transition hover:border-primary ${
                    formData.businessType === type.value
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => handleChange("businessType", type.value)}
                >
                  <div className="flex items-center gap-3 p-4">
                    <span className="text-3xl">{type.icon}</span>
                    <span className="text-lg font-medium">{type.label}</span>
                    {formData.businessType === type.value && (
                      <CheckCircle2 className="ml-auto text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case "Gözden Geçir":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Kayıt Özeti</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">Şirket Adı:</span>
                <span className="font-medium">{formData.companyName}</span>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">Vergi Numarası:</span>
                <span className="font-medium">{formData.taxId}</span>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">İşletme Adresi:</span>
                <span className="font-medium">{formData.businessAddress}</span>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">
                  İletişim Telefonu:
                </span>
                <span className="font-medium">{formData.contactPhone}</span>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">
                  İşletme E-postası:
                </span>
                <span className="font-medium">{formData.contactEmail}</span>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">İşletme Tipi:</span>
                <span className="font-medium">
                  {formData.businessType === "otel" && "Otel/Pansiyon"}
                  {formData.businessType === "restoran" && "Restoran/Kafe"}
                  {formData.businessType === "aktivite" && "Tur/Aktivite"}
                  {formData.businessType === "diger" && "Diğer"}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="mb-2 font-semibold">Onay Süreci</p>
              <p className="text-muted-foreground">
                Kaydınızı tamamladıktan sonra TatilDesen yöneticileri bilgilerinizi
                inceleyecektir. Bu süreç genellikle 24-48 saat sürer.
                Onaylandıktan sonra abonelik planı seçip işletmenizi kullanmaya
                başlayabilirsiniz.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            İşletme Kaydı
          </h1>
          <p className="text-lg text-muted-foreground">
            TatilDesen platformunda işletmenizi kaydedin ve müşterilere ulaşın
          </p>
        </div>

        <div className="mb-8">
          <div className="relative flex items-center">
            {STEPS.map((step, index) => {
              const isActive = step === currentStep;
              const isCompleted = index < getCurrentStepIndex();
              const isFirst = index === 0;
              const isLast = index === STEPS.length - 1;

              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex items-center">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`mx-4 h-0.5 flex-1 ${
                        isCompleted ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Card className="p-8">
          {renderStep()}

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const index = getCurrentStepIndex();
                if (index > 0) {
                  setCurrentStep(STEPS[index - 1]);
                }
              }}
              disabled={getCurrentStepIndex() === 0}
            >
              Önceki
            </Button>

            {getCurrentStepIndex() < STEPS.length - 1 ? (
              <Button
                onClick={() => {
                  const index = getCurrentStepIndex();
                  if (index < STEPS.length - 1 && canProceed()) {
                    setCurrentStep(STEPS[index + 1]);
                  }
                }}
                disabled={!canProceed()}
              >
                Sonraki
                <ChevronRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={registerMutation.isPending}
                className="min-w-[200px]"
              >
                {registerMutation.isPending ? (
                  <>
                    <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Gönderiliyor...
                  </>
                ) : (
                  "Kaydı Tamamla"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
