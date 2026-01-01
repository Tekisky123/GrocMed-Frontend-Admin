import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Maximize2 } from 'lucide-react';

interface ImageCropperProps {
    image: string;
    isOpen: boolean;
    onClose: () => void;
    onCropComplete: (croppedImage: Blob) => void;
}

const ASPECT_RATIOS = [
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: 'Perfect Fit', value: 1 }, // Defaulting to 1:1 for product listings
];

export const ImageCropper: React.FC<ImageCropperProps> = ({
    image,
    isOpen,
    onClose,
    onCropComplete,
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(ASPECT_RATIOS[0].value);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: Point) => setCrop(crop);
    const onZoomChange = (zoom: number) => setZoom(zoom);

    const onComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const handleSave = async () => {
        if (croppedAreaPixels) {
            setIsProcessing(true);
            try {
                const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
                if (croppedImageBlob) {
                    onCropComplete(croppedImageBlob);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-5xl h-[90vh] sm:h-[80vh] md:h-[600px] rounded-[32px] p-0 border-none shadow-2xl overflow-hidden bg-white">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left: Cropper Area */}
                    <div className="relative flex-1 bg-slate-950 min-h-[300px] md:min-h-0">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onComplete}
                        />
                        <div className="absolute top-6 left-6 z-10">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20">
                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Editor Mode</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls Area */}
                    <div className="w-full md:w-[350px] flex flex-col bg-white border-l border-gray-50">
                        <DialogHeader className="p-6 border-b border-gray-50 shrink-0">
                            <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">
                                Adjust Product Image
                            </DialogTitle>
                            <p className="text-[10px] text-gray-400 font-normal uppercase tracking-widest mt-1">Fine-tune your visual asset</p>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Aspect Ratio</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ASPECT_RATIOS.map((ratio) => (
                                        <Button
                                            key={ratio.label}
                                            variant={aspect === ratio.value ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setAspect(ratio.value)}
                                            className={`rounded-xl px-4 font-normal text-xs h-10 transition-all ${aspect === ratio.value
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-gray-500 border-gray-100 hover:bg-gray-50"
                                                }`}
                                        >
                                            {ratio.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Magnification</Label>
                                    <span className="text-[10px] font-normal text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{Math.round(zoom * 100)}%</span>
                                </div>
                                <div className="px-1">
                                    <Slider
                                        value={[zoom]}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        onValueChange={(vals) => setZoom(vals[0])}
                                        className="py-2"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex gap-3">
                                <Maximize2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-700 leading-relaxed font-normal uppercase tracking-tight">
                                    Drag the image to re-position. use the slider to focus on product details.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-gray-50/50 shrink-0 flex-row gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={isProcessing}
                                className="h-14 flex-1 rounded-2xl font-normal uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-900 hover:bg-white/50 transition-all border border-transparent hover:border-gray-100"
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isProcessing}
                                className="h-14 flex-2 rounded-2xl bg-accent text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 transition-all active:scale-95 hover:bg-accent/90"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Save Asset"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
