import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Globe, ShieldAlert, Download, Loader2, Clock, Plus, Trash2, Edit2, Save, X, CheckCircle2, QrCode, Upload, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/api/adminApi";
import { deliverySlotApi, DeliverySlot } from "@/api/deliverySlotApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const [settings, setSettings] = useState({
    deliveryCharge: 30.00,
    minOrderValue: 1000.00,
    freeDeliveryThreshold: 1500.00,
    maxOrdersPerDay: 50,
    maxOrdersPerSlot: 20,
    paymentQrUrl: null as string | null,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrRemoving, setQrRemoving] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);
  
  const [restoring, setRestoring] = useState(false);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  
  const [securityModal, setSecurityModal] = useState({
    isOpen: false,
    action: null as 'export' | 'restore' | null,
    title: "",
    description: "",
    password: "",
    pendingFile: null as File | null,
  });

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
          maxOrdersPerDay: res.data.maxOrdersPerDay || 50,
          maxOrdersPerSlot: res.data.maxOrdersPerSlot || 20,
          paymentQrUrl: res.data.paymentQrUrl || null,
        });
      }
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadQr = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    setQrUploading(true);
    try {
      const res = await adminApi.uploadPaymentQr(file);
      if (res.success) {
        setSettings(prev => ({ ...prev, paymentQrUrl: res.data.paymentQrUrl }));
        toast.success('Payment QR image uploaded successfully!');
      } else {
        toast.error(res.message || 'Upload failed');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to upload image');
    } finally {
      setQrUploading(false);
      if (qrFileRef.current) qrFileRef.current.value = '';
    }
  };

  const handleRemoveQr = async () => {
    if (!confirm('Remove the current payment QR image?')) return;
    setQrRemoving(true);
    try {
      const res = await adminApi.deletePaymentQr();
      if (res.success) {
        setSettings(prev => ({ ...prev, paymentQrUrl: null }));
        toast.success('Payment QR image removed');
      }
    } catch (e) {
      toast.error('Failed to remove image');
    } finally {
      setQrRemoving(false);
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
      const res = await adminApi.updateSettings({
        deliveryCharge: settings.deliveryCharge,
        minOrderValue: settings.minOrderValue,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        maxOrdersPerDay: settings.maxOrdersPerDay,
        maxOrdersPerSlot: settings.maxOrdersPerSlot,
      });
      if (res.success) {
        toast.success('Settings updated successfully!');
        setSettings(prev => ({
          ...prev,
          deliveryCharge: res.data.deliveryCharge,
          minOrderValue: res.data.minOrderValue,
          freeDeliveryThreshold: res.data.freeDeliveryThreshold,
          maxOrdersPerDay: res.data.maxOrdersPerDay,
          maxOrdersPerSlot: res.data.maxOrdersPerSlot,
        }));
      }
    } catch (e) {
      toast.error('Failed to update Settings');
    } finally {
      setSaving(false);
    }
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  // Delivery Slots State & Logic
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DeliverySlot | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState<DeliverySlot>({
    name: "",
    startTime: "09:00",
    endTime: "12:00",
    isActive: true,
    displayOrder: 0,
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await deliverySlotApi.getAll();
      if (res.success) {
        setSlots(res.data);
      }
    } catch (e) {
      toast.error("Failed to load delivery slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!newSlot.name) {
      toast.error("Please enter a slot name");
      return;
    }
    try {
      const res = await deliverySlotApi.create(newSlot);
      if (res.success) {
        toast.success("Delivery slot created!");
        setSlots([...slots, res.data]);
        setIsAdding(false);
        setNewSlot({
          name: "",
          startTime: "09:00",
          endTime: "12:00",
          isActive: true,
          displayOrder: slots.length + 1,
        });
      }
    } catch (e) {
      toast.error("Failed to create slot");
    }
  };

  const handleUpdateSlot = async () => {
    if (!editingId || !editForm) return;
    try {
      const res = await deliverySlotApi.update(editingId, editForm);
      if (res.success) {
        toast.success("Slot updated!");
        setSlots(slots.map((s) => (s._id === editingId ? res.data : s)));
        setEditingId(null);
        setEditForm(null);
      }
    } catch (e) {
      toast.error("Failed to update slot");
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;
    try {
      const res = await deliverySlotApi.delete(id);
      if (res.success) {
        toast.success("Slot deleted");
        setSlots(slots.filter((s) => s._id !== id));
      }
    } catch (e) {
      toast.error("Failed to delete slot");
    }
  };

  const toggleSlotStatus = async (slot: DeliverySlot) => {
    try {
      const res = await deliverySlotApi.update(slot._id!, { isActive: !slot.isActive });
      if (res.success) {
        setSlots(slots.map((s) => (s._id === slot._id ? res.data : s)));
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

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

  const triggerExport = () => {
    setSecurityModal({
      isOpen: true,
      action: "export",
      title: "Confirm Database Export",
      description: "You are about to export a complete copy of the database. For security, please enter your current administrator password to authorize the download.",
      password: "",
      pendingFile: null,
    });
  };

  const handleDatabaseRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        if (!backupData.version || !backupData.data) {
          toast.error("Invalid database backup file format");
          return;
        }

        setSecurityModal({
          isOpen: true,
          action: "restore",
          title: "Confirm Database Restore",
          description: "WARNING: Restoring the database will overwrite ALL existing collections and data. This action is permanent and cannot be undone. Please enter your administrator password to authorize.",
          password: "",
          pendingFile: file,
        });
      } catch (err) {
        toast.error("Error reading or parsing backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleSecurityConfirm = async () => {
    if (!securityModal.password) {
      toast.error("Password is required");
      return;
    }

    const { action, password, pendingFile } = securityModal;
    setSecurityModal((prev) => ({ ...prev, isOpen: false }));

    if (action === "export") {
      try {
        setDownloading("grocmed_db_backup.json");
        const res = await adminApi.exportDatabaseBackup(password);
        
        const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
        const filename = `grocmed_db_backup_${timestamp}.json`;
        
        const jsonStr = JSON.stringify(res, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success("Database exported successfully!");
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to export database (Incorrect password)");
      } finally {
        setDownloading(null);
      }
    } else if (action === "restore" && pendingFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const backupData = JSON.parse(text);

          setRestoring(true);
          const res = await adminApi.restoreDatabaseBackup({
            ...backupData,
            password,
          });
          if (res.success) {
            toast.success("Database restored successfully!");
            await fetchSettings();
            await fetchSlots();
          } else {
            toast.error(res.message || "Failed to restore database");
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Error restoring database");
        } finally {
          setRestoring(false);
          if (restoreFileRef.current) restoreFileRef.current.value = "";
        }
      };
      reader.readAsText(pendingFile);
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

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-gray-100/50 p-1 rounded-2xl h-14 border border-gray-100">
          <TabsTrigger value="general" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all h-full">General Settings</TabsTrigger>
          <TabsTrigger value="slots" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all h-full">Delivery Slots</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8 mt-0 focus-visible:ring-0">
          <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest text-xs">Delivery Rules</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Max Orders / Day</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      value={settings.maxOrdersPerDay}
                      onChange={(e) => handleSettingChange("maxOrdersPerDay", Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Max Orders / Slot</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      value={settings.maxOrdersPerSlot}
                      onChange={(e) => handleSettingChange("maxOrdersPerSlot", Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
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
          <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-blue-50/30 ring-1 ring-blue-100/50 overflow-hidden relative mt-8 space-y-8">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Globe className="w-32 h-32 text-blue-600" />
            </div>
            
            {/* CSV Backup */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-blue-100/60">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  System Backup Area (CSV)
                </h3>
                <p className="text-[11px] font-normal text-blue-600 uppercase tracking-widest opacity-70">Download raw application configurations in .csv flat structure</p>
              </div>

              <div className="flex flex-wrap gap-3 mt-2 lg:mt-0">
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

            {/* JSON DB Backup & Restore */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Database Backup & Recovery (JSON)
                </h3>
                <p className="text-[11px] font-normal text-blue-600 uppercase tracking-widest opacity-70">
                  Export the complete database to JSON for safe-keeping, or restore from a modified JSON file.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 sm:items-center">
                <Button
                  className="h-12 px-6 rounded-2xl font-normal text-[10px] uppercase tracking-widest bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm disabled:opacity-50 w-full sm:w-auto"
                  onClick={triggerExport}
                  disabled={downloading !== null || restoring}
                >
                  {downloading === 'grocmed_db_backup.json' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Export Database (JSON)
                </Button>
                
                <input
                  type="file"
                  ref={restoreFileRef}
                  onChange={handleDatabaseRestoreFileSelected}
                  accept=".json"
                  className="hidden"
                />
                
                <Button
                  className="h-12 px-6 rounded-2xl font-normal text-[10px] uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-50 w-full sm:w-auto"
                  onClick={() => restoreFileRef.current?.click()}
                  disabled={downloading !== null || restoring}
                >
                  {restoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Restore Database (JSON)
                </Button>
              </div>
            </div>
          </Card>

          {/* Payment QR Upload Card */}
          <Card className="p-6 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 space-y-6 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl">
                <QrCode className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Payment QR / UPI Image</h3>
                <p className="text-[11px] text-gray-400 font-normal mt-0.5">Shown to delivery partners when collecting online payment at doorstep</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Preview */}
              <div className="space-y-3">
                <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Current Image</Label>
                <div className={`relative w-full aspect-square rounded-3xl overflow-hidden border-2 flex items-center justify-center ${
                  settings.paymentQrUrl
                    ? 'border-orange-100 bg-orange-50/30'
                    : 'border-dashed border-gray-200 bg-gray-50'
                }`}>
                  {settings.paymentQrUrl ? (
                    <>
                      <img
                        src={settings.paymentQrUrl}
                        alt="Payment QR"
                        className="w-full h-full object-contain p-4"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-3 right-3 w-8 h-8 rounded-xl shadow-md"
                        onClick={handleRemoveQr}
                        disabled={qrRemoving}
                      >
                        {qrRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300 p-6">
                      <ImageOff className="w-10 h-10" />
                      <p className="text-xs font-medium text-gray-400 text-center">No QR image uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Zone */}
              <div className="space-y-4">
                <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Upload New Image</Label>
                <input
                  ref={qrFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadQr(f); }}
                />
                <div
                  className="w-full aspect-square rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50/20 hover:bg-orange-50/50 hover:border-orange-300 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 p-6 group"
                  onClick={() => !qrUploading && qrFileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleUploadQr(f);
                  }}
                >
                  {qrUploading ? (
                    <>
                      <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                      <p className="text-sm font-bold text-orange-500">Uploading to cloud...</p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-orange-100 rounded-2xl group-hover:scale-105 transition-transform">
                        <Upload className="w-8 h-8 text-orange-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-700">Click or drag & drop</p>
                        <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WEBP — max 5MB</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-blue-600 leading-relaxed font-normal">
                    Upload your UPI QR code or bank payment details image. Delivery partners will see this when a customer pays online at the door. Replaces the default QR bundled in the app.
                  </p>
                </div>
              </div>
            </div>
          </Card>

        </TabsContent>

        {/* ─── Delivery Slots Tab ─── */}
        <TabsContent value="slots" className="mt-0 focus-visible:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Slot List */}
            <div className="lg:col-span-2 space-y-4">
              {slotsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
              ) : slots.length === 0 && !isAdding ? (
                <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 rounded-3xl">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">No slots defined</p>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Create windows to enable scheduled delivery</p>
                  </div>
                  <Button onClick={() => setIsAdding(true)} className="rounded-2xl bg-accent px-6 uppercase text-[10px] tracking-widest font-black">
                    Add First Slot
                  </Button>
                </Card>
              ) : (
                slots.map((slot) => (
                  <Card key={slot._id} className="p-4 sm:p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {editingId === slot._id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-gray-400">Slot Name</Label>
                          <Input
                            value={editForm?.name}
                            onChange={(e) => setEditForm({ ...editForm!, name: e.target.value })}
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-gray-400">Start Time</Label>
                          <Input
                            type="time"
                            value={editForm?.startTime}
                            onChange={(e) => setEditForm({ ...editForm!, startTime: e.target.value })}
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-gray-400">End Time</Label>
                          <Input
                            type="time"
                            value={editForm?.endTime}
                            onChange={(e) => setEditForm({ ...editForm!, endTime: e.target.value })}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-2xl ${slot.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <Clock className={`w-5 h-5 ${slot.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 tracking-tight">{slot.name}</h4>
                          <p className="text-xs text-gray-500 uppercase tracking-widest font-normal">{slot.startTime} - {slot.endTime}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {editingId === slot._id ? (
                        <>
                          <Button onClick={handleUpdateSlot} size="icon" className="rounded-xl bg-green-500 hover:bg-green-600">
                            <Save className="w-4 h-4 text-white" />
                          </Button>
                          <Button onClick={() => setEditingId(null)} size="icon" variant="ghost" className="rounded-xl">
                            <X className="w-4 h-4 text-gray-400" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mr-4 bg-gray-50 px-3 py-1.5 rounded-2xl">
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{slot.isActive ? 'Active' : 'Disabled'}</span>
                             <Switch checked={slot.isActive} onCheckedChange={() => toggleSlotStatus(slot)} />
                          </div>
                          <Button onClick={() => { setEditingId(slot._id!); setEditForm(slot); }} size="icon" variant="ghost" className="rounded-xl hover:bg-blue-50 hover:text-blue-600">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDeleteSlot(slot._id!)} size="icon" variant="ghost" className="rounded-xl hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))
              )}

              {isAdding && (
                <Card className="p-6 border-2 border-dashed border-accent/20 bg-accent/5 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-xl">
                      <Plus className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">New Delivery Window</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">Label</Label>
                      <Input
                        placeholder="e.g. Afternoon Slot"
                        value={newSlot.name}
                        onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                        className="h-12 rounded-2xl bg-white border-none shadow-sm font-normal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">Start</Label>
                      <Input
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                        className="h-12 rounded-2xl bg-white border-none shadow-sm font-normal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">End</Label>
                      <Input
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                        className="h-12 rounded-2xl bg-white border-none shadow-sm font-normal"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-2xl uppercase text-[10px] tracking-widest font-black">Cancel</Button>
                    <Button onClick={handleCreateSlot} className="rounded-2xl bg-accent px-8 uppercase text-[10px] tracking-widest font-black shadow-lg shadow-accent/20">Save Slot</Button>
                  </div>
                </Card>
              )}

              {!isAdding && slots.length > 0 && (
                 <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full h-14 border-dashed border-2 rounded-3xl uppercase text-[10px] tracking-widest font-black text-gray-400 hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Time Window
                 </Button>
              )}
            </div>

            {/* Info / Tips */}
            <div className="space-y-6">
              <Card className="p-6 border-none shadow-sm rounded-3xl bg-blue-600 text-white space-y-4">
                <CheckCircle2 className="w-8 h-8 opacity-50" />
                <h3 className="text-lg font-black tracking-tight leading-tight">Delivery Logic Rules</h3>
                <div className="space-y-3 opacity-90">
                  <p className="text-[11px] leading-relaxed uppercase tracking-widest font-normal">
                    1. Customers will see these slots during checkout.
                  </p>
                  <p className="text-[11px] leading-relaxed uppercase tracking-widest font-normal">
                    2. If the "Max Orders / Day" limit is reached, the system will block same-day delivery.
                  </p>
                  <p className="text-[11px] leading-relaxed uppercase tracking-widest font-normal">
                    3. Disabled slots will not appear in the customer application.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Security Verification Modal */}
      <Dialog open={securityModal.isOpen} onOpenChange={(val) => !val && setSecurityModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-[400px] rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${
              securityModal.action === "restore" ? "bg-red-50" : "bg-blue-50"
            }`}>
              <ShieldAlert className={`w-6 h-6 ${
                securityModal.action === "restore" ? "text-red-500" : "text-blue-500"
              }`} />
            </div>

            <DialogHeader>
              <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">
                {securityModal.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-400 font-bold pt-2">
                {securityModal.description}
              </DialogDescription>
            </DialogHeader>

            <div className="w-full text-left space-y-2 pt-2">
              <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                Admin Password
              </Label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={securityModal.password}
                onChange={(e) => setSecurityModal(prev => ({ ...prev, password: e.target.value }))}
                className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-normal"
              />
            </div>

            <DialogFooter className="w-full flex sm:flex-row flex-col gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))}
                className="h-12 flex-1 rounded-2xl border-gray-100 font-bold uppercase text-xs tracking-widest text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200 transition-all w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSecurityConfirm}
                className={`h-12 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 w-full sm:w-auto text-white ${
                  securityModal.action === "restore" 
                    ? "bg-red-500 hover:bg-red-600 shadow-red-200" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                }`}
              >
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
