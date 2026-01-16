"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Store,
  Activity,
  BarChart3,
  PieChartIcon,
  FileSpreadsheet,
  Printer,
  Mail,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"

const reportsData = {
  summary: {
    totalReports: 156,
    scheduledReports: 23,
    completedReports: 133,
    failedReports: 0,
    reportsThisMonth: 18,
    growth: 12.5
  },
  recentReports: [
    {
      id: 1,
      name: "Aylık Performans Raporu",
      type: "performance",
      period: "2024-06",
      status: "completed",
      generatedAt: "2024-07-01T09:00:00",
      size: "2.4 MB",
      downloads: 45
    },
    {
      id: 2,
      name: "Kullanıcı Analiz Raporu",
      type: "users",
      period: "2024-Q2",
      status: "completed",
      generatedAt: "2024-07-01T10:30:00",
      size: "1.8 MB",
      downloads: 32
    },
    {
      id: 3,
      name: "Mekan Performans Raporu",
      type: "places",
      period: "2024-06",
      status: "completed",
      generatedAt: "2024-07-01T14:15:00",
      size: "3.1 MB",
      downloads: 28
    },
    {
      id: 4,
      name: "Haftalık Trafik Raporu",
      type: "traffic",
      period: "2024-W27",
      status: "scheduled",
      scheduledAt: "2024-07-08T08:00:00",
      size: "-",
      downloads: 0
    },
    {
      id: 5,
      name: "Gelir Analiz Raporu",
      type: "revenue",
      period: "2024-06",
      status: "generating",
      startedAt: "2024-07-06T16:45:00",
      size: "-",
      downloads: 0
    }
  ],
  scheduledReports: [
    {
      id: 1,
      name: "Haftalık Performans Raporu",
      type: "performance",
      frequency: "weekly",
      nextRun: "2024-07-08T08:00:00",
      recipients: ["admin@tatildesen.com", "manager@tatildesen.com"],
      format: "pdf",
      enabled: true
    },
    {
      id: 2,
      name: "Aylık Kullanıcı Raporu",
      type: "users",
      frequency: "monthly",
      nextRun: "2024-08-01T00:00:00",
      recipients: ["admin@tatildesen.com"],
      format: "excel",
      enabled: true
    },
    {
      id: 3,
      name: "Çeyrek Dönem Finansal Rapor",
      type: "revenue",
      frequency: "quarterly",
      nextRun: "2024-10-01T00:00:00",
      recipients: ["finance@tatildesen.com", "admin@tatildesen.com"],
      format: "pdf",
      enabled: true
    }
  ],
  templates: [
    {
      id: 1,
      name: "Performans Özeti",
      description: "Temel performans metriklerini içeren özet rapor",
      category: "performance",
      sections: ["Kullanıcılar", "Oturumlar", "Dönüşümler", "Gelir"],
      icon: TrendingUp,
      color: "#3b82f6"
    },
    {
      id: 2,
      name: "Kullanıcı Detay Analizi",
      description: "Kullanıcı davranışlarını ve demografik bilgileri analiz eder",
      category: "users",
      sections: ["Demografi", "Davranışlar", "Coğrafi Dağılım", "Cihaz Kullanımı"],
      icon: Users,
      color: "#10b981"
    },
    {
      id: 3,
      name: "Mekan Performans Raporu",
      description: "Mekanların performansını ve popülerliğini analiz eder",
      category: "places",
      sections: ["Popüler Mekanlar", "Değerlendirmeler", "Kategori Performansı", "Trendler"],
      icon: Store,
      color: "#f59e0b"
    },
    {
      id: 4,
      name: "Gelir Analizi",
      description: "Gelir kaynaklarını ve finansal performansı detaylandırır",
      category: "revenue",
      sections: ["Gelir Kaynakları", "Abonelikler", "Bölgesel Dağılım", "Tahminler"],
      icon: DollarSign,
      color: "#8b5cf6"
    },
    {
      id: 5,
      name: "Trafik ve Etkileşim",
      description: "Web sitesi trafiğini ve kullanıcı etkileşimini analiz eder",
      category: "traffic",
      sections: ["Trafik Kaynakları", "Sayfa Görüntüleme", "Etkileşim Oranları", "Bounce Rate"],
      icon: Activity,
      color: "#ec4899"
    }
  ]
}

const performanceData = [
  { month: "Oca", users: 8934, sessions: 23456, conversions: 234, revenue: 28765 },
  { month: "Şub", users: 9234, sessions: 24567, conversions: 256, revenue: 31234 },
  { month: "Mar", users: 9876, sessions: 26789, conversions: 289, revenue: 34567 },
  { month: "Nis", users: 10432, sessions: 28976, conversions: 312, revenue: 37890 },
  { month: "May", users: 11234, sessions: 31234, conversions: 345, revenue: 40123 },
  { month: "Haz", users: 12543, sessions: 34567, conversions: 387, revenue: 45678 }
]

