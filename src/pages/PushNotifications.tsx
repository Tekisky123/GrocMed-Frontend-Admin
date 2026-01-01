import { useState } from "react";
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
import { Send, Users, Truck, CheckCircle, Bell, Clock, Zap, Target } from "lucide-react";

const PushNotifications = () => {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [notifications] = useState([
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Notification Studio</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Broadcast updates and alerts to your users.</p>
        </div>
        <Button
          onClick={() => setShowComposeModal(true)}
          className="bg-accent hover:bg-accent/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/20 transition-all active:scale-95"
        >
          <Send className="w-5 h-5 mr-2" />
          Create Broadcast
        </Button>
      </div>

      {/* Stats - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 gap-4 custom-scrollbar">
        {[
          { label: "Sent Today", value: notifications.length, color: "text-primary", icon: Bell },
          { label: "Success Rate", value: "98.4%", color: "text-green-600", icon: CheckCircle },
          { label: "Open Rate", value: "82.1%", color: "text-accent", icon: Zap },
          { label: "Audience", value: "12.4k", color: "text-blue-500", icon: Target }
        ].map((stat, i) => (
          <div key={i} className="flex-shrink-0 w-[180px] sm:w-auto p-5 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 group transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-50 rounded-lg group-hover:scale-110 transition-transform">
                <stat.icon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-normal ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* History Table Card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/10">
          <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase tracking-widest">Blast History</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Message Payload</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Audience</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Engagement</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Sent Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {notifications.map((notif) => {
                const engagement = Math.round((notif.read / notif.delivered) * 100);
                return (
                  <tr key={notif.id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Send className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-normal text-gray-900">{notif.title}</p>
                          <p className="text-[11px] text-gray-400 font-normal mt-0.5 line-clamp-1 opacity-80">{notif.message}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="outline" className="px-2.5 py-1 rounded-lg font-normal text-[9px] uppercase tracking-wider bg-primary/5 text-primary border-primary/10">
                        {notif.target === "all" ? "Whole Platform" : notif.target.replace('_', ' ')}
                      </Badge>
                      <p className="text-[10px] text-gray-400 font-normal mt-1 uppercase tracking-tighter">{notif.targetCount} Recepients</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${engagement}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-normal text-gray-900">{engagement}%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-normal uppercase mt-1 tracking-tighter">{notif.read} Opens</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-normal tracking-tight">{notif.sentAt}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compose Dialogue */}
      {showComposeModal && (
        <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
          <DialogContent className="max-w-xl rounded-[32px] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Compose Broadcast</DialogTitle>
              <p className="text-sm text-gray-400 font-normal mt-1">Design your push notification for users.</p>
            </DialogHeader>

            <div className="space-y-5 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Broadcast Title</Label>
                <Input placeholder="What is the main headline?" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Message Body</Label>
                <Textarea placeholder="Write your message detail here..." className="rounded-2xl border-gray-100 bg-gray-50/50 min-h-[100px] font-normal" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Target Segment</Label>
                  <Select defaultValue="customers">
                    <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="delivery_partners">Agents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Send Time</Label>
                  <Select defaultValue="now">
                    <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="schedule">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowComposeModal(false)}
                  className="h-14 flex-1 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-200 transition-all"
                >
                  Discard
                </Button>
                <Button
                  className="h-14 flex-1 rounded-2xl bg-accent text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95"
                  onClick={() => setShowComposeModal(false)}
                >
                  Blast Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PushNotifications;
