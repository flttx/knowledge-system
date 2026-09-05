"use client";
import { CaptureForm } from "./capture-form";
export interface CompactCaptureDialogProps { open: boolean; onClose: () => void; sourceId?: string }
export function CompactCaptureDialog(props: CompactCaptureDialogProps) { return <CaptureForm modal {...props} />; }
