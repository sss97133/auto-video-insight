
import React from "react";
import { Check, Loader2, X } from "lucide-react";

interface ProgressItemProps {
  status: 'pending' | 'processing' | 'complete' | 'error';
  label: string;
}

export const ProgressItem = ({ status, label }: ProgressItemProps) => (
  <div className="flex items-center gap-2">
    {status === 'complete' ? (
      <Check className="h-5 w-5 text-green-500" />
    ) : status === 'processing' ? (
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    ) : status === 'error' ? (
      <X className="h-5 w-5 text-red-500" />
    ) : (
      <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
    )}
    <span className={
      status === 'complete' ? 'text-green-500' : 
      status === 'processing' ? 'text-blue-500' : 
      status === 'error' ? 'text-red-500' : 
      'text-gray-500'
    }>
      {label}
    </span>
  </div>
);
