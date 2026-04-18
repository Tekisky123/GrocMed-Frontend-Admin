import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Globe, ShieldAlert, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/api/adminApi";

const Settings = () => {
  const [settings, setSettings] = useState({
    deliveryCharge: 30.00,
    minOrderValue: 1000.00,
    freeDeliveryThreshold: 1500.00,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await adminApi.getSettings();
      if (res.success && res.data) {
        setSettings({
          deliveryCharge: res.data.deliveryCharge || 30.00,
          minOrderValue: res.data.minOrderValue || 1000.00,
          freeDeliveryThreshold: res.data.freeDeliveryThreshold || 1500.00,
        });
      }
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateSettings(settings);
      if (res.success) {
        toast.success('Settings updated successfully!');
        setSettings({
            deliveryCharge: res.data.deliveryCharge,
            minOrderValue: res.data.minOrderValue,
            freeDeliveryThreshold: res.data.freeDeliveryThreshold,
        });
      }
    } catch (e) {
      toast.error('Failed to update Settings');
    } finally {
      setSaving(false);
    }
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  const handleSecureDownload = async (action: 'products' | 'orders' | 'customers', filename: string) => {
    try {
      setDownloading(filename);
      let blob;

      if (action === 'products') {
        blob = await adminApi.exportProducts();
      } else if (action === 'orders') {
        blob = await adminApi.exportOrders();
      } else if (action === 'customers') {
        blob = await adminApi.exportCustomers();
      }
      
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

  if (loading) {
     return <div className="p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Platform Configuration</h1>
        <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Manage delivery limits and global data backup.</p>
      </div>

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
              <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Minimum Order (₹)</Label>
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
              <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Free Delivery Above (₹)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-normal text-xs text-primary">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => handleSettingChange("freeDeliveryThreshold", Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-12 pl-10 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Delivery Fee (₹)</Label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-normal text-xs text-primary">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={settings.deliveryCharge}
                  onChange={(e) => handleSettingChange("deliveryCharge", Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-12 pl-10 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                />
              </div>
            </div>
          </div>

          <div className="p-5 bg-blue-50/30 rounded-[28px] border border-blue-50 border-dashed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <p className="text-[11px] font-normal text-blue-700 leading-relaxed uppercase tracking-tighter">
              Transactional adjustments will be applied to all newly initiated orders across the ecosystem instantly via the configurations API.
            </p>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button 
             onClick={saveSettings} 
             disabled={saving}
             className="h-14 px-10 rounded-2xl bg-accent text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Update Settings
          </Button>
        </div>
      </Card>


      {/* Global Data Export */}
      <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-blue-50/30 ring-1 ring-blue-100/50 overflow-hidden relative mt-8">
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
              onClick={() => handleSecureDownload('products', 'products_backup.csv')}
              disabled={downloading !== null}
            >
              {downloading === 'products_backup.csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Products
            </Button>
            <Button
              className="h-12 px-6 rounded-2xl font-normal text-[10px] uppercase tracking-widest bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm disabled:opacity-50"
              onClick={() => handleSecureDownload('orders', 'orders_backup.csv')}
              disabled={downloading !== null}
            >
               {downloading === 'orders_backup.csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Orders
            </Button>
            <Button
              className="h-12 px-6 rounded-2xl font-normal text-[10px] uppercase tracking-widest bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm disabled:opacity-50"
              onClick={() => handleSecureDownload('customers', 'customers_backup.csv')}
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
