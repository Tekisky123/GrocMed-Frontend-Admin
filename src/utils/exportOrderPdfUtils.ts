import { orderApi } from "@/api/orderApi";
import { toast } from "sonner";

export const downloadOrderInvoicePDF = async (order: any) => {
    try {
        const orderId = order._id;
        const blob = await orderApi.downloadInvoice(orderId);
        
        // Create a link element, hide it, direct it to the blob, and click it
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice_${orderId.slice(-8).toUpperCase()}.pdf`);
        
        // Append to html link element page
        document.body.appendChild(link);
        
        // Start download
        link.click();
        
        // Clean up and remove the link
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
    } catch (error) {
        console.error("Failed to download invoice:", error);
        toast.error("Failed to download invoice. Please try again.");
    }
};
