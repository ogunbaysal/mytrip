"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Mail,
  Save,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import {
  DashboardCard,
  PageHeader,
  ProgressBar,
  SectionHeader,
} from "@/components/dashboard";
import { PlaceContactSection } from "@/components/dashboard/places/place-contact-section";
import { PlaceCreatePreview } from "@/components/dashboard/places/place-create-preview";
import {
  PlaceFormStepper,
  type PlaceFormStep,
} from "@/components/dashboard/places/place-form-stepper";
import { PlaceKindModuleRenderer } from "@/components/dashboard/places/place-kind-module-renderer";
import { PlaceLocationSection } from "@/components/dashboard/places/place-location-section";
import { PlaceMediaSection } from "@/components/dashboard/places/place-media-section";
import { PlacePricingSection } from "@/components/dashboard/places/place-pricing-section";
import { api } from "@/lib/api";
import {
  buildTypeModuleOpeningHoursProfile,
  buildTypeModulePreviewHighlights,
  createDefaultPlaceTypeModuleDraft,
  provisionTypeModulesForPlace,
  validateTypeModuleDraft,
  type PlaceTypeModuleDraft,
} from "@/lib/place-type-module";
import { PlaceTypeModuleForm } from "@/components/dashboard/places/place-type-module-form";

const DEFAULT_COORDS = { lat: 39.0, lng: 35.0 };

const KIND_RESOURCE_KEY_MAP: Record<string, string> = {
  hotel: "place.hotel",
  villa: "place.villa",
  restaurant: "place.restaurant",
  cafe: "place.cafe",
  bar_club: "place.bar_club",
  beach: "place.beach",
  natural_location: "place.natural_location",
  activity_location: "place.activity_location",
  visit_location: "place.visit_location",
  other_monetized: "place.other_monetized",
};

const CREATE_PLACE_STEPS: PlaceFormStep[] = [
  {
    id: "place-type",
    title: "Yer Türü",
    description: "Önce mekan türünü seçin",
  },
  {
    id: "primary",
    title: "Temel Bilgi",
    description: "İsim, özet ve içerik",
  },
  {
    id: "location",
    title: "Konum",
    description: "Adres ve harita konumu",
  },
  {
    id: "type-form",
    title: "Tür Detayı",
    description: "Türe özel alanlar",
  },
  {
    id: "preview",
    title: "Önizleme",
    description: "Kontrol et ve gönder",
  },
];

const FINAL_STEP_INDEX = CREATE_PLACE_STEPS.length - 1;

type FormState = {
  name: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  address: string;
  cityId: string;
  districtId: string;
  location: { lat: number; lng: number };
  contactInfo: { phone: string; email: string; website: string };
  nightlyPrice: string;
  features: string[];
  images: string[];
  businessDocumentFileId: string;
  businessDocumentUrl: string;
  businessDocumentFilename: string;
  typeModule: PlaceTypeModuleDraft;
};

type UsageResource = {
  resourceKey: string;
  current: number;
  max: number;
  isUnlimited?: boolean;
};

