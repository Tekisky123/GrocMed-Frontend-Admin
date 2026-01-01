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
import { Settings as SettingsIcon, Save, AlertTriangle, Bell, Lock, Zap } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    // General
    platformName: "GrocMed",
    email: "support@grocmed.com",
    phone: "+1-555-0100",
    address: "123 Commerce Street, City, State 12345",

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,

    // Security
    twoFactorEnabled: false,
    sessionTimeout: 30,

    // Business
    deliveryCharge: 2.99,
    minOrderValue: 10,
    maxDeliveryDistance: 15,
  });

  const [showResetAlert, setShowResetAlert] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage platform configurations and preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-6 border border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Platform Name</Label>
                  <Input
                    value={settings.platformName}
                    onChange={(e) => handleSettingChange("platformName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Support Email</Label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleSettingChange("email", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Support Phone</Label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => handleSettingChange("phone", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <Textarea
                    value={settings.address}
                    onChange={(e) => handleSettingChange("address", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex gap-3">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="p-6 border border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Send updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Send notifications to admin panel
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("pushNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Send updates via SMS (additional charges may apply)
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("smsNotifications", checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex gap-3">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="p-6 border border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Security Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Enable 2FA for enhanced security
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("twoFactorEnabled", checked)
                    }
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      handleSettingChange("sessionTimeout", parseInt(e.target.value))
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Auto logout after specified minutes of inactivity
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-2">Password Security</p>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex gap-3">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card className="p-6 border border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Business Configuration
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Delivery Charge ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.deliveryCharge}
                      onChange={(e) =>
                        handleSettingChange("deliveryCharge", parseFloat(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Minimum Order Value ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.minOrderValue}
                      onChange={(e) =>
                        handleSettingChange("minOrderValue", parseFloat(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Max Delivery Distance (km)</Label>
                    <Input
                      type="number"
                      value={settings.maxDeliveryDistance}
                      onChange={(e) =>
                        handleSettingChange("maxDeliveryDistance", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900 font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Important
                  </p>
                  <p className="text-xs text-yellow-800">
                    Changes to delivery charges and minimum order values will affect future
                    orders immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex gap-3">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="p-6 border border-red-200 bg-red-50">
        <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-sm text-red-800 mb-4">
          These actions cannot be undone. Please proceed with caution.
        </p>

        <AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Reset All Settings to Default</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all settings to their default values. This action cannot be undone.
            </AlertDialogDescription>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                Reset Settings
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
};

export default Settings;
