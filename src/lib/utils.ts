import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /FBAN|FBAV|Instagram|LinkedInApp|WhatsApp|Twitter|Snapchat|Line|MicroMessenger/i.test(ua) || 
         (ua.includes('wv') && ua.includes('Android')) || 
         (/iPhone|iPod|iPad/i.test(ua) && !/Safari/i.test(ua));
}
