import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, Bell, Lock, Zap, Globe, ShieldAlert, Trash2, Smartphone, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [settings, setSettings] = useState({
    platformName: "GrocMed",
    email: "support@grocmed.com",
    phone: "+91 98765 43210",
    address: "Tech Hub, Sector 62, Noida, UP - 201301",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    deliveryCharge: 29.00,
    minOrderValue: 199.00,
    maxDeliveryDistance: 10,
  });

  const [showResetAlert, setShowResetAlert] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  const handleSecureDownload = async (endpoint: string, filename: string) => {
    try {
      setDownloading(filename);
      const token = localStorage.getItem("grocmed_token");
      const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/admin/${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Export failed, please try again.");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`${filename} exported successfully.`);
    } catch (err) {
      toast.error(`Failed to export ${filename}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Platform Configuration</h1>
        <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Global settings for your instance.</p>
      </div>

      {/* Settings Tabs - Scrollable on mobile */}
      <Tabs defaultValue="general" className="space-y-6">
        <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full bg-gray-100/50 p-1.5 rounded-2xl ring-1 ring-gray-100">
            <TabsTrigger value="general" className="flex-1 px-8 py-2.5 rounded-xl font-normal text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 px-8 py-2.5 rounded-xl font-normal text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 px-8 py-2.5 rounded-xl font-normal text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Security
            </TabsTrigger>
            <TabsTrigger value="business" className="flex-1 px-8 py-2.5 rounded-xl font-normal text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Logistics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-xl">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest text-xs">Public Profile</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Instance Name</Label>
                  <Input
                    value={settings.platformName}
                    onChange={(e) => handleSettingChange("platformName", e.target.value)}
                    className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Support Email</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange("email", e.target.value)}
                    className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Helpline Number</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => handleSettingChange("phone", e.target.value)}
                    className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">H.O. Address</Label>
                  <Input
                    value={settings.address}
                    onChange={(e) => handleSettingChange("address", e.target.value)}
                    className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button className="flex-1 sm:flex-none h-14 px-10 rounded-2xl bg-primary text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Save className="w-4 h-4 mr-2" />
                Commit Changes
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/5 rounded-xl">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest text-xs">Communication Channels</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: "Email Gateway", desc: "For invoices and account alerts", key: "emailNotifications", icon: Zap },
                { label: "Internal Push", desc: "For real-time admin portal alerts", key: "pushNotifications", icon: Smartphone },
                { label: "SMS Bridge", desc: "For high priority delivery status", key: "smsNotifications", icon: Globe }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[24px] border border-gray-50 hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-300 group-hover:text-primary transition-colors border border-gray-50">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-normal text-gray-900 uppercase tracking-tighter">{item.label}</p>
                      <p className="text-[11px] font-normal text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    className="data-[state=checked]:bg-primary"
                    checked={(settings as any)[item.key]}
                    onCheckedChange={(checked) => handleSettingChange(item.key, checked)}
                  />
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                Update Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest text-xs">Auth Protocol</h3>
              </div>

              <div className="flex items-center justify-between p-5 bg-purple-50/30 rounded-[24px] border border-purple-50/50">
                <div>
                  <p className="text-sm font-normal text-purple-900 uppercase tracking-tighter">Two-Factor Authentication</p>
                  <p className="text-[11px] font-normal text-purple-600/70 mt-0.5">Recommended for root administrator access</p>
                </div>
                <Switch
                  className="data-[state=checked]:bg-purple-600"
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(checked) => handleSettingChange("twoFactorEnabled", checked)}
                />
              </div>

              <div className="max-w-xs space-y-2">
                <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Session Grace Period (mins)</Label>
                <Input
                  type="number"
                  min="0"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-gray-200 font-normal text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Rotate Root Password
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest text-xs">Delivery Rules</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Delivery Fee</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-normal text-xs text-primary">₹</span>
                    <Input
                      type="number"
                      min="0"
                      value={settings.deliveryCharge}
                      onChange={(e) => handleSettingChange("deliveryCharge", Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-12 pl-10 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Minimum Order</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-normal text-xs text-primary">₹</span>
                    <Input
                      type="number"
                      min="0"
                      value={settings.minOrderValue}
                      onChange={(e) => handleSettingChange("minOrderValue", Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-12 pl-10 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Max Radius (KM)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.maxDeliveryDistance}
                    onChange={(e) => handleSettingChange("maxDeliveryDistance", Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                  />
                </div>
              </div>

              <div className="p-5 bg-blue-50/30 rounded-[28px] border border-blue-50 border-dashed flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <p className="text-[11px] font-normal text-blue-700 leading-relaxed uppercase tracking-tighter">
                  Transactional adjustments will be applied to all newly initiated orders across the ecosystem instantly.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button className="h-14 px-10 rounded-2xl bg-accent text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95">
                Update Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Global Data Export */}
      <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-blue-50/30 ring-1 ring-blue-100/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Globe className="w-32 h-32 text-blue-600" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5" />
              System Backup Area
            </h3>
            <p className="text-[11px] font-normal text-blue-600 uppercase tracking-widest opacity-70">Download raw application configurations in .csv flat structure</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Button
              className="h-12 px-6 rounded-2xl font-normal text-[10px] uppercase tracking-widest bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm disabled:opacity-50"
              onClick={() => handleSecureDownload('exportProducts', 'products_backup.csv')}
              disabled={downloading !== null}
            >
              {downloading === 'products_backup.csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Products
            </Button>
            <Button
              className="h-12 px-6 rounded-2xl font-normal text-[10px] uppercase tracking-widest bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm disabled:opacity-50"
              onClick={() => handleSecureDownload('exportOrders', 'orders_backup.csv')}
              disabled={downloading !== null}
            >
               {downloading === 'orders_backup.csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Orders
            </Button>
            <Button
              className="h-12 px-6 rounded-2xl font-normal text-[10px] uppercase tracking-widest bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm disabled:opacity-50"
              onClick={() => handleSecureDownload('exportCustomers', 'customers_backup.csv')}
              disabled={downloading !== null}
            >
              {downloading === 'customers_backup.csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Customers
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