const parseNightlyPrice = (value: string): number | undefined | null => {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

export default function CreatePlacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isBusinessDocumentUploading, setIsBusinessDocumentUploading] =
    useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<FormState>({
    name: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    address: "",
    cityId: "",
    districtId: "",
    location: DEFAULT_COORDS,
    contactInfo: { phone: "", email: "", website: "" },
    nightlyPrice: "",
    features: [],
    images: [],
    businessDocumentFileId: "",
    businessDocumentUrl: "",
    businessDocumentFilename: "",
    typeModule: createDefaultPlaceTypeModuleDraft(),
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["owner-place-categories"],
    queryFn: () => api.owner.places.categories(),
  });

  const { data: citiesData, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["place-location-cities"],
    queryFn: () => api.locations.cities(),
  });

  const { data: districtsData, isLoading: isDistrictsLoading } = useQuery({
    queryKey: ["place-location-districts", formData.cityId],
    queryFn: () => api.locations.districts(formData.cityId),
    enabled: Boolean(formData.cityId),
  });

  const createPlaceMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.owner.places.create(payload),
    onError: (error: Error) => {
      toast.error(error.message || "Mekan oluşturulamadı");
    },
  });

  const categories = categoriesData?.categories ?? [];
  const cities = citiesData?.cities ?? [];
  const districts = districtsData?.districtItems ?? [];

  const selectedKindDefinition =
    categories.find((kind) => kind.id === formData.categoryId) ?? null;

  const usage = usageData?.usage;
  const placesUsed = usage?.places?.current || 0;
  const placesMax = usage?.places?.max ?? 0;
  const usagePercentage =
    placesMax > 0 ? Math.round((placesUsed / placesMax) * 100) : 0;

  const selectedKindResourceKey =
    KIND_RESOURCE_KEY_MAP[formData.categoryId] ?? null;
  const usageResources: UsageResource[] = Array.isArray(usage?.resources)
    ? (usage.resources as UsageResource[])
    : [];
  const selectedKindUsage = selectedKindResourceKey
    ? usageResources.find((item) => item.resourceKey === selectedKindResourceKey)
    : null;
  const selectedKindCurrent = selectedKindUsage?.current ?? 0;
  const selectedKindMax = selectedKindUsage?.isUnlimited
    ? null
    : (selectedKindUsage?.max ?? 0);
  const canAddSelectedKind =
    !selectedKindUsage ||
    selectedKindUsage.isUnlimited ||
    selectedKindCurrent < (selectedKindUsage.max ?? 0);

  const selectedCityName = useMemo(
    () => cities.find((city) => city.id === formData.cityId)?.name || "",
    [cities, formData.cityId],
  );

  const selectedDistrictName = useMemo(
    () =>
      districts.find((district) => district.id === formData.districtId)?.name ||
      "",
    [districts, formData.districtId],
  );
  const typeModuleHighlights = useMemo(
    () => buildTypeModulePreviewHighlights(formData.categoryId, formData.typeModule),
    [formData.categoryId, formData.typeModule],
  );

  const resolveCoordinates = (
    latitude: number | null | undefined,
    longitude: number | null | undefined,
  ): { lat: number; lng: number } | null => {
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return { lat: latitude, lng: longitude };
  };

  const toggleFeature = (featureId: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((item) => item !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const handleCityChange = (cityId: string) => {
    const selectedCity = cities.find((city) => city.id === cityId);
    const cityCoordinates = resolveCoordinates(
      selectedCity?.latitude,
      selectedCity?.longitude,
    );

    setFormData((prev) => ({
      ...prev,
      cityId,
      districtId: "",
      location: cityCoordinates ?? prev.location,
    }));
  };

  const handleDistrictChange = (districtId: string) => {
    const requestCityId = formData.cityId;
    const selectedDistrict = districts.find((district) => district.id === districtId);
    const districtCoordinates = resolveCoordinates(
      selectedDistrict?.latitude,
      selectedDistrict?.longitude,
    );

    setFormData((prev) => ({
      ...prev,
      districtId,
      location: districtCoordinates ?? prev.location,
    }));

    if (districtCoordinates || !requestCityId || !selectedDistrict?.name) {
      return;
    }

    void queryClient
      .fetchQuery({
        queryKey: [
          "place-location-district-center",
          requestCityId,
          selectedDistrict.name,
        ],
        queryFn: () => api.locations.districtCenter(requestCityId, selectedDistrict.name),
        staleTime: 1000 * 60 * 60 * 24,
      })
      .then((center) => {
        if (!center) return;

        setFormData((prev) => {
          if (prev.cityId !== requestCityId || prev.districtId !== districtId) {
            return prev;
          }

          return { ...prev, location: center };
        });
      });
  };

  const handleBusinessDocumentUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      setIsBusinessDocumentUploading(true);
      const response = await api.owner.upload.single(
        selectedFile,
        "business_document",
      );
      setFormData((prev) => ({
        ...prev,
        businessDocumentFileId: response.fileId,
        businessDocumentUrl: response.url,
        businessDocumentFilename: selectedFile.name,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Belge yüklenemedi";
      toast.error(message);
    } finally {
      setIsBusinessDocumentUploading(false);
      event.target.value = "";
    }
  };

  const validateStep = (stepIndex: number, showToast = true) => {
    const fail = (message: string) => {
      if (showToast) {
        toast.error(message);
      }
      return false;
    };

    switch (stepIndex) {
      case 0:
        if (!formData.categoryId) {
          return fail("Yer türü seçimi zorunludur");
        }
        if (!canAddSelectedKind) {
          return fail("Seçilen tür için abonelik limitiniz dolu");
        }
        return true;
      case 1:
        if (!formData.name.trim()) {
          return fail("Mekan adı zorunludur");
        }
        return true;
      case 2:
        if (!formData.address.trim()) {
          return fail("Adres zorunludur");
        }
        if (!formData.cityId || !formData.districtId) {
          return fail("İl ve ilçe seçimi zorunludur");
        }
        if (
          !Number.isFinite(formData.location.lat) ||
          !Number.isFinite(formData.location.lng)
        ) {
          return fail("Harita üzerinden geçerli konum seçin");
        }
        return true;
      case 3:
        if (formData.images.length === 0) {
          return fail("En az bir görsel yüklemelisiniz");
        }
        if (!formData.businessDocumentFileId) {
          return fail("İşletme belgesi PDF yüklemek zorunludur");
        }
        if (parseNightlyPrice(formData.nightlyPrice) === null) {
          return fail("Gecelik fiyat geçersiz");
        }
        {
          const moduleValidationMessage = validateTypeModuleDraft(
            formData.categoryId,
            formData.typeModule,
          );
          if (moduleValidationMessage) {
            return fail(moduleValidationMessage);
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex >= FINAL_STEP_INDEX) {
      return;
    }
    if (!validateStep(currentStepIndex, true)) {
      return;
    }
    setCurrentStepIndex((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStepSelect = (targetIndex: number) => {
    if (targetIndex === currentStepIndex) {
      return;
    }

    if (targetIndex < currentStepIndex) {
      setCurrentStepIndex(targetIndex);
      return;
    }

    for (let stepIndex = currentStepIndex; stepIndex < targetIndex; stepIndex += 1) {
      if (!validateStep(stepIndex, true)) {
        setCurrentStepIndex(stepIndex);
        return;
      }
    }

    setCurrentStepIndex(targetIndex);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    for (let stepIndex = 0; stepIndex < FINAL_STEP_INDEX; stepIndex += 1) {
      if (!validateStep(stepIndex, true)) {
        setCurrentStepIndex(stepIndex);
        return;
      }
    }

    const parsedNightlyPrice = parseNightlyPrice(formData.nightlyPrice);
    if (parsedNightlyPrice === null) {
      toast.error("Gecelik fiyat geçersiz");
      setCurrentStepIndex(3);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      kind: formData.categoryId,
      categoryId: formData.categoryId,
      shortDescription: formData.shortDescription.trim() || undefined,
      description: formData.description.trim() || undefined,
      address: formData.address.trim(),
      cityId: formData.cityId,
      districtId: formData.districtId,
      city: selectedCityName,
      district: selectedDistrictName,
      location: {
        lat: Number(formData.location.lat.toFixed(6)),
        lng: Number(formData.location.lng.toFixed(6)),
      },
      contactInfo:
        formData.contactInfo.phone ||
        formData.contactInfo.email ||
        formData.contactInfo.website
          ? {
              phone: formData.contactInfo.phone.trim() || undefined,
              email: formData.contactInfo.email.trim() || undefined,
              website: formData.contactInfo.website.trim() || undefined,
            }
          : undefined,
      nightlyPrice: parsedNightlyPrice,
      features: formData.features,
      images: formData.images,
      businessDocumentFileId: formData.businessDocumentFileId,
      openingHours: buildTypeModuleOpeningHoursProfile(
        formData.categoryId,
        formData.typeModule,
      ),
    };

    let response:
      | {
          success: boolean;
          message: string;
          place: { id: string } | null;
        }
      | undefined;
    try {
      response = await createPlaceMutation.mutateAsync(payload);
    } catch {
      return;
    }
    const createdPlaceId = response.place?.id;

    if (!createdPlaceId) {
      toast.warning("Mekan oluşturuldu fakat modüller eşlenemedi");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner-places"] }),
        queryClient.invalidateQueries({ queryKey: ["usage"] }),
      ]);
      router.push("/dashboard/places");
      return;
    }

    try {
      await provisionTypeModulesForPlace({
        placeId: createdPlaceId,
        kindId: formData.categoryId,
        moduleData: formData.typeModule,
      });
    } catch (error) {
      console.error(error);
      toast.warning(
        "Mekan oluşturuldu, ancak bazı tür modülleri tamamlanamadı. Düzenleme ekranından devam edebilirsiniz.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner-places"] }),
        queryClient.invalidateQueries({ queryKey: ["usage"] }),
      ]);
      router.push(`/dashboard/places/${createdPlaceId}/edit`);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["owner-places"] }),
      queryClient.invalidateQueries({ queryKey: ["usage"] }),
    ]);
    router.push("/dashboard/places");
  };

  const renderCurrentStep = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <DashboardCard padding="md">
            <SectionHeader
              title="Yer Türü Seçimi"
              subtitle="Önce mekan türünü belirleyin"
              icon={<Info className="size-5" />}
              size="sm"
              className="mb-6"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Yer Türü *</Label>
                <Select
                  value={formData.categoryId || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                  disabled={isCategoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yer türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedKindDefinition ? (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <div className="font-medium">{selectedKindDefinition.name}</div>
                  <p className="mt-1 text-muted-foreground">
                    {selectedKindDefinition.description || "Tür açıklaması bulunmuyor."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        selectedKindDefinition.supportsRooms
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Oda Modülü
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        selectedKindDefinition.supportsMenu
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Menü Modülü
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        selectedKindDefinition.supportsPackages
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Paket Modülü
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </DashboardCard>
        );
      case 1:
        return (
          <DashboardCard padding="md">
            <SectionHeader
              title="Temel Bilgiler"
              subtitle="Mekan adı, kısa açıklama ve detaylı içerik"
              icon={<Info className="size-5" />}
              size="sm"
              className="mb-6"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Mekan Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Örn: Aegean Ula Boat Tours"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="shortDescription">Kısa Açıklama</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortDescription: event.target.value,
                    }))
                  }
                  placeholder="Listelerde görünecek kısa özet"
                  maxLength={500}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Detaylı Açıklama</Label>
                <TipTapEditor
                  content={formData.description}
                  onChange={(description: string) =>
                    setFormData((prev) => ({ ...prev, description }))
                  }
                />
              </div>
            </div>
          </DashboardCard>
        );
      case 2:
        return (
          <PlaceLocationSection
            value={{
              address: formData.address,
              cityId: formData.cityId,
              districtId: formData.districtId,
              location: formData.location,
            }}
            cities={cities}
            districts={districts}
            isCitiesLoading={isCitiesLoading}
            isDistrictsLoading={isDistrictsLoading}
            onAddressChange={(address) => setFormData((prev) => ({ ...prev, address }))}
            onCityChange={handleCityChange}
            onDistrictChange={handleDistrictChange}
            onCoordinatesChange={(location) =>
              setFormData((prev) => ({ ...prev, location }))
            }
          />
        );
      case 3:
        return (
          <div className="space-y-6">
            <PlaceMediaSection
              images={formData.images}
              onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
              disabled={createPlaceMutation.isPending}
            />

            <PlaceContactSection
              value={formData.contactInfo}
              onChange={(contactInfo) => setFormData((prev) => ({ ...prev, contactInfo }))}
            />

            <PlacePricingSection
              kindId={formData.categoryId}
              nightlyPrice={formData.nightlyPrice}
              onNightlyPriceChange={(nightlyPrice) =>
                setFormData((prev) => ({ ...prev, nightlyPrice }))
              }
            />

            <PlaceKindModuleRenderer
              kindId={formData.categoryId}
              kindName={selectedKindDefinition?.name}
              supportsRooms={selectedKindDefinition?.supportsRooms}
              supportsMenu={selectedKindDefinition?.supportsMenu}
              supportsPackages={selectedKindDefinition?.supportsPackages}
              features={formData.features}
              onToggleFeature={toggleFeature}
            />
            <PlaceTypeModuleForm
              kindId={formData.categoryId}
              value={formData.typeModule}
              onChange={(typeModule) => setFormData((prev) => ({ ...prev, typeModule }))}
              disabled={createPlaceMutation.isPending || isBusinessDocumentUploading}
            />

            <DashboardCard padding="md">
              <SectionHeader
                title="İşletme Belgesi (PDF)"
                subtitle="Doğrulama için zorunlu"
                icon={<FileText className="size-5" />}
                size="sm"
                className="mb-6"
              />

              <div className="space-y-4">
                {formData.businessDocumentFileId ? (
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium">
                      {formData.businessDocumentFilename || "Yüklenen belge"}
                    </div>
                    {formData.businessDocumentUrl && (
                      <a
                        href={formData.businessDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary underline"
                      >
                        Belgeyi görüntüle
                      </a>
                    )}
                  </div>
                ) : null}

                <label className="inline-flex">
                  <Input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleBusinessDocumentUpload}
                    disabled={isBusinessDocumentUploading || createPlaceMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isBusinessDocumentUploading || createPlaceMutation.isPending}
                    asChild
                  >
                    <span>
                      <Upload className="mr-2 size-4" />
                      {isBusinessDocumentUploading
                        ? "Belge Yükleniyor..."
                        : "PDF Belge Yükle / Değiştir"}
                    </span>
                  </Button>
                </label>
              </div>
            </DashboardCard>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <PlaceCreatePreview
              kindId={formData.categoryId}
              kindName={selectedKindDefinition?.name}
              name={formData.name.trim()}
              shortDescription={formData.shortDescription.trim()}
              description={formData.description}
              address={formData.address.trim()}
              cityName={selectedCityName}
              districtName={selectedDistrictName}
              location={formData.location}
              contactInfo={formData.contactInfo}
              nightlyPrice={formData.nightlyPrice}
              features={formData.features}
              images={formData.images}
              businessDocumentFileId={formData.businessDocumentFileId}
              businessDocumentFilename={formData.businessDocumentFilename}
              businessDocumentUrl={formData.businessDocumentUrl}
              supportsRooms={selectedKindDefinition?.supportsRooms}
              supportsMenu={selectedKindDefinition?.supportsMenu}
              supportsPackages={selectedKindDefinition?.supportsPackages}
              typeModuleHighlights={typeModuleHighlights}
            />

            <DashboardCard padding="md">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">Onay Süreci</h4>
                  <p className="text-sm text-muted-foreground">
                    Mekanınız ve işletme belgeniz yöneticiler tarafından incelenir.
                    Onaylandığında yayınlanır.
                  </p>
                </div>
              </div>
            </DashboardCard>
          </div>
        );
      default:
        return null;
    }
  };

  const isFinalStep = currentStepIndex === FINAL_STEP_INDEX;
  const isActionDisabled =
    createPlaceMutation.isPending || isBusinessDocumentUploading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Mekan Ekle"
        description="Adım adım form ile mekan bilgilerini doldurun"
        icon={<Building2 className="size-5" />}
        breadcrumbs={[
          { label: "Mekanlar", href: "/dashboard/places" },
          { label: "Yeni Mekan" },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/places")}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Geri
          </Button>
        }
      />

      <DashboardCard padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Kullanım Durumu</h3>
            <p className="text-sm text-muted-foreground">
              Toplam: {placesUsed} / {placesMax || "-"} mekan
              {formData.categoryId
                ? ` • Seçili tür: ${selectedKindCurrent} / ${
                    selectedKindMax === null ? "∞" : selectedKindMax
                  }`
                : ""}
            </p>
          </div>
          <div className="w-full md:w-64">
            <ProgressBar value={usagePercentage} showLabel label={`${usagePercentage}%`} />
          </div>
        </div>
      </DashboardCard>

      {formData.categoryId && !canAddSelectedKind ? (
        <DashboardCard padding="md">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Seçilen tür için limit dolu ({selectedKindCurrent} /{" "}
            {selectedKindMax === null ? "∞" : selectedKindMax}). Tür seçimini
            değiştirin veya planınızı yükseltin.
          </div>
        </DashboardCard>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <DashboardCard padding="md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Form Adımları</h3>
              <p className="text-sm text-muted-foreground">
                Adım {currentStepIndex + 1} / {CREATE_PLACE_STEPS.length}
              </p>
            </div>
          </div>
          <PlaceFormStepper
            steps={CREATE_PLACE_STEPS}
            currentStep={currentStepIndex}
            onStepSelect={handleStepSelect}
          />
        </DashboardCard>

        {renderCurrentStep()}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/dashboard/places")}
            >
              İptal
            </Button>

            {currentStepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={isActionDisabled}
              >
                Önceki
              </Button>
            ) : null}
          </div>

          {!isFinalStep ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isActionDisabled}
              className="gap-2"
            >
              Sonraki Adım
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isActionDisabled}
              className="min-w-[200px] gap-2"
            >
              {createPlaceMutation.isPending ? (
                <>
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Mekanı Onaya Gönder
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
