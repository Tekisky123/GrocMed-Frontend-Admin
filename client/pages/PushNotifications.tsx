import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Send, Users, Truck, Check, X, Eye } from "lucide-react";

const PushNotifications = () => {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Order Confirmed",
      message: "Your order #ORD-2024-001 has been confirmed",
      target: "customers",
      targetCount: 450,
      sentAt: "2024-01-15 14:30",
      delivered: 445,
      read: 382,
    },
    {
      id: 2,
      title: "New Delivery Assignment",
      message: "You have been assigned to order #ORD-2024-045",
      target: "delivery_partners",
      targetCount: 85,
      sentAt: "2024-01-15 13:15",
      delivered: 82,
      read: 78,
    },
    {
      id: 3,
      title: "Limited Time Offer",
      message: "Get 50% off on fresh vegetables today only!",
      target: "customers",
      targetCount: 1200,
      sentAt: "2024-01-15 11:00",
      delivered: 1185,
      read: 891,
    },
    {
      id: 4,
      title: "System Maintenance",
      message: "Platform will be under maintenance on 2024-01-20",
      target: "all",
      targetCount: 1500,
      sentAt: "2024-01-14 16:45",
      delivered: 1450,
      read: 1200,
    },
  ]);

  const stats = {
    totalSent: notifications.length,
    totalDelivered: notifications.reduce((sum, n) => sum + n.delivered, 0),
    totalRead: notifications.reduce((sum, n) => sum + n.read, 0),
    avgEngagement:
      Math.round(
        (notifications.reduce((sum, n) => sum + n.read, 0) /
          notifications.reduce((sum, n) => sum + n.delivered, 0)) *
          100
      ) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600">Send and manage push notifications to users</p>
        </div>
        <Button
          onClick={() => setShowComposeModal(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Sent</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Delivered</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalDelivered}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Read</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalRead}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Avg Engagement</p>
          <p className="text-2xl font-bold text-purple-600">{stats.avgEngagement}%</p>
        </Card>
      </div>

      {/* Notification History */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
          <p className="text-sm text-gray-600">Recent notifications sent</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Delivered
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Read
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notifications.map((notif) => {
                const engagement = Math.round((notif.read / notif.delivered) * 100);
                return (
                  <tr key={notif.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{notif.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {notif.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline">
                        {notif.target === "all"
                          ? "All"
                          : notif.target === "customers"
                            ? "Customers"
                            : "Delivery Partners"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {notif.targetCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {notif.delivered}{" "}
                      <span className="text-xs text-gray-500">
                        ({Math.round((notif.delivered / notif.targetCount) * 100)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {notif.read}{" "}
                      <span className="text-xs text-gray-500">
                        ({Math.round((notif.read / notif.delivered) * 100)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${engagement}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-10">
                          {engagement}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{notif.sentAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compose Modal */}
      {showComposeModal && (
        <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose Push Notification</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <Input
                  placeholder="Notification title"
                  className="mt-1"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">Max 50 characters</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <Textarea
                  placeholder="Notification message"
                  className="mt-1 resize-none"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">Max 200 characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Target Audience</Label>
                  <Select defaultValue="customers">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="customers">Customers Only</SelectItem>
                      <SelectItem value="delivery_partners">
                        Delivery Partners Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Send Time</Label>
                  <Select defaultValue="now">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Preview:</strong> This notification will be sent to approximately
                  450 users.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComposeModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setShowComposeModal(false);
                  }}
                >
                  Send Notification
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PushNotifications;