const categoryData = [
  { name: "Restoranlar", value: 35, color: "#3b82f6" },
  { name: "Oteller", value: 28, color: "#10b981" },
  { name: "Aktiviteler", value: 20, color: "#f59e0b" },
  { name: "Mağazalar", value: 12, color: "#8b5cf6" },
  { name: "Hizmetler", value: 5, color: "#ec4899" }
]

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [reportName, setReportName] = useState("")
  const [reportPeriod, setReportPeriod] = useState("")
  const [reportFormat, setReportFormat] = useState("pdf")
  const [searchTerm, setSearchTerm] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Tamamlandı</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Planlandı</Badge>
      case "generating":
        return <Badge className="bg-yellow-100 text-yellow-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Oluşturuluyor</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Başarısız</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "generating":
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportName || !reportPeriod) {
      return
    }

    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsGenerating(false)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num)
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Raporlar</h2>
          <p className="text-muted-foreground">
            Sistem performansı ve analiz raporlarını oluşturun ve yönetin.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel'e Aktar
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Rapor</p>
                <h3 className="text-2xl font-bold">{reportsData.summary.totalReports}</h3>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planlanan</p>
                <h3 className="text-2xl font-bold">{reportsData.summary.scheduledReports}</h3>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
                <h3 className="text-2xl font-bold">{reportsData.summary.completedReports}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bu Ay</p>
                <h3 className="text-2xl font-bold">{reportsData.summary.reportsThisMonth}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Başarım Oranı</p>
                <h3 className="text-2xl font-bold">100%</h3>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Rapor Oluştur</TabsTrigger>
          <TabsTrigger value="recent">Son Raporlar</TabsTrigger>
          <TabsTrigger value="scheduled">Planlı Raporlar</TabsTrigger>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Yeni Rapor Oluştur</CardTitle>
                <CardDescription>
                  Rapor şablonu seçerek yeni bir rapor oluşturun.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Rapor Şablonu</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Şablon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportsData.templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Rapor Adı</Label>
                    <Input
                      id="name"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Rapor adını girin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period">Rapor Dönemi</Label>
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Dönem seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-06">Haziran 2024</SelectItem>
                        <SelectItem value="2024-Q2">2. Çeyrek 2024</SelectItem>
                        <SelectItem value="2024">2024 Yılı</SelectItem>
                        <SelectItem value="custom">Özel Dönem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={!selectedTemplate || !reportName || !reportPeriod || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Rapor Oluştur
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Önizle
                  </Button>
                </div>

                {selectedTemplate && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Rapor Bölümleri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {reportsData.templates
                        .find(t => t.id.toString() === selectedTemplate)
                        ?.sections.map((section, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{section}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hızlı Raporlar</CardTitle>
                  <CardDescription>
                    Sık kullanılan rapor türleri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Haftalık Performans Özeti
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Aylık Kullanıcı Analizi
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Store className="h-4 w-4 mr-2" />
                    Mekan Performans Raporu
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Gelir ve Abonelik Analizi
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performans Grafiği</CardTitle>
                  <CardDescription>
                    Son 6 aylık performans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Son Raporlar</CardTitle>
                  <CardDescription>
                    Oluşturulan son raporlar ve durumları
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rapor ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-[250px]"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrele
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportsData.recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(report.status)}
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.period} • {report.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {report.downloads} indirme
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.generatedAt || report.scheduledAt || report.startedAt || Date.now()).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                      <div className="flex space-x-2">
                        {report.status === "completed" && (
                          <>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Görüntüle
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              İndir
                            </Button>
                          </>
                        )}
                        {report.status === "scheduled" && (
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            Yeniden Planla
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planlı Raporlar</CardTitle>
              <CardDescription>
                Otomatik olarak oluşturulacak raporların zamanlaması
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportsData.scheduledReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.frequency === "weekly" ? "Haftalık" :
                           report.frequency === "monthly" ? "Aylık" : "Çeyrek Dönem"} •
                          {report.format.toUpperCase()} formatı
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sonraki çalışma: {new Date(report.nextRun).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {report.recipients.length} alıcı
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.recipients[0]} {report.recipients.length > 1 && `+${report.recipients.length - 1}`}
                        </p>
                      </div>
                      <Badge className={report.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {report.enabled ? "Aktif" : "Pasif"}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Alıcılar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportsData.templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <template.icon
                        className="h-6 w-6"
                        style={{ color: template.color }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>

                  <Separator />

                  <div>
                    <h5 className="font-medium text-sm mb-2">Rapor Bölümleri:</h5>
                    <div className="space-y-1">
                      {template.sections.slice(0, 3).map((section, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{section}</span>
                        </div>
                      ))}
                      {template.sections.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{template.sections.length - 3} bölüm daha
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedTemplate(template.id.toString())}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Kullan
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}