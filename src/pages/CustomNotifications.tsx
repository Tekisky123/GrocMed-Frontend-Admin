import { useState, useEffect } from "react";
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
    DialogDescription,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Send, Bell, Loader2, Eye, Users, Truck, Globe, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/api/adminApi";
import { format } from "date-fns";

interface NotificationMetric {
    totalTarget: number;
    delivered: number;
    failed: number;
}

interface Notification {
    _id: string;
    title: string;
    message: string;
    targetAudience: 'all' | 'customers' | 'delivery_partners';
    status: 'sent' | 'sending' | 'failed';
    metrics: NotificationMetric;
    sentAt: string;
    createdAt: string;
}

const CustomNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    // Form State
    const [sending, setSending] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState("customers");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getAllNotifications({ limit: 50 }); // Fetch last 50 for now
            if (res.success) {
                setNotifications(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            toast.error("Failed to load notification history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Please provide both title and message");
            return;
        }

        try {
            setSending(true);
            const res = await adminApi.sendNotification({ title, message, target });

            if (res.success) {
                toast.success(res.message);
                setModalOpen(false);
                setTitle("");
                setMessage("");
                // Refresh list
                fetchNotifications();
            } else {
                toast.error(res.message || "Failed to send");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "An error occurred while sending");
        } finally {
            setSending(false);
        }
    };

    const openDetail = (notification: Notification) => {
        setSelectedNotification(notification);
        setDetailModalOpen(true);
    };

    const getAudienceIcon = (audience: string) => {
        switch (audience) {
            case 'customers': return <Users className="h-4 w-4 mr-1 text-blue-500" />;
            case 'delivery_partners': return <Truck className="h-4 w-4 mr-1 text-orange-500" />;
            default: return <Globe className="h-4 w-4 mr-1 text-purple-500" />;
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Custom Notifications</h1>
                    <p className="text-muted-foreground mt-1">Manage and track custom push notifications sent to your users.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
                        <Send className="h-4 w-4" /> Send New Notification
                    </Button>
                </div>
            </div>

            <Card className="border-gray-100 shadow-sm overflow-hidden">
                <div className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead>Date Sent</TableHead>
                                <TableHead>Message Details</TableHead>
                                <TableHead>Target Audience</TableHead>
                                <TableHead>Delivery Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            Loading history...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : notifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No notifications sent yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                notifications.map((notif) => (
                                    <TableRow key={notif._id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="whitespace-nowrap font-medium text-gray-600">
                                            {format(new Date(notif.sentAt), "MMM d, yyyy h:mm a")}
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="font-semibold text-gray-900 truncate">{notif.title}</div>
                                            <div className="text-xs text-gray-500 truncate">{notif.message}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize flex w-fit items-center gap-1 font-normal bg-white">
                                                {getAudienceIcon(notif.targetAudience)}
                                                {notif.targetAudience.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-medium text-green-600">{notif.metrics?.delivered || 0}</span>
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-gray-600">{notif.metrics?.totalTarget || 0}</span>
                                                    <span className="text-xs text-gray-400">Delivered</span>
                                                </div>
                                                {/* Simple progress bar */}
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{
                                                            width: `${(notif.metrics?.totalTarget ? (notif.metrics.delivered / notif.metrics.totalTarget) * 100 : 0)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openDetail(notif)}>
                                                <Eye className="h-4 w-4 text-gray-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* CREATE MODAL */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Send Custom Notification</DialogTitle>
                        <DialogDescription>
                            Compose a message to send to your users. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Notification Title</Label>
                            <Input
                                placeholder="e.g., Flash Sale Alert! ⚡"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Target Audience</Label>
                            <Select value={target} onValueChange={setTarget}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customers">Customers Only</SelectItem>
                                    <SelectItem value="delivery_partners">Delivery Partners Only</SelectItem>
                                    <SelectItem value="all">Everyone (All Users)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Message Body</Label>
                            <Textarea
                                placeholder="Type your message here..."
                                className="min-h-[100px]"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {message.length} characters
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={sending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSend} disabled={sending} className="gap-2">
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {sending ? "Sending..." : "Send Now"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DETAIL MODAL */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Notification Details</DialogTitle>
                        <DialogDescription className="flex items-center gap-2">
                            Sent on {selectedNotification && format(new Date(selectedNotification.sentAt), "PPP p")}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedNotification && (
                        <div className="space-y-6">
                            {/* Preview Card */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bell className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{selectedNotification.title}</h4>
                                        <p className="text-gray-600 mt-1">{selectedNotification.message}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="p-4 border-blue-100 bg-blue-50/50">
                                    <div className="text-sm font-medium text-blue-600 mb-1">Target Audience</div>
                                    <div className="flex items-center gap-2">
                                        {getAudienceIcon(selectedNotification.targetAudience)}
                                        <span className="text-xl font-bold text-gray-900 capitalize">
                                            {selectedNotification.targetAudience.replace('_', ' ')}
                                        </span>
                                    </div>
                                </Card>

                                <Card className="p-4 border-green-100 bg-green-50/50">
                                    <div className="text-sm font-medium text-green-600 mb-1">Successfully Delivered</div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <span className="text-2xl font-bold text-gray-900">
                                            {selectedNotification.metrics?.delivered || 0}
                                        </span>
                                    </div>
                                </Card>

                                <Card className="p-4 border-red-100 bg-red-50/50">
                                    <div className="text-sm font-medium text-red-600 mb-1">Failed / Invalid</div>
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                        <span className="text-2xl font-bold text-gray-900">
                                            {selectedNotification.metrics?.failed || 0}
                                        </span>
                                    </div>
                                </Card>
                            </div>

                            <div className="text-xs text-center text-muted-foreground">
                                ID: {selectedNotification._id}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomNotifications;
